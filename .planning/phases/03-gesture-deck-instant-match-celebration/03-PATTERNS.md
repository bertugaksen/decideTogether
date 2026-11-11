# Phase 03: Gesture Deck & Instant Match Celebration - Pattern Map

**Mapped:** 2026-11-08  
**Files analyzed:** 13  
**Analogs found:** 13 / 13 (100% codebase coverage)  

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `server/src/types.ts` | model | request-response | `server/src/types.ts` | exact |
| `client/src/types.ts` | model | request-response | `client/src/types.ts` | exact |
| `server/src/roomManager.ts` | service | event-driven | `server/src/roomManager.ts` | exact |
| `server/src/index.ts` | controller | request-response / streaming | `server/src/index.ts` | exact |
| `server/src/tests/swipeDeck.test.ts` | test | unit / request-response | `server/src/tests/sponsoredInsertion.test.ts` | exact |
| `server/test-swipe-probe.js` | test (probe) | event-driven / streaming | `server/test-probe.js` | exact |
| `client/src/hooks/useRoomSocket.ts` | hook | event-driven / streaming | `client/src/hooks/useRoomSocket.ts` | exact |
| `client/src/components/SwipeDeck.tsx` | component | event-driven / gesture physics | `client/src/components/Lobby.tsx` | role-match |
| `client/src/components/VenueCard.tsx` | component | event-driven / gesture physics | `client/src/components/VenueListModal.tsx` | role-match |
| `client/src/components/MatchCelebration.tsx` | component | event-driven / visual animation | `client/src/components/VenueListModal.tsx` | role-match |
| `client/src/components/DeckExhausted.tsx` | component | request-response / modal | `client/src/components/VenueListModal.tsx` | role-match |
| `client/src/components/Lobby.tsx` | component | event-driven / request-response | `client/src/components/Lobby.tsx` | exact |
| `client/src/App.tsx` | component | request-response / viewport shell | `client/src/App.tsx` | exact |

---

## Pattern Assignments

### `server/src/types.ts` (model, request-response)

**Analog:** `server/src/types.ts`  
**Match Quality:** exact  

**Imports pattern:**
No imports needed (pure TypeScript interface declarations).

**Core Type Definitions pattern** (`server/src/types.ts:9-10, 54-64`):
```typescript
export type RoomStatus = 'waiting' | 'ready' | 'swiping' | 'matched' | 'duel';

export interface Room {
  code: string; // 4-digit numeric PIN
  hostId: string;
  peerId?: string;
  status: RoomStatus;
  participants: Record<string, Participant>;
  createdAt: number;
  lastActiveAt: number;
  location?: RoomLocation;
  venues?: Venue[];
  // Phase 3 extensions:
  votes?: Record<string, Record<string, 'like' | 'pass'>>; // userId -> venueId -> 'like' | 'pass'
  progress?: Record<string, { cardIndex: number; totalCards: number }>; // userId -> swipe progress
  matchedVenue?: Venue; // The mutual winner
}
```

**ClientMessage Discriminated Union pattern** (`server/src/types.ts:67-81`):
```typescript
// Client -> Server Message Types
export type ClientMessage =
  | {
      type: 'CREATE_ROOM';
      nickname?: string;
      location?: {
        districtId?: string;
        coords?: { lat: number; lng: number };
      };
    }
  | { type: 'JOIN_ROOM'; roomCode: string; userId?: string; nickname?: string }
  | { type: 'UPDATE_NICKNAME'; nickname: string }
  | { type: 'SET_LOCATION'; districtId?: string; coords?: { lat: number; lng: number } }
  | { type: 'LEAVE_ROOM' }
  | { type: 'START_SWIPING' }
  | {
      type: 'SWIPE';
      venueId: string;
      vote: 'like' | 'pass';
      cardIndex: number;
      totalCards: number;
    }
  | { type: 'PING' };
```

**ServerMessage Discriminated Union pattern** (`server/src/types.ts:84-95`):
```typescript
// Server -> Client Message Types
export type ServerMessage =
  | { type: 'ROOM_CREATED'; roomCode: string; user: Participant; room?: Room }
  | { type: 'ROOM_JOINED'; room: Room; user: Participant }
  | { type: 'ROOM_STATE'; room: Room }
  | { type: 'LOCATION_UPDATED'; location: RoomLocation; venues: Venue[] }
  | { type: 'PEER_JOINED'; participant: Participant }
  | { type: 'PEER_DISCONNECTED'; userId: string; reconnectDeadlineMs: number }
  | { type: 'PEER_RECONNECTED'; participant: Participant }
  | { type: 'ROOM_READY'; roomCode: string }
  | { type: 'SWIPING_STARTED' }
  | {
      type: 'PARTNER_PROGRESS';
      userId: string;
      cardIndex: number;
      totalCards: number;
    }
  | { type: 'MATCH'; venue: Venue }
  | { type: 'DECK_EXHAUSTED' }
  | { type: 'PONG' }
  | { type: 'ERROR'; message: string };
```

---

### `client/src/types.ts` (model, request-response)

**Analog:** `client/src/types.ts`  
**Match Quality:** exact  

**Imports pattern:**
No imports needed (mirror of `server/src/types.ts` with local `SavedSession` interface).

**Sync with Server Types pattern** (`client/src/types.ts:54-93`):
```typescript
export interface Room {
  code: string;
  hostId: string;
  peerId?: string;
  status: RoomStatus;
  participants: Record<string, Participant>;
  createdAt: number;
  lastActiveAt: number;
  location?: RoomLocation;
  venues?: Venue[];
  // Phase 3 extensions
  votes?: Record<string, Record<string, 'like' | 'pass'>>;
  progress?: Record<string, { cardIndex: number; totalCards: number }>;
  matchedVenue?: Venue;
}

export type ClientMessage =
  | {
      type: 'CREATE_ROOM';
      nickname?: string;
      location?: {
        districtId?: string;
        coords?: { lat: number; lng: number };
      };
    }
  | { type: 'JOIN_ROOM'; roomCode: string; userId?: string; nickname?: string }
  | { type: 'UPDATE_NICKNAME'; nickname: string }
  | { type: 'SET_LOCATION'; districtId?: string; coords?: { lat: number; lng: number } }
  | { type: 'LEAVE_ROOM' }
  | { type: 'START_SWIPING' }
  | {
      type: 'SWIPE';
      venueId: string;
      vote: 'like' | 'pass';
      cardIndex: number;
      totalCards: number;
    }
  | { type: 'PING' };

export type ServerMessage =
  | { type: 'ROOM_CREATED'; roomCode: string; user: Participant; room?: Room }
  | { type: 'ROOM_JOINED'; room: Room; user: Participant }
  | { type: 'ROOM_STATE'; room: Room }
  | { type: 'LOCATION_UPDATED'; location: RoomLocation; venues: Venue[] }
  | { type: 'PEER_JOINED'; participant: Participant }
  | { type: 'PEER_DISCONNECTED'; userId: string; reconnectDeadlineMs: number }
  | { type: 'PEER_RECONNECTED'; participant: Participant }
  | { type: 'ROOM_READY'; roomCode: string }
  | { type: 'SWIPING_STARTED' }
  | {
      type: 'PARTNER_PROGRESS';
      userId: string;
      cardIndex: number;
      totalCards: number;
    }
  | { type: 'MATCH'; venue: Venue }
  | { type: 'DECK_EXHAUSTED' }
  | { type: 'PONG' }
  | { type: 'ERROR'; message: string };

export interface SavedSession {
  roomCode: string;
  userId: string;
  nickname: string;
  role: 'host' | 'peer';
}
```

