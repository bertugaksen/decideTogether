import { WebSocket } from 'ws';
import { Room, Participant, ServerMessage, Venue } from './types.js';
import { VenueService, isValidCoordinate } from './services/venueService.js';
import { MOCK_DISTRICTS } from './services/mockVenues.js';
import { duelEngine } from './services/duelEngine.js';
import { IRoomRepository } from './repositories/roomRepository.js';
import { SqliteRoomRepository } from './repositories/sqliteRoomRepository.js';

const FOOD_NICKNAMES = [
  'Aç Panda',
  'Kararsız Koala',
  'Gurme Tilki',
  'Keyifli Kedi',
  'Obur Rakun',
  'Lezzet Avcısı',
  'Aç Baykuş',
];

interface ConnectedClient {
  ws: WebSocket;
  userId: string;
  roomCode: string;
}

export class RoomManager {
  private repository: IRoomRepository;
  private clients: Map<WebSocket, ConnectedClient> = new Map();
  private disconnectTimeouts: Map<string, NodeJS.Timeout> = new Map();
  private venueService: VenueService = new VenueService();
  private cleanupInterval?: NodeJS.Timeout;

  constructor(repository: IRoomRepository = new SqliteRoomRepository()) {
    this.repository = repository;

    // Periodic cleanup of abandoned rooms (>24h TTL) every 30 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredRooms();
    }, 30 * 60 * 1000);
    this.cleanupInterval.unref(); // Avoid holding Node process open
  }

  public cleanupExpiredRooms(maxAgeMs: number = 24 * 60 * 60 * 1000): number {
    const count = this.repository.cleanupExpired(maxAgeMs);
    if (count > 0) {
      console.log(`[RoomManager] Cleaned up ${count} expired room(s)`);
    }
    return count;
  }

  public getActiveRoomCount(): number {
    return this.repository.listActive().length;
  }

  public getRepository(): IRoomRepository {
    return this.repository;
  }

  public destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = undefined;
    }
    for (const timeout of this.disconnectTimeouts.values()) {
      clearTimeout(timeout);
    }
    this.disconnectTimeouts.clear();
  }

  // Helper to generate a unique 4-digit PIN (1000 - 9999)
  public generateUniquePin(): string {
    let pin: string;
    let attempts = 0;
    do {
      pin = Math.floor(1000 + Math.random() * 9000).toString();
      attempts++;
      if (attempts > 9000) {
        throw new Error('No available room codes');
      }
    } while (this.repository.get(pin) !== null);
    return pin;
  }

  // Create a new room with the host
  public async createRoom(
    ws: WebSocket,
    customNickname?: string,
    initialLocation?: { districtId?: string; coords?: { lat: number; lng: number } }
  ): Promise<{ room: Room; host: Participant }> {
    // If this socket was previously attached to another room, detach cleanly first
    if (this.clients.has(ws)) {
      this.leaveRoom(ws);
    }

    const code = this.generateUniquePin();
    const hostId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const nickname = customNickname?.trim() || FOOD_NICKNAMES[0];

    const host: Participant = {
      id: hostId,
      nickname,
      role: 'host',
      connected: true,
    };

    const resolved = await this.venueService.resolveLocationAndVenues(
      initialLocation?.districtId,
      initialLocation?.coords
    );

    const room: Room = {
      code,
      hostId,
      status: 'waiting',
      participants: {
        [hostId]: host,
      },
      createdAt: Date.now(),
      lastActiveAt: Date.now(),
      location: resolved.location,
      venues: resolved.venues,
    };

    this.repository.save(room);
    this.clients.set(ws, { ws, userId: hostId, roomCode: code });

    console.log(`[RoomManager] Room created: PIN=${code}, Host=${host.nickname} (${hostId}), Loc=${resolved.location.label}, Venues=${resolved.venues.length}`);

    this.sendTo(ws, {
      type: 'ROOM_CREATED',
      roomCode: code,
      user: host,
      room,
    });

    return { room, host };
  }

  // Join an existing room (or reconnect with an existing userId)
  public joinRoom(
    ws: WebSocket,
    roomCode: string,
    existingUserId?: string,
    customNickname?: string
  ): { success: boolean; error?: string } {
    const room = this.repository.get(roomCode);
    if (!room) {
      const activePins = this.repository.listActive().map((r) => r.code).join(', ') || 'none';
      console.warn(`[RoomManager] Join failed: PIN=${roomCode} not found. Active rooms: [${activePins}]`);
      this.sendTo(ws, { type: 'ERROR', message: 'Oda bulunamadı (Geçersiz PIN)' });
      return { success: false, error: 'Oda bulunamadı' };
    }

    room.lastActiveAt = Date.now();

    // Case 1: Reconnecting existing participant
    if (existingUserId && room.participants[existingUserId]) {
      const participant = room.participants[existingUserId];
      participant.connected = true;
      delete participant.disconnectedAt;
      if (customNickname?.trim()) {
        participant.nickname = customNickname.trim();
      }

      // Clear any pending disconnect timer
      const timeoutKey = `${roomCode}:${existingUserId}`;
      const existingTimeout = this.disconnectTimeouts.get(timeoutKey);
      if (existingTimeout) {
        clearTimeout(existingTimeout);
        this.disconnectTimeouts.delete(timeoutKey);
      }

      this.clients.set(ws, { ws, userId: existingUserId, roomCode });
      console.log(`[RoomManager] Participant reconnected: PIN=${roomCode}, User=${participant.nickname} (${existingUserId})`);

      this.repository.save(room);

      // Notify this user
      this.sendTo(ws, {
        type: 'ROOM_JOINED',
        room,
        user: participant,
      });

      // Notify peer about reconnection
      this.broadcastToRoom(roomCode, {
        type: 'PEER_RECONNECTED',
        participant,
      }, ws);

      return { success: true };
    }

    // Case 2: New participant joining
    // If this socket was already mapped to the same room with an active user, return idempotently
    const existingClient = this.clients.get(ws);
    if (existingClient && existingClient.roomCode === roomCode && room.participants[existingClient.userId]) {
      const participant = room.participants[existingClient.userId];
      this.sendTo(ws, {
        type: 'ROOM_JOINED',
        room,
        user: participant,
      });
      return { success: true };
    }

    // If a previous peer disconnected, allow this new connection to reclaim/replace the peer slot
    if (room.peerId && room.participants[room.peerId] && !room.participants[room.peerId].connected) {
      const oldPeerId = room.peerId;
      console.log(`[RoomManager] Replacing disconnected peer ${oldPeerId} with fresh connection`);
      delete room.participants[oldPeerId];
      const oldTimeoutKey = `${roomCode}:${oldPeerId}`;
      const existingTimeout = this.disconnectTimeouts.get(oldTimeoutKey);
      if (existingTimeout) {
        clearTimeout(existingTimeout);
        this.disconnectTimeouts.delete(oldTimeoutKey);
      }
      delete room.peerId;
    }

    const activeParticipants = Object.values(room.participants).filter((p) => p.connected).length;
    if (activeParticipants >= 2) {
      console.warn(`[RoomManager] Join failed: PIN=${roomCode} is full (2 active participants)`);
      this.sendTo(ws, { type: 'ERROR', message: 'Oda dolu (Maksimum 2 kişi)' });
      return { success: false, error: 'Oda dolu' };
    }

    const peerId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const nickname = customNickname?.trim() || FOOD_NICKNAMES[1] || 'Kararsız Koala';

    const peer: Participant = {
      id: peerId,
      nickname,
      role: 'peer',
      connected: true,
    };

    room.peerId = peerId;
    room.participants[peerId] = peer;
    room.status = 'ready';

    this.repository.save(room);
    this.clients.set(ws, { ws, userId: peerId, roomCode });
    console.log(`[RoomManager] Peer joined: PIN=${roomCode}, Peer=${peer.nickname} (${peerId}), Venues=${room.venues?.length || 0}`);

    // Send room state to peer
    this.sendTo(ws, {
      type: 'ROOM_JOINED',
      room,
      user: peer,
    });

    // Notify host that peer joined
    this.broadcastToRoom(roomCode, {
      type: 'PEER_JOINED',
      participant: peer,
    }, ws);

    // Notify both that room is ready
    this.broadcastToRoom(roomCode, {
      type: 'ROOM_READY',
      roomCode,
    });

    return { success: true };
  }

  // Handle explicit LEAVE_ROOM message from client (fixes dangling participant bug)
  public leaveRoom(ws: WebSocket): boolean {
    const client = this.clients.get(ws);
    if (!client) return false;

    this.clients.delete(ws);
    const { roomCode, userId } = client;

    // Clear any pending disconnect timeout for this user
    const timeoutKey = `${roomCode}:${userId}`;
    const existingTimeout = this.disconnectTimeouts.get(timeoutKey);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
      this.disconnectTimeouts.delete(timeoutKey);
    }

    const room = this.repository.get(roomCode);
    if (!room) return true;

    delete room.participants[userId];

    // Clear active duel timer if someone leaves mid-duel
    if (room.duelState?.timer) {
      clearTimeout(room.duelState.timer);
      room.duelState.timer = undefined;
    }

    const remainingIds = Object.keys(room.participants);
    if (remainingIds.length === 0) {
      this.repository.delete(roomCode);
      console.log(`[RoomManager] Room ${roomCode} closed (all participants left)`);
      return true;
    }

    // Promote remaining participant to host if host left, and reset room to waiting
    const remainingId = remainingIds[0];
    const remainingParticipant = room.participants[remainingId];
    if (remainingParticipant) {
      remainingParticipant.role = 'host';
      room.hostId = remainingId;
    }
    delete room.peerId;
    room.status = 'waiting';
    delete room.votes;
    delete room.progress;
    delete room.matchedVenue;
    delete room.duelState;
    room.lastActiveAt = Date.now();

    this.repository.save(room);

    this.broadcastToRoom(roomCode, {
      type: 'ROOM_STATE',
      room,
    });

    return true;
  }

  // Handle socket disconnect with 30s grace period
  public handleDisconnect(ws: WebSocket): void {
    const client = this.clients.get(ws);
    if (!client) return;

    this.clients.delete(ws);
    const { roomCode, userId } = client;
    const room = this.repository.get(roomCode);
    if (!room) return;

    const participant = room.participants[userId];
    if (!participant) return;

    participant.connected = false;
    participant.disconnectedAt = Date.now();
    this.repository.save(room);
    const reconnectWindowMs = 30000;

    // Inform remaining peer that partner disconnected
    this.broadcastToRoom(roomCode, {
      type: 'PEER_DISCONNECTED',
      userId,
      reconnectDeadlineMs: reconnectWindowMs,
    });

    // Schedule 30s removal if not reconnected
    const timeoutKey = `${roomCode}:${userId}`;
    const timeout = setTimeout(() => {
      this.disconnectTimeouts.delete(timeoutKey);
      const currentRoom = this.repository.get(roomCode);
      if (currentRoom) {
        const currentPart = currentRoom.participants[userId];
        if (currentPart && !currentPart.connected) {
          delete currentRoom.participants[userId];
          if (currentRoom.peerId === userId) {
            delete currentRoom.peerId;
            currentRoom.status = 'waiting';
          }
          // If all left, purge room
          if (Object.keys(currentRoom.participants).length === 0) {
            if (currentRoom.duelState?.timer) {
              clearTimeout(currentRoom.duelState.timer);
            }
            this.repository.delete(roomCode);
          } else {
            this.repository.save(currentRoom);
          }
        }
      }
    }, reconnectWindowMs);

    this.disconnectTimeouts.set(timeoutKey, timeout);
  }

  public getRoom(code: string): Room | undefined {
    return this.repository.get(code) ?? undefined;
  }

  public getVenueService(): VenueService {
    return this.venueService;
  }

  public updateNickname(ws: WebSocket, newNickname: string): void {
    const client = this.clients.get(ws);
    if (!client) return;
    const room = this.repository.get(client.roomCode);
    if (!room) return;
    const participant = room.participants[client.userId];
    if (!participant) return;

    participant.nickname = newNickname.trim() || participant.nickname;
    this.repository.save(room);

    this.broadcastToRoom(client.roomCode, {
      type: 'ROOM_STATE',
      room,
    });
  }

  public async setLocation(
    ws: WebSocket,
    districtId?: string,
    coords?: { lat: number; lng: number }
  ): Promise<void> {
    const client = this.clients.get(ws);
    if (!client) return;

    const room = this.repository.get(client.roomCode);
    if (!room) return;

    // Whitelist districtId against known districts (T-02-03)
    let safeDistrictId = districtId;
    if (safeDistrictId && !MOCK_DISTRICTS.some((d) => d.id === safeDistrictId)) {
      safeDistrictId = undefined; // Discard invalid district ID and fall back safely
    }

    // Validate coordinates within -90..90 and -180..180 (T-02-04)
    let safeCoords = coords;
    if (safeCoords) {
      if (!isValidCoordinate(safeCoords.lat, safeCoords.lng)) {
        safeCoords = undefined; // Discard invalid coordinates
      }
    }

    const resolved = await this.venueService.resolveLocationAndVenues(safeDistrictId, safeCoords);
    room.location = resolved.location;
    room.venues = resolved.venues;
    room.lastActiveAt = Date.now();

    this.repository.save(room);

    // Broadcast updated ROOM_STATE to all room participants
    this.broadcastToRoom(client.roomCode, {
      type: 'ROOM_STATE',
      room,
    });
  }

  public startSwiping(ws: WebSocket): boolean {
    const client = this.clients.get(ws);
    if (!client) return false;

    const room = this.repository.get(client.roomCode);
    if (!room) return false;

    // Swiping can only be started when room has at least 2 connected participants
    const participantCount = Object.values(room.participants).filter((p) => p.connected).length;
    if (participantCount < 2) {
      this.sendTo(ws, {
        type: 'ERROR',
        message: 'Oylamayı başlatmak için partnerinizin odaya katılması gerekir.',
      });
      return false;
    }

    room.status = 'swiping';
    room.lastActiveAt = Date.now();
    if (!room.votes) room.votes = {};
    if (!room.progress) room.progress = {};

    this.repository.save(room);
    console.log(`[RoomManager] Swiping started in room ${room.code} by user ${client.userId}`);

    // Broadcast to all participants that swiping has started
    this.broadcastToRoom(room.code, {
      type: 'ROOM_STATE',
      room,
    });

    return true;
  }

  public recordSwipe(
    ws: WebSocket,
    venueId: string,
    vote: 'like' | 'pass',
    cardIndex: number,
    totalCards: number
  ): { matchedVenue?: Venue; deckExhausted?: boolean } {
    // 1. Resolve client identity strictly from internal socket mapping (T-03-01)
    const client = this.clients.get(ws);
    if (!client) return {};

    const room = this.repository.get(client.roomCode);
    // 2. Reject swipes if room is not in swiping status (T-03-02)
    if (!room || room.status !== 'swiping') return {};

    // 3. Prevent duplicate evaluation if already matched
    if (room.matchedVenue) {
      return { matchedVenue: room.matchedVenue };
    }

    // 4. Validate venueId belongs to room's active deck (T-03-03)
    const venueExists = room.venues?.some((v) => v.id === venueId);
    if (!venueExists) return {};

    // 5. Initialize structures
    if (!room.votes) room.votes = {};
    if (!room.votes[client.userId]) room.votes[client.userId] = {};
    if (!room.progress) room.progress = {};

    // 6. Record vote idempotently (T-03-04)
    room.votes[client.userId][venueId] = vote;
    room.progress[client.userId] = { cardIndex, totalCards };
    room.lastActiveAt = Date.now();

    // 7. Broadcast partner progress to peer (exclude sender ws, no vote disclosure per T-03-05)
    this.broadcastToRoom(
      client.roomCode,
      {
        type: 'PARTNER_PROGRESS',
        userId: client.userId,
        cardIndex: cardIndex + 1,
        totalCards,
      },
      ws
    );

    // 8. Instant Match Evaluation (<100ms O(1) in-memory check)
    if (vote === 'like') {
      const peerId = Object.keys(room.participants).find((id) => id !== client.userId);
      if (peerId && room.votes[peerId]?.[venueId] === 'like') {
        const winningVenue = room.venues?.find((v) => v.id === venueId);
        if (winningVenue) {
          room.status = 'matched';
          room.matchedVenue = winningVenue;
          room.lastActiveAt = Date.now();

          this.repository.save(room);
          console.log(`[RoomManager] INSTANT MATCH in room ${room.code}: ${winningVenue.name} (${winningVenue.id})`);

          this.broadcastToRoom(room.code, {
            type: 'MATCH',
            venue: winningVenue,
          });

          return { matchedVenue: winningVenue };
        }
      }
    }

    // 9. Deck Exhaustion Evaluator
    const participantIds = Object.keys(room.participants);
    if (participantIds.length >= 2 && totalCards > 0) {
      const allFinished = participantIds.every((id) => {
        const votesCast = Object.keys(room.votes?.[id] || {}).length;
        return votesCast >= totalCards;
      });

      if (allFinished && room.status === 'swiping') {
        room.status = 'duel';
        room.lastActiveAt = Date.now();
        this.repository.save(room);

        console.log(`[RoomManager] Deck exhausted with NO match in room ${room.code}. Transitioning to DUEL.`);

        this.broadcastToRoom(room.code, {
          type: 'DECK_EXHAUSTED',
        });

        return { deckExhausted: true };
      }
    }

    this.repository.save(room);
    return {};
  }

  // Send message to a specific client
  public sendTo(ws: WebSocket, message: ServerMessage): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  // Broadcast message to everyone in room (optionally excluding sender)
  public broadcastToRoom(roomCode: string, message: ServerMessage, excludeWs?: WebSocket): void {
    for (const [ws, client] of this.clients.entries()) {
      if (client.roomCode === roomCode && ws !== excludeWs) {
        this.sendTo(ws, message);
      }
    }
  }

  // Get connected client session info
  public getClientInfo(ws: WebSocket): ConnectedClient | undefined {
    return this.clients.get(ws);
  }

  // Start 5-second Rapid Tapper Duel (DUEL-01) - delegated to DuelEngine
  public startDuel(ws: WebSocket, mode: 'online' | 'split' = 'online'): boolean {
    const client = this.clients.get(ws);
    if (!client) return false;

    const room = this.repository.get(client.roomCode);
    if (!room || room.status !== 'duel') return false;

    // Clear any existing duel timer if re-triggered
    if (room.duelState?.timer) {
      clearTimeout(room.duelState.timer);
    }

    const participantIds = Object.keys(room.participants);
    const { duelState, startTime, durationMs, totalWaitMs } = duelEngine.initializeDuel(mode, participantIds);
    room.duelState = {
      ...duelState,
      initiatorId: client.userId,
    };
    this.repository.save(room);

    this.broadcastToRoom(room.code, {
      type: 'DUEL_STARTING',
      startTime,
      durationMs,
      mode,
      initiatorId: client.userId,
    });

    room.duelState.timer = setTimeout(() => {
      this.concludeDuel(room.code);
    }, totalWaitMs);

    return true;
  }

  // Record incoming cumulative taps with timing boundary check and anti-cheat clamp (DUEL-02, T-04-02, T-04-03)
  public recordDuelTap(ws: WebSocket, cumulativeTaps: number): void {
    if (!Number.isFinite(cumulativeTaps) || cumulativeTaps < 0) return;

    const client = this.clients.get(ws);
    if (!client) return;

    const room = this.repository.get(client.roomCode);
    if (!room || !room.duelState || room.duelState.status === 'finished') return;

    const result = duelEngine.validateTap(room.duelState, client.userId, cumulativeTaps);
    if (!result.valid) return;

    room.duelState.scores[client.userId] = result.newScore;
    this.repository.save(room);

    this.broadcastToRoom(room.code, {
      type: 'DUEL_PROGRESS',
      scores: room.duelState.scores,
    });
  }

  // Authoritative duel conclusion and winner resolution (DUEL-04)
  public concludeDuel(roomCode: string, forcedWinnerId?: string): void {
    const room = this.repository.get(roomCode);
    if (!room || !room.duelState || room.duelState.status === 'finished') return;

    if (room.duelState.timer) {
      clearTimeout(room.duelState.timer);
      room.duelState.timer = undefined;
    }
    room.duelState.status = 'finished';

    const userIds = Object.keys(room.participants);
    const { winnerId, tieBroken } = duelEngine.determineWinner(room.duelState.scores, userIds, forcedWinnerId);

    if (!winnerId) {
      this.repository.save(room);
      return;
    }

    const winningVenue = this.resolveDuelWinner(roomCode, winnerId);
    if (winningVenue) {
      room.status = 'matched';
      room.matchedVenue = winningVenue;
      room.lastActiveAt = Date.now();
      this.repository.save(room);

      console.log(`[RoomManager] DUEL CONCLUDED in room ${room.code}. Winner: ${winnerId}, Venue: ${winningVenue.name}`);

      this.broadcastToRoom(room.code, {
        type: 'MATCH',
        venue: winningVenue,
        duelResult: {
          winnerId,
          scores: room.duelState.scores,
          tieBroken: tieBroken ? true : undefined,
        },
      });
    } else {
      this.repository.save(room);
    }
  }

  // Hierarchical winner venue resolution (D-04 / DUEL-04)
  public resolveDuelWinner(roomCode: string, winnerId: string): Venue | undefined {
    const room = this.repository.get(roomCode);
    if (!room || !room.venues || room.venues.length === 0) return undefined;

    return duelEngine.resolveWinningVenue(
      room.venues,
      room.votes || {},
      winnerId,
      Object.keys(room.participants)
    );
  }
}