---

### `server/src/roomManager.ts` (service, event-driven)

**Analog:** `server/src/roomManager.ts`  
**Match Quality:** exact  

**Imports pattern** (`server/src/roomManager.ts:1-5`):
```typescript
import { WebSocket } from 'ws';
import { Room, Participant, ServerMessage, Venue } from './types.js';
import { VenueService, isValidCoordinate } from './services/venueService.js';
import { MOCK_DISTRICTS } from './services/mockVenues.js';
```

**Room Lifecycle & Swiping Initiator pattern** (`server/src/roomManager.ts:276-310`):
```typescript
public startSwiping(ws: WebSocket): boolean {
  const client = this.clients.get(ws);
  if (!client) return false;

  const room = this.rooms.get(client.roomCode);
  if (!room) return false;

  // Swiping can only be started when room is ready or waiting with at least 2 participants
  const participantCount = Object.values(room.participants).filter((p) => p.connected).length;
  if (participantCount < 2) {
    this.sendTo(ws, { type: 'ERROR', message: 'Oylamayı başlatmak için partnerinizin odaya katılması gerekir.' });
    return false;
  }

  room.status = 'swiping';
  room.lastActiveAt = Date.now();
  if (!room.votes) room.votes = {};
  if (!room.progress) room.progress = {};

  console.log(`[RoomManager] Swiping started in room ${room.code} by user ${client.userId}`);

  // Broadcast to all participants that swiping has started
  this.broadcastToRoom(room.code, {
    type: 'ROOM_STATE',
    room,
  });

  return true;
}
```

**Authoritative Vote Ledger & O(1) Mutual Match Evaluator pattern** (`03-RESEARCH.md:430-517`):
```typescript
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

  const room = this.rooms.get(client.roomCode);
  // 2. Reject swipes if room is not in swiping status (T-03-02)
  if (!room || room.status !== 'swiping') return {};

  // 3. Prevent duplicate evaluation if already matched
  if (room.matchedVenue) {
    return { matchedVenue: room.matchedVenue };
  }

  // 4. Validate venueId belongs to room's active deck
  const venueExists = room.venues?.some((v) => v.id === venueId);
  if (!venueExists) return {};

  // 5. Initialize structures
  if (!room.votes) room.votes = {};
  if (!room.votes[client.userId]) room.votes[client.userId] = {};
  if (!room.progress) room.progress = {};

  // 6. Record vote idempotently
  room.votes[client.userId][venueId] = vote;
  room.progress[client.userId] = { cardIndex, totalCards };
  room.lastActiveAt = Date.now();

  // 7. Broadcast partner progress to peer (exclude sender)
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
  if (participantIds.length >= 2) {
    const allFinished = participantIds.every((id) => {
      const votesCast = Object.keys(room.votes?.[id] || {}).length;
      return votesCast >= totalCards;
    });

    if (allFinished && room.status === 'swiping') {
      room.status = 'duel';
      console.log(`[RoomManager] Deck exhausted with NO match in room ${room.code}. Transitioning to DUEL.`);

      this.broadcastToRoom(room.code, {
        type: 'DECK_EXHAUSTED',
      });

      return { deckExhausted: true };
    }
  }

  return {};
}
```

---

### `server/src/index.ts` (controller, request-response / streaming)

**Analog:** `server/src/index.ts`  
**Match Quality:** exact  

**Imports pattern** (`server/src/index.ts:1-8`):
```typescript
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { RoomManager } from './roomManager.js';
import { ClientMessage } from './types.js';
import { MOCK_DISTRICTS } from './services/mockVenues.js';
import { isValidCoordinate } from './services/venueService.js';
```

**WebSocket Dispatch Switch-Case pattern** (`server/src/index.ts:101-137`):
```typescript
wss.on('connection', (ws: WebSocket) => {
  ws.on('message', async (data: string) => {
    try {
      const message: ClientMessage = JSON.parse(data.toString());

      switch (message.type) {
        case 'CREATE_ROOM':
          await roomManager.createRoom(ws, message.nickname, message.location);
          break;

        case 'JOIN_ROOM':
          roomManager.joinRoom(ws, message.roomCode, message.userId, message.nickname);
          break;

        case 'SET_LOCATION':
          await roomManager.setLocation(ws, message.districtId, message.coords);
          break;

        case 'UPDATE_NICKNAME':
          roomManager.updateNickname(ws, message.nickname);
          break;

        case 'START_SWIPING':
          roomManager.startSwiping(ws);
          break;

        case 'SWIPE':
          roomManager.recordSwipe(
            ws,
            message.venueId,
            message.vote,
            message.cardIndex,
            message.totalCards
          );
          break;

        case 'PING':
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'PONG' }));
          }
          break;

        default:
          console.log('Unhandled client message:', message);
      }
    } catch (err) {
      console.error('Error parsing client message:', err);
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'ERROR', message: 'Geçersiz mesaj formatı' }));
      }
    }
  });

  ws.on('close', () => {
    roomManager.handleDisconnect(ws);
  });

  ws.on('error', (err) => {
    console.error('WebSocket connection error:', err);
    roomManager.handleDisconnect(ws);
  });
});
```

---

### `server/src/tests/swipeDeck.test.ts` (test, unit)

**Analog:** `server/src/tests/sponsoredInsertion.test.ts`  
**Match Quality:** exact  

**Imports pattern** (`server/src/tests/sponsoredInsertion.test.ts:1-4`):
```typescript
import test from 'node:test';
import assert from 'node:assert/strict';
import { RoomManager } from '../roomManager.js';
import { WebSocket } from 'ws';
import { Room, Venue } from '../types.js';
```

**Unit Test Suite Structure pattern** (`server/src/tests/sponsoredInsertion.test.ts:6-54`):
```typescript
// Helper mock socket creator
function createMockSocket() {
  const sentMessages: any[] = [];
  return {
    ws: {
      readyState: WebSocket.OPEN,
      send: (data: string) => sentMessages.push(JSON.parse(data)),
    } as unknown as WebSocket,
    sentMessages,
  };
}

test('startSwiping - changes room status to swiping when 2 participants are connected', async () => {
  const manager = new RoomManager();
  const hostMock = createMockSocket();
  const peerMock = createMockSocket();

  const { room } = await manager.createRoom(hostMock.ws, 'Host User');
  manager.joinRoom(peerMock.ws, room.code, undefined, 'Peer User');

  assert.strictEqual(room.status, 'ready');

  const started = manager.startSwiping(hostMock.ws);
  assert.strictEqual(started, true);
  assert.strictEqual(room.status, 'swiping');
});

test('recordSwipe - detects mutual like and broadcasts MATCH immediately (<100ms)', async () => {
  const manager = new RoomManager();
  const hostMock = createMockSocket();
  const peerMock = createMockSocket();

  const { room, host } = await manager.createRoom(hostMock.ws, 'Host User');
  manager.joinRoom(peerMock.ws, room.code, undefined, 'Peer User');
  manager.startSwiping(hostMock.ws);

  const testVenue = room.venues![0];
  const total = room.venues!.length;

  // Host votes 'like' on first card
  const res1 = manager.recordSwipe(hostMock.ws, testVenue.id, 'like', 0, total);
  assert.strictEqual(res1.matchedVenue, undefined);
  assert.strictEqual(room.status, 'swiping');

  // Peer votes 'like' on same first card
  const res2 = manager.recordSwipe(peerMock.ws, testVenue.id, 'like', 0, total);
  assert.ok(res2.matchedVenue);
  assert.strictEqual(res2.matchedVenue.id, testVenue.id);
  assert.strictEqual(room.status, 'matched');

  // Verify MATCH message was sent to host and peer
  const hostMatchMsg = hostMock.sentMessages.find((m) => m.type === 'MATCH');
  assert.ok(hostMatchMsg);
  assert.strictEqual(hostMatchMsg.venue.id, testVenue.id);
});

test('recordSwipe - transitions to duel upon deck exhaustion without match', async () => {
  const manager = new RoomManager();
  const hostMock = createMockSocket();
  const peerMock = createMockSocket();

  const { room } = await manager.createRoom(hostMock.ws, 'Host');
  manager.joinRoom(peerMock.ws, room.code, undefined, 'Peer');
  manager.startSwiping(hostMock.ws);

  const venues = room.venues!;
  const total = venues.length;

  // Host swipes pass on all cards
  for (let i = 0; i < total; i++) {
    manager.recordSwipe(hostMock.ws, venues[i].id, 'pass', i, total);
  }

  // Peer swipes like on different cards or passes all
  for (let i = 0; i < total - 1; i++) {
    manager.recordSwipe(peerMock.ws, venues[i].id, 'pass', i, total);
  }

  // Before peer swipes last card, still swiping
  assert.strictEqual(room.status, 'swiping');

  // Peer swipes last card
  const finalRes = manager.recordSwipe(peerMock.ws, venues[total - 1].id, 'pass', total - 1, total);
  assert.strictEqual(finalRes.deckExhausted, true);
  assert.strictEqual(room.status, 'duel');
});

test('recordSwipe - ignores votes if room status is not swiping', async () => {
  const manager = new RoomManager();
  const hostMock = createMockSocket();
  const { room } = await manager.createRoom(hostMock.ws, 'Host');

  // Room is in 'waiting' status
  const res = manager.recordSwipe(hostMock.ws, 'test_id', 'like', 0, 15);
  assert.deepStrictEqual(res, {});
  assert.strictEqual(room.votes, undefined);
});
```

---

### `server/test-swipe-probe.js` (test/probe, event-driven)

**Analog:** `server/test-probe.js`  
**Match Quality:** exact  

**Imports & Probe Runner pattern** (`server/test-probe.js:1-15, 36-69`):
```javascript
import { WebSocket } from 'ws';
import assert from 'node:assert';

async function runSwipeProbe() {
  console.log('--- Starting DecideTogether Swipe Deck & Match WebSocket Probe ---');

  const wsA = new WebSocket('ws://localhost:3001/ws');
  await new Promise((resolve) => wsA.on('open', resolve));
  console.log('✓ Host connected to WebSocket');

  // 1. Create Room
  wsA.send(JSON.stringify({ type: 'CREATE_ROOM', nickname: 'Probe Host' }));
  const roomCreated = await new Promise((resolve) => {
    wsA.on('message', (data) => {
      const msg = JSON.parse(data.toString());
      if (msg.type === 'ROOM_CREATED') resolve(msg);
    });
  });

  const roomCode = roomCreated.roomCode;
  console.log(`✓ Room created PIN: ${roomCode}`);

  // 2. Peer Joins Room
  const wsB = new WebSocket('ws://localhost:3001/ws');
  await new Promise((resolve) => wsB.on('open', resolve));

  const peerJoined = new Promise((resolve) => {
    wsB.on('message', (data) => {
      const msg = JSON.parse(data.toString());
      if (msg.type === 'ROOM_JOINED') resolve(msg);
    });
  });

  wsB.send(JSON.stringify({ type: 'JOIN_ROOM', roomCode, nickname: 'Probe Peer' }));
  const joinedMsg = await peerJoined;
  const venues = joinedMsg.room.venues;
  assert.ok(venues && venues.length >= 10);
  console.log(`✓ Peer joined room with ${venues.length} venues`);

  // 3. Start Swiping
  const swipingStartedHost = new Promise((resolve) => {
    wsA.on('message', (data) => {
      const msg = JSON.parse(data.toString());
      if (msg.type === 'ROOM_STATE' && msg.room.status === 'swiping') resolve(msg);
    });
  });
  const swipingStartedPeer = new Promise((resolve) => {
    wsB.on('message', (data) => {
      const msg = JSON.parse(data.toString());
      if (msg.type === 'ROOM_STATE' && msg.room.status === 'swiping') resolve(msg);
    });
  });

  wsA.send(JSON.stringify({ type: 'START_SWIPING' }));
  await Promise.all([swipingStartedHost, swipingStartedPeer]);
  console.log('✓ Both clients received ROOM_STATE status="swiping"');

  // 4. Partner Progress Relay
  const partnerProgressPromise = new Promise((resolve) => {
    wsB.on('message', (data) => {
      const msg = JSON.parse(data.toString());
      if (msg.type === 'PARTNER_PROGRESS') resolve(msg);
    });
  });

  wsA.send(JSON.stringify({
    type: 'SWIPE',
    venueId: venues[0].id,
    vote: 'like',
    cardIndex: 0,
    totalCards: venues.length,
  }));

  const progressMsg = await partnerProgressPromise;
  assert.strictEqual(progressMsg.cardIndex, 1);
  console.log('✓ Peer received PARTNER_PROGRESS: cardIndex=1');

  // 5. Mutual Match
  const hostMatchPromise = new Promise((resolve) => {
    wsA.on('message', (data) => {
      const msg = JSON.parse(data.toString());
      if (msg.type === 'MATCH') resolve(msg);
    });
  });
  const peerMatchPromise = new Promise((resolve) => {
    wsB.on('message', (data) => {
      const msg = JSON.parse(data.toString());
      if (msg.type === 'MATCH') resolve(msg);
    });
  });

  const startTime = Date.now();
  wsB.send(JSON.stringify({
    type: 'SWIPE',
    venueId: venues[0].id,
    vote: 'like',
    cardIndex: 0,
    totalCards: venues.length,
  }));

  const [matchHost, matchPeer] = await Promise.all([hostMatchPromise, peerMatchPromise]);
  const latency = Date.now() - startTime;
  console.log(`✓ MATCH event received by both clients in ${latency}ms (target <100ms)`);
  assert.strictEqual(matchHost.venue.id, venues[0].id);
  assert.strictEqual(matchPeer.venue.id, venues[0].id);

  wsA.close();
  wsB.close();
  console.log('🎉 ALL SWIPE PROBE TESTS PASSED SUCCESSFULLY! 🎉');
  process.exit(0);
}

runSwipeProbe().catch((err) => {
  console.error('Probe test failed:', err);
  process.exit(1);
});
```

---

### `client/src/hooks/useRoomSocket.ts` (hook, event-driven / streaming)

**Analog:** `client/src/hooks/useRoomSocket.ts`  
**Match Quality:** exact  

**Imports pattern** (`client/src/hooks/useRoomSocket.ts:1-3`):
```typescript
import { useState, useEffect, useRef, useCallback } from 'react';
import { Room, Participant, ServerMessage, ClientMessage, SavedSession, Venue } from '../types.js';
```

**State & Message Listener Extensions pattern** (`client/src/hooks/useRoomSocket.ts:7-14, 96-198`):
```typescript
export function useRoomSocket() {
  const [room, setRoom] = useState<Room | null>(null);
  const [currentUser, setCurrentUser] = useState<Participant | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<
    'disconnected' | 'connecting' | 'connected' | 'reconnecting'
  >('disconnected');
  const [error, setError] = useState<string | null>(null);
  const [peerDisconnectSeconds, setPeerDisconnectSeconds] = useState<number | null>(null);

  // Phase 3 extensions:
  const [partnerProgress, setPartnerProgress] = useState<{ cardIndex: number; totalCards: number } | null>(null);
  const [matchedVenue, setMatchedVenue] = useState<Venue | null>(null);
  const [isDeckExhausted, setIsDeckExhausted] = useState<boolean>(false);

  // Inside ws.onmessage switch:
  case 'ROOM_STATE':
    setRoom(message.room);
    if (message.room.matchedVenue) {
      setMatchedVenue(message.room.matchedVenue);
    }
    if (message.room.status === 'duel') {
      setIsDeckExhausted(true);
    }
    break;

  case 'SWIPING_STARTED':
    setRoom((prev) => (prev ? { ...prev, status: 'swiping' } : null));
    break;

  case 'PARTNER_PROGRESS':
    setPartnerProgress({
      cardIndex: message.cardIndex,
      totalCards: message.totalCards,
    });
    break;

  case 'MATCH':
    setMatchedVenue(message.venue);
    setRoom((prev) => (prev ? { ...prev, status: 'matched', matchedVenue: message.venue } : null));
    break;

  case 'DECK_EXHAUSTED':
    setIsDeckExhausted(true);
    setRoom((prev) => (prev ? { ...prev, status: 'duel' } : null));
    break;
```

**Public Actions pattern** (`client/src/hooks/useRoomSocket.ts:250-290`):
```typescript
  const startSwiping = useCallback(() => {
    send({ type: 'START_SWIPING' });
  }, [send]);

  const sendSwipe = useCallback(
    (venueId: string, vote: 'like' | 'pass', cardIndex: number, totalCards: number) => {
      send({
        type: 'SWIPE',
        venueId,
        vote,
        cardIndex,
        totalCards,
      });
    },
    [send]
  );

  return {
    room,
    currentUser,
    peer,
    connectionStatus,
    error,
    peerDisconnectSeconds,
    partnerProgress,
    matchedVenue,
    isDeckExhausted,
    createRoom,
    joinRoom,
    updateNickname,
    leaveRoom,
    setLocation,
    startSwiping,
    sendSwipe,
  };
}
```

---

### `client/src/components/SwipeDeck.tsx` (component, event-driven / gesture physics)

**Analog:** `client/src/components/Lobby.tsx`  
**Match Quality:** role-match  

**Imports pattern** (`client/src/components/Lobby.tsx:1-8`):
```typescript
import React, { useState, useCallback } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Heart, X, Sparkles, MapPin, Users, Flame } from 'lucide-react';
import { Room, Participant, Venue } from '../types.js';
import { VenueCard } from './VenueCard.js';
import { MatchCelebration } from './MatchCelebration.js';
import { DeckExhausted } from './DeckExhausted.js';
```

**Deck Pointer & Sliding Window Stack pattern** (`03-RESEARCH.md:264-268, 303-356`):
```tsx
interface SwipeDeckProps {
  room: Room;
  currentUser: Participant;
  peer: Participant | null;
  partnerProgress: { cardIndex: number; totalCards: number } | null;
  matchedVenue: Venue | null;
  isDeckExhausted: boolean;
  onSwipe: (venueId: string, vote: 'like' | 'pass', cardIndex: number, totalCards: number) => void;
  onLeave: () => void;
}

export const SwipeDeck: React.FC<SwipeDeckProps> = ({
  room,
  currentUser,
  peer,
  partnerProgress,
  matchedVenue,
  isDeckExhausted,
  onSwipe,
  onLeave,
}) => {
  const venues = room.venues || [];
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const handleCardSwipe = useCallback((direction: 'like' | 'pass') => {
    if (isTransitioning || currentIndex >= venues.length) return;
    setIsTransitioning(true);

    const currentVenue = venues[currentIndex];
    onSwipe(currentVenue.id, direction, currentIndex, venues.length);

    setTimeout(() => {
      setCurrentIndex((prev) => prev + 1);
      setIsTransitioning(false);
    }, 250);
  }, [currentIndex, isTransitioning, onSwipe, venues]);

  // If match detected, render celebration overlay
  if (matchedVenue) {
    return <MatchCelebration venue={matchedVenue} onLeave={onLeave} />;
  }

  // If all cards swiped without match or server reports duel
  if (isDeckExhausted || currentIndex >= venues.length) {
    return <DeckExhausted onLeave={onLeave} />;
  }

  // Render 2-card sliding window for optimal mobile memory & 60fps
  const visibleCards = venues.slice(currentIndex, currentIndex + 2);
  const currentCard = visibleCards[0];
  const nextCard = visibleCards[1];

  return (
    <div className="max-w-md mx-auto h-[100dvh] px-4 py-4 flex flex-col justify-between select-none overflow-hidden">
      {/* Header with live Partner Progress Badge */}
      <header className="pb-2">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#1C1917]">
            <MapPin className="w-3.5 h-3.5 text-[#D9381E]" />
            <span className="truncate max-w-[160px]">{room.location?.label}</span>
          </div>

          {/* Partner Progress Pill */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-[#FAF7F2] border border-[#E7E2D9]">
            <Users className="w-3.5 h-3.5 text-[#78716C]" />
            <span className="text-[#1C1917] font-bold">
              {partnerProgress
                ? `${peer?.nickname || 'Partner'}: ${partnerProgress.cardIndex}/${partnerProgress.totalCards}`
                : `${peer?.nickname || 'Partner'} bekleniyor`}
            </span>
          </div>
        </div>

        {/* User Progress Bar */}
        <div className="w-full bg-[#E7E2D9] h-1.5 rounded-full overflow-hidden">
          <div
            className="bg-[#D9381E] h-full rounded-full transition-all duration-300 ease-out"
            style={{ width: `${((currentIndex + 1) / venues.length) * 100}%` }}
          />
        </div>
      </header>

      {/* Interactive Card Stack Container */}
      <div className="relative flex-1 my-3 flex items-center justify-center">
        <div className="relative w-full max-w-[340px] aspect-[3/4.4]">
          <AnimatePresence mode="popLayout">
            {nextCard && (
              <VenueCard key={nextCard.id} venue={nextCard} isTop={false} onSwipe={() => {}} />
            )}
            {currentCard && (
              <VenueCard
                key={currentCard.id}
                venue={currentCard}
                isTop={true}
                onSwipe={handleCardSwipe}
              />
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Programmatic Tactile Action Buttons */}
      <div className="pt-2 pb-4 flex items-center justify-center gap-8">
        {/* Pass Button (Red Paprika) */}
        <button
          type="button"
          disabled={isTransitioning}
          onClick={() => handleCardSwipe('pass')}
          className="w-16 h-16 rounded-full bg-white border-2 border-[#E7E2D9] hover:border-[#D9381E] text-[#D9381E] flex items-center justify-center shadow-lg active:scale-90 transition-all cursor-pointer"
          aria-label="Pas Geç"
        >
          <X className="w-8 h-8 stroke-[2.5]" />
        </button>

        {/* Like Button (Green Basil) */}
        <button
          type="button"
          disabled={isTransitioning}
          onClick={() => handleCardSwipe('like')}
          className="w-16 h-16 rounded-full bg-[#2D6A4F] text-white flex items-center justify-center shadow-lg hover:bg-[#24543E] active:scale-90 transition-all cursor-pointer"
          aria-label="Beğen"
        >
          <Heart className="w-8 h-8 fill-white stroke-none" />
        </button>
      </div>
    </div>
  );
};
```

---

### `client/src/components/VenueCard.tsx` (component, event-driven / gesture physics)

**Analog:** `client/src/components/VenueListModal.tsx:61-143`  
**Match Quality:** role-match  

**Imports pattern** (`client/src/components/VenueListModal.tsx:1-4`):
```typescript
import React from 'react';
import { motion, useMotionValue, useTransform } from 'framer-motion';
import { Star, MapPin, Sparkles } from 'lucide-react';
import { Venue } from '../types.js';
```

**Warm Editorial Framer Motion Draggable Card pattern** (`03-RESEARCH.md:304-423`):
```tsx
interface VenueCardProps {
  venue: Venue;
  onSwipe: (direction: 'like' | 'pass') => void;
  isTop: boolean;
}

export const VenueCard: React.FC<VenueCardProps> = ({ venue, onSwipe, isTop }) => {
  const x = useMotionValue(0);

  // Smooth tilt rotation proportional to horizontal drag
  const rotate = useTransform(x, [-200, 200], [-18, 18]);

  // Stamp opacities appear as user drags past 20px
  const likeOpacity = useTransform(x, [20, 100], [0, 1]);
  const passOpacity = useTransform(x, [-20, -100], [0, 1]);

  const handleDragEnd = (_: any, info: { offset: { x: number }; velocity: { x: number } }) => {
    const SWIPE_THRESHOLD = 100;
    const VELOCITY_THRESHOLD = 500;

    if (info.offset.x > SWIPE_THRESHOLD || info.velocity.x > VELOCITY_THRESHOLD) {
      onSwipe('like');
    } else if (info.offset.x < -SWIPE_THRESHOLD || info.velocity.x < -VELOCITY_THRESHOLD) {
      onSwipe('pass');
    }
  };

  if (!isTop) {
    // Underneath preview card (static, slightly scaled for depth)
    return (
      <div
        className="absolute inset-0 rounded-3xl bg-white border border-[#E7E2D9] shadow-md overflow-hidden pointer-events-none transition-all duration-200"
        style={{ transform: 'scale(0.96) translateY(12px)', opacity: 0.85 }}
      >
        <img
          src={venue.photoUrl}
          alt={venue.name}
          className="w-full h-3/5 object-cover pointer-events-none"
        />
        <div className="p-5">
          <h3 className="font-display font-bold text-xl text-[#1C1917]">{venue.name}</h3>
          <p className="text-sm text-[#78716C]">{venue.category}</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      className="absolute inset-0 rounded-3xl bg-white border border-[#E7E2D9] shadow-xl overflow-hidden cursor-grab active:cursor-grabbing touch-none select-none z-10"
      style={{ x, rotate }}
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.65}
      onDragEnd={handleDragEnd}
      exit={{ x: x.get() > 0 ? 600 : -600, opacity: 0, transition: { duration: 0.25 } }}
    >
      {/* LIKE STAMP (Basil Green) */}
      <motion.div
        style={{ opacity: likeOpacity }}
        className="absolute top-6 left-6 z-20 border-4 border-[#2D6A4F] text-[#2D6A4F] font-display font-black text-2xl px-4 py-1.5 rounded-2xl -rotate-12 bg-white/95 shadow-lg pointer-events-none"
      >
        BEĞENDİM ❤️
      </motion.div>

      {/* PASS STAMP (Paprika Red) */}
      <motion.div
        style={{ opacity: passOpacity }}
        className="absolute top-6 right-6 z-20 border-4 border-[#D9381E] text-[#D9381E] font-display font-black text-2xl px-4 py-1.5 rounded-2xl rotate-12 bg-white/95 shadow-lg pointer-events-none"
      >
        PAS ❌
      </motion.div>

      {/* Venue Photo */}
      <div className="relative w-full h-3/5 bg-stone-100">
        <img
          src={venue.photoUrl}
          alt={venue.name}
          draggable={false}
          className="w-full h-full object-cover pointer-events-none"
        />
        {venue.isSponsored && (
          <div className="absolute top-4 left-4 bg-[#D9381E] text-white text-[11px] font-bold px-3 py-1 rounded-full shadow-md flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            <span>{venue.sponsorBadge || 'Sponsorlu Lezzet'}</span>
          </div>
        )}
      </div>

      {/* Venue Editorial Information */}
      <div className="p-5 flex flex-col justify-between h-2/5">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#D9381E] uppercase tracking-wider">
              {venue.category}
            </span>
            <div className="flex items-center gap-1 bg-[#F5F0EB] px-2 py-0.5 rounded-lg text-xs font-bold text-[#1C1917]">
              <Star className="w-3.5 h-3.5 fill-[#E07A5F] text-[#E07A5F]" />
              <span>{venue.rating.toFixed(1)}</span>
              <span className="text-[#78716C] font-normal">({venue.reviewCount})</span>
            </div>
          </div>
          <h3 className="font-display font-bold text-2xl text-[#1C1917] mt-1 leading-snug line-clamp-1">
            {venue.name}
          </h3>
          <p className="text-xs text-[#78716C] mt-1 line-clamp-2">{venue.address}</p>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-[#E7E2D9] text-xs font-medium text-[#78716C]">
          <span>Fiyat: {'₺'.repeat(venue.priceLevel || 2)}</span>
          <span className={venue.isOpenNow ? 'text-[#2D6A4F] font-semibold' : 'text-[#78716C]'}>
            {venue.isOpenNow ? '● Açık' : '○ Kapalı'}
          </span>
        </div>
      </div>
    </motion.div>
  );
};
```

---

### `client/src/components/MatchCelebration.tsx` (component, event-driven / visual animation)

**Analog:** `client/src/components/VenueListModal.tsx:21-52`  
**Match Quality:** role-match  

**Imports pattern** (`client/src/components/VenueListModal.tsx:1-4`):
```typescript
import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Star, MapPin, Sparkles, Navigation, Share2, RefreshCw } from 'lucide-react';
import { Venue } from '../types.js';
```

**Canvas Confetti Fireworks & Haptic Vibration pattern** (`03-RESEARCH.md:522-562`):
```tsx
export function triggerCelebrationEffects() {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate([100, 50, 100, 50, 200]);
    } catch {
      // Ignore vibration error on non-supported hardware
    }
  }

  // 1. Center burst
  confetti({
    particleCount: 80,
    spread: 60,
    origin: { y: 0.6 },
    colors: ['#D9381E', '#2D6A4F', '#E07A5F', '#FBF9F5'],
  });

  // 2. Left and Right Cannons
  setTimeout(() => {
    confetti({
      particleCount: 50,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.65 },
      colors: ['#D9381E', '#2D6A4F', '#E07A5F'],
    });
    confetti({
      particleCount: 50,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.65 },
      colors: ['#D9381E', '#2D6A4F', '#E07A5F'],
    });
  }, 200);
}

interface MatchCelebrationProps {
  venue: Venue;
  onLeave: () => void;
}

export const MatchCelebration: React.FC<MatchCelebrationProps> = ({ venue, onLeave }) => {
  useEffect(() => {
    triggerCelebrationEffects();
  }, []);

  const handleOpenGoogleMaps = () => {
    if (venue.googleMapsUrl) {
      window.open(venue.googleMapsUrl, '_blank');
    } else {
      const query = encodeURIComponent(`${venue.name} ${venue.address}`);
      window.open(`https://www.google.com/maps/search/?api=1&query=${query}`, '_blank');
    }
  };

  const handleShareResult = () => {
    const text = encodeURIComponent(`🎉 Karar verildi! Bu akşam ${venue.name} gidiyoruz! 🍕`);
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300"
    >
      <div className="relative w-full max-w-sm bg-[#FBF9F5] rounded-3xl border border-[#E7E2D9] p-6 shadow-2xl space-y-4 text-center">
        {/* Celebration Header */}
        <div>
          <div className="w-14 h-14 mx-auto rounded-2xl bg-[#E8F5E9] text-[#2D6A4F] flex items-center justify-center text-3xl shadow-xs">
            🎉
          </div>
          <span className="inline-block mt-3 text-xs font-bold uppercase tracking-wider text-[#D9381E] bg-[#FDF2F0] px-3 py-1 rounded-full">
            ORTAK KARAR BULUNDU!
          </span>
          <h2 className="font-display font-black text-2xl text-[#1C1917] mt-1">
            Bu akşam buradayız!
          </h2>
        </div>

        {/* Winner Restaurant Card */}
        <div className="bg-white rounded-2xl border border-[#E7E2D9] overflow-hidden shadow-xs text-left">
          <div className="relative w-full h-44 bg-stone-100">
            <img
              src={venue.photoUrl}
              alt={venue.name}
              className="w-full h-full object-cover"
            />
            {venue.isSponsored && (
              <div className="absolute top-3 left-3 bg-[#D9381E] text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                <Sparkles className="w-3 h-3" />
                <span>{venue.sponsorBadge || 'Sponsorlu'}</span>
              </div>
            )}
          </div>

          <div className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#D9381E] uppercase">{venue.category}</span>
              <div className="flex items-center gap-1 bg-[#F5F0EB] px-2 py-0.5 rounded-lg text-xs font-bold text-[#1C1917]">
                <Star className="w-3.5 h-3.5 fill-[#E07A5F] text-[#E07A5F]" />
                <span>{venue.rating.toFixed(1)}</span>
                <span className="text-[#78716C] font-normal">({venue.reviewCount})</span>
              </div>
            </div>

            <h3 className="font-display font-bold text-xl text-[#1C1917] mt-1">{venue.name}</h3>
            <p className="text-xs text-[#78716C] mt-1 flex items-start gap-1">
              <MapPin className="w-3.5 h-3.5 text-[#78716C] shrink-0 mt-0.5" />
              <span>{venue.address}</span>
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-2">
          <button
            onClick={handleOpenGoogleMaps}
            className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-[#D9381E] hover:bg-[#BF2F18] text-white font-semibold text-sm transition-colors shadow-xs active:translate-y-px"
          >
            <Navigation className="w-4 h-4" />
            <span>Yol Tarifi Al (Google Haritalar)</span>
          </button>

          <button
            onClick={handleShareResult}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-white border border-[#E7E2D9] hover:bg-[#FAF7F2] text-[#1C1917] font-semibold text-sm transition-colors active:translate-y-px"
          >
            <Share2 className="w-4 h-4 text-[#2D6A4F]" />
            <span>WhatsApp ile Paylaş</span>
          </button>

          <button
            onClick={onLeave}
            className="w-full text-center py-2 text-xs text-[#78716C] hover:text-[#D9381E] transition-colors"
          >
            Yeni Karar Odası Başlat
          </button>
        </div>
      </div>
    </div>
  );
};
```

---

### `client/src/components/DeckExhausted.tsx` (component, request-response / modal)

**Analog:** `client/src/components/VenueListModal.tsx:21-52`  
**Match Quality:** role-match  

**Warm Editorial Tie-Breaker Pre-Duel Modal pattern**:
```tsx
import React from 'react';
import { Swords, RotateCcw, LogOut } from 'lucide-react';

interface DeckExhaustedProps {
  onLeave: () => void;
  onStartDuel?: () => void;
}

export const DeckExhausted: React.FC<DeckExhaustedProps> = ({ onLeave, onStartDuel }) => {
  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-sm bg-[#FBF9F5] rounded-3xl border border-[#E7E2D9] p-6 shadow-xl space-y-4 text-center">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-[#FFF3E0] text-[#E65100] flex items-center justify-center text-3xl shadow-xs">
          ⚔️
        </div>

        <div>
          <span className="inline-block text-xs font-bold uppercase tracking-wider text-[#E65100] bg-[#FFF3E0] px-3 py-1 rounded-full">
            ORTAK KARAR BULUNAMADI
          </span>
          <h2 className="font-display font-extrabold text-2xl text-[#1C1917] mt-2">
            Beraberlik!
          </h2>
          <p className="text-xs text-[#78716C] mt-2 leading-relaxed">
            İkiniz de aynı mekanda buluşamadınız. Kararı 5 saniyelik eğlenceli Parmak Güreşi (Rapid Tapper) düellosuyla belirlemeye hazır mısınız?
          </p>
        </div>

        <div className="space-y-2 pt-2">
          <button
            onClick={onStartDuel}
            className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-[#1C1917] hover:bg-black text-white font-display font-bold text-sm transition-all shadow-xs active:translate-y-px"
          >
            <Swords className="w-4 h-4 text-[#E07A5F]" />
            <span>Parmak Güreşi Düellosuna Başla!</span>
          </button>

          <button
            onClick={onLeave}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-white border border-[#E7E2D9] hover:bg-[#FAF7F2] text-[#78716C] font-semibold text-sm transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Odadan Ayrıl</span>
          </button>
        </div>
      </div>
    </div>
  );
};
```

---

### `client/src/components/Lobby.tsx` (component, event-driven / request-response)

**Analog:** `client/src/components/Lobby.tsx`  
**Match Quality:** exact  

**Imports pattern** (`client/src/components/Lobby.tsx:1-8`):
```typescript
import React, { useState, useEffect } from 'react';
import { useRoomSocket } from '../hooks/useRoomSocket.js';
import { Share2, Copy, Check, Users, MapPin, Sparkles, AlertCircle, ArrowRight, Edit2, Eye } from 'lucide-react';
import logoImg from '../assets/logo.jpg';
import { DistrictSelector } from './DistrictSelector.js';
import { VenueListModal } from './VenueListModal.js';
import { SwipeDeck } from './SwipeDeck.js';
import { RoomLocation } from '../types.js';
```

**Starting Swiping & Conditional SwipeDeck View pattern** (`client/src/components/Lobby.tsx:10-23, 440-459`):
```tsx
export const Lobby: React.FC = () => {
  const {
    room,
    currentUser,
    peer,
    connectionStatus,
    error,
    peerDisconnectSeconds,
    partnerProgress,
    matchedVenue,
    isDeckExhausted,
    createRoom,
    joinRoom,
    updateNickname,
    leaveRoom,
    setLocation,
    startSwiping,
    sendSwipe,
  } = useRoomSocket();

  // If room is currently swiping, matched, or duel, render the interactive SwipeDeck
  if (room && (room.status === 'swiping' || room.status === 'matched' || room.status === 'duel')) {
    return (
      <SwipeDeck
        room={room}
        currentUser={currentUser!}
        peer={peer}
        partnerProgress={partnerProgress}
        matchedVenue={matchedVenue}
        isDeckExhausted={isDeckExhausted}
        onSwipe={sendSwipe}
        onLeave={leaveRoom}
      />
    );
  }

  // Inside bottom sticky action bar when room is ready:
  {room && (
    <div className="pt-4 mt-6 border-t border-[#E7E2D9]">
      <button
        disabled={!peer || !peer.connected}
        onClick={startSwiping}
        className="w-full flex items-center justify-center gap-2 py-4 px-4 rounded-xl font-display font-bold text-base transition-all shadow-xs disabled:opacity-40 disabled:cursor-not-allowed bg-[#1C1917] text-white hover:bg-black active:translate-y-px cursor-pointer"
      >
        {peer && peer.connected ? (
          <>
            <span>Oylamayı Başlat</span>
            <ArrowRight className="w-4 h-4" />
          </>
        ) : (
          <span>Partnerin Katılması Bekleniyor...</span>
        )}
      </button>
      <p className="text-[11px] text-center text-[#78716C] mt-2">
        Her iki taraf da katıldığında seçim destesi açılır.
      </p>
    </div>
  )}
```

---

### `client/src/App.tsx` (component, request-response / viewport shell)

**Analog:** `client/src/App.tsx`  
**Match Quality:** exact  

**Mobile PWA Viewport Isolation pattern** (`client/src/App.tsx:1-13`):
```tsx
import React from 'react';
import { Lobby } from './components/Lobby.js';

export const App: React.FC = () => {
  return (
    <main className="min-h-screen h-[100dvh] bg-[#FBF9F5] overflow-hidden select-none">
      <Lobby />
    </main>
  );
};

export default App;
```

---

## Shared Patterns

### 1. TypeScript ESM Module Import Conventions
**Source:** `server/src/index.ts:1-8`, `client/src/App.tsx:1-3`  
**Apply to:** All new `.ts` and `.tsx` files in both server and client  
```typescript
// Rule: Every internal relative import MUST specify the .js extension!
import { Room, Venue, Participant } from '../types.js';
import { VenueCard } from './VenueCard.js';
import { MatchCelebration } from './MatchCelebration.js';
```

### 2. WebSocket Discriminated Union Messaging Pattern
**Source:** `server/src/types.ts:67-95`, `server/src/index.ts:101-137`, `client/src/hooks/useRoomSocket.ts:96-198`  
**Apply to:** `START_SWIPING`, `SWIPE`, `PARTNER_PROGRESS`, `MATCH`, `DECK_EXHAUSTED`  
```typescript
// Type signature:
export type ClientMessage =
  | { type: 'START_SWIPING' }
  | { type: 'SWIPE'; venueId: string; vote: 'like' | 'pass'; cardIndex: number; totalCards: number };

// Handler on server:
case 'SWIPE':
  roomManager.recordSwipe(ws, message.venueId, message.vote, message.cardIndex, message.totalCards);
  break;

// Dispatcher on client:
send({ type: 'SWIPE', venueId, vote, cardIndex, totalCards });
```

### 3. Warm Editorial Minimal Design System Tokens
**Source:** `client/src/index.css:3-15`  
**Apply to:** `SwipeDeck.tsx`, `VenueCard.tsx`, `MatchCelebration.tsx`, `DeckExhausted.tsx`  
```css
/* Color Palette */
Cream Background: #FBF9F5
Card Border: #E7E2D9
Paprika Red (Pass / Primary CTA): #D9381E (Hover: #BF2F18)
Basil Green (Like / Match / Success): #2D6A4F
Terracotta Accent: #E07A5F
Charcoal (Headings / Body Text): #1C1917
Muted Stone (Subtitles / Captions): #78716C

/* Fonts */
Heading font: 'Plus Jakarta Sans', sans-serif (font-display)
Body font: 'Inter', sans-serif (font-sans)
```

### 4. Touch Navigation & Scroll Suppression for Mobile Gestures
**Source:** `03-RESEARCH.md:252-260`, MDN `touch-action`  
**Apply to:** `VenueCard.tsx` and draggable card components  
```tsx
// 1. touch-none to prevent browser back/forward history swipes on iOS Safari and Android Chrome
// 2. select-none to prevent text highlight while dragging
// 3. draggable={false} and pointer-events-none on images to disable native browser image dragging
<motion.div className="touch-none select-none ...">
  <img draggable={false} className="pointer-events-none ..." />
</motion.div>
```

### 5. In-Memory O(1) Match Evaluation & Concurrency Guard
**Source:** `server/src/roomManager.ts`, `03-RESEARCH.md:430-517`  
**Apply to:** Server voting and match resolution  
```typescript
// Guard against duplicate match events from concurrent ticks
if (room.status === 'matched') {
  return { matchedVenue: room.matchedVenue };
}
```

### 6. ASVS Level 1 Security Identity & Input Sanitization
**Source:** `03-RESEARCH.md:640-662`  
**Apply to:** WebSocket message handler in `roomManager.ts`  
```typescript
// 1. Resolve userId strictly from socket map (T-03-01: Discard any client-supplied userId)
const client = this.clients.get(ws);
if (!client) return {};

// 2. State verification (T-03-02: Only allow swipes if room is actively swiping)
if (room.status !== 'swiping') return {};

// 3. Venue verification (T-03-03: Ensure venueId is in the room's verified venues deck)
const venueExists = room.venues?.some((v) => v.id === venueId);
if (!venueExists) return {};
```

---

## No Analog Found

Every file has an analog or direct predecessor in the codebase:

| File | Role | Data Flow | Reason / Adaptation Strategy |
|------|------|-----------|------------------------------|
| `client/src/components/SwipeDeck.tsx` | component | event-driven / gesture physics | Built upon `Lobby.tsx` and Framer Motion 12 patterns; acts as the interactive container for card sliding window. |
| `client/src/components/VenueCard.tsx` | component | event-driven / gesture physics | Adapts the visual restaurant card layout from `VenueListModal.tsx` into a motion-enabled `motion.div` with dynamic tilt and stamp overlays. |
| `client/src/components/MatchCelebration.tsx` | component | event-driven / visual animation | Adapts the modal backdrop from `VenueListModal.tsx` and integrates `canvas-confetti` and `navigator.vibrate`. |
| `client/src/components/DeckExhausted.tsx` | component | request-response / modal | Adapts the bottom sheet/dialog pattern from `VenueListModal.tsx` with Warm Editorial tie-breaker messaging. |

---

## Metadata

**Analog search scope:** `server/src/**`, `client/src/**`  
**Files scanned:** 13  
**Tracked source verified:** Non-empty `git ls-files` for all analogs  
**Pattern extraction date:** 2026-11-08  
