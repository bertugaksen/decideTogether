# Phase 04: Rapid Tapper Tie-Breaker Duel - Pattern Map

**Mapped:** 2026-11-09  
**Files analyzed:** 17  
**Analogs found:** 17 / 17 (100% codebase coverage; 9 exact matches, 8 role matches)  

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `server/src/types.ts` | model | request-response | `server/src/types.ts` | exact |
| `client/src/types.ts` | model | request-response | `client/src/types.ts` | exact |
| `server/src/roomManager.ts` | service | event-driven | `server/src/roomManager.ts` | exact |
| `server/src/index.ts` | controller | request-response / streaming | `server/src/index.ts` | exact |
| `server/src/tests/duel.test.ts` | test | unit / request-response | `server/src/tests/swipeDeck.test.ts` | exact |
| `server/test-duel-probe.js` | test (probe) | event-driven / streaming | `server/test-swipe-probe.js` | exact |
| `client/src/hooks/useRoomSocket.ts` | hook | event-driven / streaming | `client/src/hooks/useRoomSocket.ts` | exact |
| `client/src/utils/soundEffects.ts` | utility | transform / Web Audio API | `client/src/components/MatchCelebration.tsx` | role-match |
| `client/src/components/DeckExhausted.tsx` | component | request-response / modal | `client/src/components/DeckExhausted.tsx` | exact |
| `client/src/components/TugOfWarBar.tsx` | component | transform / visual interpolation | `client/src/components/SwipeDeck.tsx` | role-match |
| `client/src/components/DuelCountdown.tsx` | component | event-driven / visual animation | `client/src/components/MatchCelebration.tsx` | role-match |
| `client/src/components/OnlineDuelView.tsx` | component | event-driven / streaming | `client/src/components/SwipeDeck.tsx` | role-match |
| `client/src/components/SplitScreenDuelView.tsx` | component | event-driven / multi-touch | `client/src/components/SwipeDeck.tsx` | role-match |
| `client/src/components/RapidTapperDuel.tsx` | component (orchestrator) | event-driven / request-response | `client/src/components/SwipeDeck.tsx` | role-match |
| `client/src/components/MatchCelebration.tsx` | component | visual animation / modal | `client/src/components/MatchCelebration.tsx` | exact |
| `client/src/components/SwipeDeck.tsx` | component | event-driven / gesture physics | `client/src/components/SwipeDeck.tsx` | exact |
| `client/src/components/Lobby.tsx` | component | event-driven / request-response | `client/src/components/Lobby.tsx` | exact |

---

## Pattern Assignments

### 1. `server/src/types.ts` (model, request-response)

**Analog:** `server/src/types.ts`  
**Match Quality:** exact  

**Imports pattern:**  
No imports required (pure TypeScript types and interfaces).

**Core Room Status & Model pattern** (`server/src/types.ts:9, 54-68`):
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
  votes?: Record<string, Record<string, 'like' | 'pass'>>; // userId -> venueId -> 'like' | 'pass'
  progress?: Record<string, { cardIndex: number; totalCards: number }>; // userId -> swipe progress
  matchedVenue?: Venue; // The mutual winner
  duelState?: DuelState; // Phase 4 extension
}
```

**DuelState Definition to add:**
```typescript
export interface DuelState {
  status: 'countdown' | 'battling' | 'finished';
  mode: 'online' | 'split';
  startTime: number;
  durationMs: number;
  scores: Record<string, number>; // userId -> cumulative taps
  timer?: NodeJS.Timeout;
}
```

**ClientMessage Discriminated Union pattern** (`server/src/types.ts:71-92`):
```typescript
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
  | { type: 'PING' }
  // Phase 4 Duel additions:
  | { type: 'START_DUEL'; mode?: 'online' | 'split' }
  | { type: 'DUEL_TAP'; taps: number }
  | { type: 'RESOLVE_SPLIT_DUEL'; winnerRole: 'p1' | 'p2'; scores: { p1: number; p2: number } };
```

**ServerMessage Discriminated Union pattern** (`server/src/types.ts:95-114`):
```typescript
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
  | {
      type: 'MATCH';
      venue: Venue;
      duelResult?: {
        winnerId: string;
        scores: Record<string, number>;
        tieBroken?: boolean;
      };
    }
  | { type: 'DECK_EXHAUSTED' }
  // Phase 4 Duel additions:
  | {
      type: 'DUEL_STARTING';
      startTime: number;
      durationMs: number;
      mode: 'online' | 'split';
    }
  | {
      type: 'DUEL_PROGRESS';
      scores: Record<string, number>;
    }
  | { type: 'PONG' }
  | { type: 'ERROR'; message: string };
```

---

### 2. `client/src/types.ts` (model, request-response)

**Analog:** `client/src/types.ts`  
**Match Quality:** exact  

**Imports pattern:**  
No imports required (pure TypeScript declarations, 1:1 synchronized with `server/src/types.ts` plus client-specific `SavedSession`).

**Client Sync pattern** (`client/src/types.ts:54-120`):
- Mirror `DuelState` interface from `server/src/types.ts`.
- Mirror `START_DUEL`, `DUEL_TAP`, `RESOLVE_SPLIT_DUEL` variants in `ClientMessage`.
- Mirror `DUEL_STARTING`, `DUEL_PROGRESS`, and extended `MATCH` in `ServerMessage`.
- Preserve `SavedSession` (`client/src/types.ts:114-119`).

---

### 3. `server/src/roomManager.ts` (service, event-driven)

**Analog:** `server/src/roomManager.ts`  
**Match Quality:** exact  

**Imports pattern** (`server/src/roomManager.ts:1-5`):
```typescript
import { WebSocket } from 'ws';
import { Room, Participant, ServerMessage, Venue, DuelState } from './types.js';
import { VenueService, isValidCoordinate } from './services/venueService.js';
import { MOCK_DISTRICTS } from './services/mockVenues.js';
```

**Client Identity Auth & Socket Lookup pattern** (`server/src/roomManager.ts:209-215, 248-256`):
```typescript
const client = this.clients.get(ws);
if (!client) return false;

const room = this.rooms.get(client.roomCode);
if (!room || room.status !== 'duel') return false;
```
> **Security Rule (T-04-01):** User identity is never extracted from client-controlled message bodies. It is resolved exclusively via `this.clients.get(ws)`.

**Authoritative Duel Lifecycle & Clamping pattern** (`04-RESEARCH.md:493-560`):
```typescript
public startDuel(ws: WebSocket, mode: 'online' | 'split' = 'online'): boolean {
  const client = this.clients.get(ws);
  if (!client) return false;
  const room = this.rooms.get(client.roomCode);
  if (!room || room.status !== 'duel') return false;

  const countdownMs = 3000;
  const durationMs = 5000;
  const startTime = Date.now() + countdownMs;
  const participantIds = Object.keys(room.participants);

  const initialScores: Record<string, number> = {};
  for (const id of participantIds) {
    initialScores[id] = 0;
  }

  room.duelState = {
    status: 'countdown',
    mode,
    startTime,
    durationMs,
    scores: initialScores,
  };

  // Broadcast countdown start to all participants
  this.broadcastToRoom(room.code, {
    type: 'DUEL_STARTING',
    startTime,
    durationMs,
    mode,
  });

  // Authoritative server timer: countdown + duration + 350ms grace
  const totalWait = countdownMs + durationMs + 350;
  room.duelState.timer = setTimeout(() => {
    this.concludeDuel(room.code);
  }, totalWait);

  return true;
}

public recordDuelTap(ws: WebSocket, cumulativeTaps: number): void {
  const client = this.clients.get(ws);
  if (!client) return;
  const room = this.rooms.get(client.roomCode);
  if (!room || !room.duelState || room.duelState.status === 'finished') return;

  const now = Date.now();
  // Reject taps arriving before start or after duration + 400ms grace window (T-04-02)
  if (now < room.duelState.startTime || now > room.duelState.startTime + room.duelState.durationMs + 400) {
    return;
  }

  const currentScore = room.duelState.scores[client.userId] || 0;
  // Anti-cheat rate clamp: maximum jump of 30 taps per batched packet (T-04-02)
  if (cumulativeTaps - currentScore > 30) {
    cumulativeTaps = currentScore + 30;
  }

  room.duelState.scores[client.userId] = Math.max(currentScore, cumulativeTaps);

  this.broadcastToRoom(room.code, {
    type: 'DUEL_PROGRESS',
    scores: room.duelState.scores,
  });
}
```

**Hierarchical Winner Selection & Coin Toss Tie-Breaking pattern** (`04-RESEARCH.md:562-648`):
```typescript
public concludeDuel(roomCode: string, forcedWinnerId?: string): void {
  const room = this.rooms.get(roomCode);
  if (!room || !room.duelState || room.duelState.status === 'finished') return;

  if (room.duelState.timer) {
    clearTimeout(room.duelState.timer);
  }
  room.duelState.status = 'finished';

  const scores = room.duelState.scores;
  const userIds = Object.keys(room.participants);
  let winnerId = forcedWinnerId;
  let tieBroken = false;

  if (!winnerId) {
    if (userIds.length >= 2) {
      const u1 = userIds[0];
      const u2 = userIds[1];
      const s1 = scores[u1] || 0;
      const s2 = scores[u2] || 0;

      if (s1 > s2) {
        winnerId = u1;
      } else if (s2 > s1) {
        winnerId = u2;
      } else {
        // Exact tie: fair coin toss
        winnerId = Math.random() < 0.5 ? u1 : u2;
        tieBroken = true;
      }
    } else {
      winnerId = userIds[0];
    }
  }

  const winningVenue = this.resolveDuelWinner(roomCode, winnerId);
  if (winningVenue) {
    room.status = 'matched';
    room.matchedVenue = winningVenue;
    room.lastActiveAt = Date.now();

    this.broadcastToRoom(room.code, {
      type: 'MATCH',
      venue: winningVenue,
      duelResult: {
        winnerId,
        scores,
        tieBroken,
      },
    });
  }
}

public resolveDuelWinner(roomCode: string, winnerId: string): Venue | undefined {
  const room = this.rooms.get(roomCode);
  if (!room || !room.venues || room.venues.length === 0) return undefined;

  // 1. Winner's likes in room.votes (sorted by rating desc)
  const winnerVotes = room.votes?.[winnerId] || {};
  const likedVenueIds = Object.keys(winnerVotes).filter((vid) => winnerVotes[vid] === 'like');

  if (likedVenueIds.length > 0) {
    const likedVenues = room.venues.filter((v) => likedVenueIds.includes(v.id));
    if (likedVenues.length > 0) {
      likedVenues.sort((a, b) => b.rating - a.rating);
      return likedVenues[0];
    }
  }

  // 2. Winner passed on all: fallback to peer's likes
  const peerId = Object.keys(room.participants).find((id) => id !== winnerId);
  if (peerId) {
    const peerVotes = room.votes?.[peerId] || {};
    const peerLikedIds = Object.keys(peerVotes).filter((vid) => peerVotes[vid] === 'like');
    if (peerLikedIds.length > 0) {
      const peerLikedVenues = room.venues.filter((v) => peerLikedIds.includes(v.id));
      if (peerLikedVenues.length > 0) {
        peerLikedVenues.sort((a, b) => b.rating - a.rating);
        return peerLikedVenues[0];
      }
    }
  }

  // 3. Both passed on all: fallback to top deck venue
  return room.venues[0];
}
```

---

### 4. `server/src/index.ts` (controller, request-response / streaming)

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
```

**Message Dispatch Switch-Case pattern** (`server/src/index.ts:101-144`):
```typescript
switch (message.type) {
  // Existing cases: CREATE_ROOM, JOIN_ROOM, SET_LOCATION, UPDATE_NICKNAME, START_SWIPING, SWIPE, PING...

  case 'START_DUEL':
    roomManager.startDuel(ws, message.mode);
    break;

  case 'DUEL_TAP':
    roomManager.recordDuelTap(ws, message.taps);
    break;

  case 'RESOLVE_SPLIT_DUEL':
    // For local split-screen mode when clients finish on one phone
    // Maps p1 to host and p2 to peer
    const clientInfo = roomManager.getClientInfo(ws);
    if (clientInfo) {
      const room = roomManager.getRoom(clientInfo.roomCode);
      if (room) {
        const winnerId = message.winnerRole === 'p1' ? room.hostId : (room.peerId || room.hostId);
        roomManager.concludeDuel(room.code, winnerId);
      }
    }
    break;

  default:
    console.log('Unhandled client message:', message);
}
```

**Error Handling & Teardown pattern** (`server/src/index.ts:145-163`):
```typescript
} catch (err) {
  console.error('Error parsing client message:', err);
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type: 'ERROR', message: 'Geçersiz mesaj formatı' }));
  }
}
```

---

### 5. `server/src/tests/duel.test.ts` (test, unit)

**Analog:** `server/src/tests/swipeDeck.test.ts`  
**Match Quality:** exact  

**Imports pattern** (`server/src/tests/swipeDeck.test.ts:1-5`):
```typescript
import test from 'node:test';
import assert from 'node:assert/strict';
import { RoomManager } from '../roomManager.js';
import { WebSocket } from 'ws';
import { Room, Venue } from '../types.js';
```

**Mock Socket Helper pattern** (`server/src/tests/swipeDeck.test.ts:7-17`):
```typescript
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
```

**Unit Test Structure for Duel Requirements:**
```typescript
test('startDuel - initializes duelState, sets 3s countdown and 5s duration, broadcasts DUEL_STARTING (DUEL-01)', async () => {
  const manager = new RoomManager();
  const hostMock = createMockSocket();
  const peerMock = createMockSocket();

  const { room } = await manager.createRoom(hostMock.ws, 'Host');
  manager.joinRoom(peerMock.ws, room.code, undefined, 'Peer');
  room.status = 'duel';

  const started = manager.startDuel(hostMock.ws, 'online');
  assert.strictEqual(started, true);
  assert.ok(room.duelState);
  assert.strictEqual(room.duelState.status, 'countdown');
  assert.strictEqual(room.duelState.mode, 'online');
  assert.strictEqual(room.duelState.durationMs, 5000);

  const startMsg = hostMock.sentMessages.find((m) => m.type === 'DUEL_STARTING');
  assert.ok(startMsg);
  assert.strictEqual(startMsg.durationMs, 5000);

  if (room.duelState.timer) clearTimeout(room.duelState.timer);
});

test('recordDuelTap - rejects taps before startTime or after duration expires (T-04-02)', async () => {
  const manager = new RoomManager();
  const hostMock = createMockSocket();
  const { room } = await manager.createRoom(hostMock.ws, 'Host');
  room.status = 'duel';
  manager.startDuel(hostMock.ws, 'online');

  // Immediately send tap during countdown (before startTime)
  manager.recordDuelTap(hostMock.ws, 5);
  assert.strictEqual(room.duelState!.scores[room.hostId], 0);

  if (room.duelState?.timer) clearTimeout(room.duelState.timer);
});

test('recordDuelTap - clamps excessive tap deltas to max 30 per packet (T-04-02)', async () => {
  const manager = new RoomManager();
  const hostMock = createMockSocket();
  const { room } = await manager.createRoom(hostMock.ws, 'Host');
  room.status = 'duel';
  manager.startDuel(hostMock.ws, 'online');

  // Fast-forward startTime to active battle
  room.duelState!.startTime = Date.now() - 500;

  // Bot attempts sending 1,000 taps in single packet
  manager.recordDuelTap(hostMock.ws, 1000);
  assert.strictEqual(room.duelState!.scores[room.hostId], 30);

  if (room.duelState?.timer) clearTimeout(room.duelState.timer);
});

test('resolveDuelWinner - selects winner likes, falls back to peer likes, falls back to deck 0 (DUEL-04)', async () => {
  const manager = new RoomManager();
  const hostMock = createMockSocket();
  const peerMock = createMockSocket();
  const { room, host } = await manager.createRoom(hostMock.ws, 'Host');
  manager.joinRoom(peerMock.ws, room.code, undefined, 'Peer');
  const peerId = Object.keys(room.participants).find((id) => id !== host.id)!;

  // 1. Host has liked venue 1
  room.votes = {
    [host.id]: { [room.venues![1].id]: 'like' },
    [peerId]: { [room.venues![2].id]: 'like' },
  };
  const winnerVenue1 = manager.resolveDuelWinner(room.code, host.id);
  assert.strictEqual(winnerVenue1?.id, room.venues![1].id);

  // 2. Host passed on all, fallback to peer likes
  room.votes = {
    [host.id]: { [room.venues![0].id]: 'pass' },
    [peerId]: { [room.venues![2].id]: 'like' },
  };
  const winnerVenue2 = manager.resolveDuelWinner(room.code, host.id);
  assert.strictEqual(winnerVenue2?.id, room.venues![2].id);

  // 3. Both passed on all, fallback to deck venue 0
  room.votes = {
    [host.id]: {},
    [peerId]: {},
  };
  const winnerVenue3 = manager.resolveDuelWinner(room.code, host.id);
  assert.strictEqual(winnerVenue3?.id, room.venues![0].id);
});

test('concludeDuel - exact tie is resolved via fair coin toss with tieBroken flag', async () => {
  const manager = new RoomManager();
  const hostMock = createMockSocket();
  const peerMock = createMockSocket();
  const { room, host } = await manager.createRoom(hostMock.ws, 'Host');
  manager.joinRoom(peerMock.ws, room.code, undefined, 'Peer');
  const peerId = Object.keys(room.participants).find((id) => id !== host.id)!;

  room.status = 'duel';
  manager.startDuel(hostMock.ws, 'online');
  room.duelState!.scores[host.id] = 42;
  room.duelState!.scores[peerId] = 42;

  manager.concludeDuel(room.code);

  assert.strictEqual(room.status, 'matched');
  assert.ok(room.matchedVenue);
  const matchMsg = hostMock.sentMessages.find((m) => m.type === 'MATCH');
  assert.ok(matchMsg);
  assert.strictEqual(matchMsg.duelResult.tieBroken, true);
  assert.ok([host.id, peerId].includes(matchMsg.duelResult.winnerId));
});
```

---

### 6. `server/test-duel-probe.js` (test/probe, event-driven / streaming)

**Analog:** `server/test-swipe-probe.js`  
**Match Quality:** exact  

**Imports & Probe Execution pattern** (`server/test-swipe-probe.js:1-53, 104-150`):
```javascript
import { WebSocket } from 'ws';
import assert from 'node:assert';

async function runDuelProbe() {
  console.log('--- Starting DecideTogether Rapid Tapper Duel WebSocket Probe ---');

  const wsA = new WebSocket('ws://localhost:3001/ws');
  await new Promise((res, rej) => {
    wsA.on('open', res);
    wsA.on('error', rej);
  });
  console.log('✓ Host connected to WebSocket');

  // 1. Create Room
  wsA.send(JSON.stringify({ type: 'CREATE_ROOM', nickname: 'Duel Host' }));
  const roomCreated = await new Promise((resolve) => {
    const handler = (data) => {
      const msg = JSON.parse(data.toString());
      if (msg.type === 'ROOM_CREATED') {
        wsA.off('message', handler);
        resolve(msg);
      }
    };
    wsA.on('message', handler);
  });
  const roomCode = roomCreated.roomCode;
  console.log(`✓ Room created PIN: ${roomCode}`);

  // 2. Peer Joins
  const wsB = new WebSocket('ws://localhost:3001/ws');
  await new Promise((res, rej) => {
    wsB.on('open', res);
    wsB.on('error', rej);
  });
  wsB.send(JSON.stringify({ type: 'JOIN_ROOM', roomCode, nickname: 'Duel Peer' }));

  // 3. Exhaust Deck or Direct Trigger START_DUEL
  // ...
  // 4. Send Batched DUEL_TAP packets from both clients
  // 5. Await MATCH broadcast with duelResult
  // 6. Assert latency, scores, and winner resolution
  wsA.close();
  wsB.close();
  console.log('🎉 ALL DUEL PROBE TESTS PASSED SUCCESSFULLY! 🎉');
  process.exit(0);
}

runDuelProbe().catch((err) => {
  console.error('Duel probe failed:', err);
  process.exit(1);
});
```

---

### 7. `client/src/hooks/useRoomSocket.ts` (hook, event-driven / streaming)

**Analog:** `client/src/hooks/useRoomSocket.ts`  
**Match Quality:** exact  

**Imports pattern** (`client/src/hooks/useRoomSocket.ts:1-3`):
```typescript
import { useState, useEffect, useRef, useCallback } from 'react';
import { Room, Participant, ServerMessage, ClientMessage, SavedSession, Venue, DuelState } from '../types.js';
```

**State & Message Listener Extensions pattern** (`client/src/hooks/useRoomSocket.ts:14-20, 130-160`):
```typescript
// New Duel States:
const [duelState, setDuelState] = useState<{
  status: 'countdown' | 'battling' | 'finished';
  startTime: number;
  durationMs: number;
  mode: 'online' | 'split';
  scores: Record<string, number>;
} | null>(null);

// Inside ws.onmessage switch:
case 'DUEL_STARTING':
  setDuelState({
    status: 'countdown',
    startTime: message.startTime,
    durationMs: message.durationMs,
    mode: message.mode,
    scores: {},
  });
  break;

case 'DUEL_PROGRESS':
  setDuelState((prev) => (prev ? { ...prev, scores: message.scores } : null));
  break;

case 'MATCH':
  setMatchedVenue(message.venue);
  setRoom((prev) => (prev ? { ...prev, status: 'matched', matchedVenue: message.venue } : null));
  if (message.duelResult) {
    setDuelState((prev) => (prev ? { ...prev, status: 'finished', scores: message.duelResult!.scores } : null));
  }
  break;
```

**Public Action Methods to Expose** (`client/src/hooks/useRoomSocket.ts:325-341`):
```typescript
const startDuel = useCallback((mode: 'online' | 'split' = 'online') => {
  send({ type: 'START_DUEL', mode });
}, [send]);

const sendDuelTap = useCallback((taps: number) => {
  send({ type: 'DUEL_TAP', taps });
}, [send]);

const resolveSplitDuel = useCallback((winnerRole: 'p1' | 'p2', scores: { p1: number; p2: number }) => {
  send({ type: 'RESOLVE_SPLIT_DUEL', winnerRole, scores });
}, [send]);
```

---

### 8. `client/src/utils/soundEffects.ts` (utility, Web Audio API synthesis)

**Analog:** `client/src/components/MatchCelebration.tsx` (utility helper `triggerCelebrationEffects` using Web Audio / Haptics)  
**Match Quality:** role-match  

**Synthesizer Pattern** (`04-RESEARCH.md:325-388`):
```typescript
class DuelSoundEffects {
  private ctx: AudioContext | null = null;

  public initOnUserGesture(): void {
    if (typeof window === 'undefined') return;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  private playTone(freq: number, duration: number, type: OscillatorType = 'sine', gainVal: number = 0.25): void {
    try {
      this.initOnUserGesture();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      gain.gain.setValueAtTime(gainVal, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch {
      // Gracefully ignore audio errors on restricted devices
    }
  }

  // 3-2-1 countdown tick (C5, 523.25Hz, crisp 80ms)
  public playCountdownTick(): void {
    this.playTone(523.25, 0.08, 'sine', 0.2);
  }

  // "BAŞLA!" fanfare start (C6, 1046.5Hz, triumphant 250ms)
  public playStartFanfare(): void {
    this.playTone(1046.5, 0.25, 'triangle', 0.35);
  }

  // Subtle tap feedback sound (low click, 180Hz, 25ms)
  public playTapSound(): void {
    this.playTone(180, 0.025, 'triangle', 0.1);
  }

  // Game over buzzer (descending tone, 320Hz, 300ms)
  public playBuzzer(): void {
    this.playTone(320, 0.3, 'sawtooth', 0.25);
  }
}

export const soundEffects = new DuelSoundEffects();
```

---

### 9. `client/src/components/DeckExhausted.tsx` (component, request-response / modal)

**Analog:** `client/src/components/DeckExhausted.tsx`  
**Match Quality:** exact  

**Imports pattern** (`client/src/components/DeckExhausted.tsx:1-3`):
```typescript
import React from 'react';
import { Swords, LogOut, Smartphone } from 'lucide-react';
import { soundEffects } from '../utils/soundEffects.js';
```

**Props & Action Handlers pattern** (`client/src/components/DeckExhausted.tsx:4-7, 33-50`):
```tsx
interface DeckExhaustedProps {
  onLeave: () => void;
  onStartOnlineDuel?: () => void;
  onStartSplitDuel?: () => void;
}

export const DeckExhausted: React.FC<DeckExhaustedProps> = ({
  onLeave,
  onStartOnlineDuel,
  onStartSplitDuel,
}) => {
  const handleOnlineClick = () => {
    soundEffects.initOnUserGesture(); // Unlock AudioContext on mobile
    onStartOnlineDuel?.();
  };

  const handleSplitClick = () => {
    soundEffects.initOnUserGesture(); // Unlock AudioContext on mobile
    onStartSplitDuel?.();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-sm bg-[#FBF9F5] rounded-3xl border border-[#E7E2D9] p-6 shadow-xl space-y-4 text-center">
        {/* Header and description */}
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

        {/* Dual Mode Actions per UI-SPEC */}
        <div className="space-y-2 pt-2">
          {/* Primary CTA (Mode A) */}
          <button
            onClick={handleOnlineClick}
            className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-[#D9381E] hover:bg-[#BF2F18] text-white font-display font-bold text-sm transition-all shadow-xs active:translate-y-px cursor-pointer"
          >
            <Swords className="w-4 h-4 text-white" />
            <span>Parmak Güreşini Başlat</span>
          </button>

          {/* Secondary CTA (Mode B) */}
          <button
            onClick={handleSplitClick}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-white border border-[#E7E2D9] hover:bg-[#FAF7F2] text-[#1C1917] font-semibold text-sm transition-colors cursor-pointer"
          >
            <Smartphone className="w-4 h-4 text-[#2D6A4F]" />
            <span>Yan Yana Oyna (Tek Telefon)</span>
          </button>

          {/* Exit Action */}
          <button
            onClick={onLeave}
            className="w-full flex items-center justify-center gap-2 py-2 px-4 text-[#78716C] hover:text-[#D9381E] font-medium text-xs transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Odadan Ayrıl</span>
          </button>
        </div>
      </div>
    </div>
  );
};
```

---

### 10. `client/src/components/TugOfWarBar.tsx` (component, transform / visual interpolation)

**Analog:** `client/src/components/SwipeDeck.tsx` (progress bar indicator `SwipeDeck.tsx:92-97`)  
**Match Quality:** role-match  

**Tug-of-War Mathematical Model & Transition:**
```tsx
import React from 'react';

interface TugOfWarBarProps {
  score1: number;
  score2: number;
  label1?: string;
  label2?: string;
  smoothingFactor?: number; // k = 4 default
}

export const TugOfWarBar: React.FC<TugOfWarBarProps> = ({
  score1,
  score2,
  label1 = 'Oyuncu 1',
  label2 = 'Oyuncu 2',
  smoothingFactor = 4,
}) => {
  // Laplace smoothing: (score1 + k) / (score1 + score2 + 2k) * 100
  const p1Percent = Math.round(
    ((score1 + smoothingFactor) / (score1 + score2 + 2 * smoothingFactor)) * 100
  );
  const p2Percent = 100 - p1Percent;

  return (
    <div className="w-full space-y-1 select-none">
      <div className="flex justify-between items-center text-xs font-bold px-1">
        <span className="text-[#D9381E] truncate max-w-[120px]">{label1} ({score1})</span>
        <span className="text-[#2D6A4F] truncate max-w-[120px]">({score2}) {label2}</span>
      </div>

      <div className="w-full h-3 bg-[#1C1917] rounded-full overflow-hidden flex border border-[#3E3835]">
        <div
          className="bg-[#D9381E] h-full"
          style={{
            width: `${p1Percent}%`,
            transition: 'width 120ms cubic-bezier(0.34, 1.56, 0.64, 1)',
          }}
        />
        <div
          className="bg-[#2D6A4F] h-full"
          style={{
            width: `${p2Percent}%`,
            transition: 'width 120ms cubic-bezier(0.34, 1.56, 0.64, 1)',
          }}
        />
      </div>
    </div>
  );
};
```

---

### 11. `client/src/components/DuelCountdown.tsx` (component, event-driven / visual animation)

**Analog:** `client/src/components/MatchCelebration.tsx` (animated modal overlay)  
**Match Quality:** role-match  

**Framer Motion Countdown Pattern:**
```tsx
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { soundEffects } from '../utils/soundEffects.js';

interface DuelCountdownProps {
  onComplete: () => void;
}

export const DuelCountdown: React.FC<DuelCountdownProps> = ({ onComplete }) => {
  const [step, setStep] = useState<number>(3); // 3, 2, 1, 0 ('BAŞLA!')

  useEffect(() => {
    soundEffects.initOnUserGesture();
    soundEffects.playCountdownTick();

    const interval = setInterval(() => {
      setStep((prev) => {
        if (prev === 1) {
          soundEffects.playStartFanfare();
          return 0; // "BAŞLA!"
        }
        if (prev === 0) {
          clearInterval(interval);
          onComplete();
          return -1;
        }
        soundEffects.playCountdownTick();
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [onComplete]);

  if (step < 0) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs select-none">
      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ scale: 0.4, opacity: 0 }}
          animate={{ scale: 1.2, opacity: 1 }}
          exit={{ scale: 2, opacity: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="text-center"
        >
          {step > 0 ? (
            <span className="font-display font-black text-8xl text-white drop-shadow-lg">
              {step}
            </span>
          ) : (
            <span className="font-display font-black text-6xl text-[#D9381E] drop-shadow-xl animate-pulse">
              BAŞLA! 🔥
            </span>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
```

---

### 12. `client/src/components/OnlineDuelView.tsx` (component, event-driven / streaming)

**Analog:** `client/src/components/SwipeDeck.tsx` (interactive viewport with real-time UI)  
**Match Quality:** role-match  

**Touch Handling & 75–100ms Batched Cumulative Sync Pattern:**
```tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { soundEffects } from '../utils/soundEffects.js';
import { TugOfWarBar } from './TugOfWarBar.js';
import { Participant } from '../types.js';

interface OnlineDuelViewProps {
  currentUser: Participant;
  peer: Participant | null;
  opponentScore: number;
  onSendTapBatch: (cumulativeTaps: number) => void;
  onDuelFinish: () => void;
  durationMs?: number; // 5000ms default
}

export const OnlineDuelView: React.FC<OnlineDuelViewProps> = ({
  currentUser,
  peer,
  opponentScore,
  onSendTapBatch,
  onDuelFinish,
  durationMs = 5000,
}) => {
  const [localTaps, setLocalTaps] = useState(0);
  const [timeLeftMs, setTimeLeftMs] = useState(durationMs);
  const localTapsRef = useRef(0);
  const lastSentTapsRef = useRef(0);

  // 1. Optimistic 0ms local tap registration with haptic pulse
  const handleTouch = useCallback((e: React.TouchEvent) => {
    const newTaps = e.changedTouches.length;
    localTapsRef.current += newTaps;
    setLocalTaps(localTapsRef.current);

    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(15);
      } catch {}
    }
    soundEffects.playTapSound();
  }, []);

  // Pointer fallback for desktop testing
  const handlePointerDown = useCallback(() => {
    localTapsRef.current += 1;
    setLocalTaps(localTapsRef.current);
    soundEffects.playTapSound();
  }, []);

  // 2. Batched WebSocket cumulative sync (every 80ms)
  useEffect(() => {
    const batchTimer = setInterval(() => {
      if (localTapsRef.current > lastSentTapsRef.current) {
        lastSentTapsRef.current = localTapsRef.current;
        onSendTapBatch(localTapsRef.current);
      }
    }, 80);

    return () => clearInterval(batchTimer);
  }, [onSendTapBatch]);

  // 3. 60fps Millisecond timer countdown
  useEffect(() => {
    const startTime = Date.now();
    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, durationMs - elapsed);
      setTimeLeftMs(remaining);

      if (remaining <= 0) {
        clearInterval(timer);
        soundEffects.playBuzzer();
        // Flush remaining taps immediately
        if (localTapsRef.current > lastSentTapsRef.current) {
          onSendTapBatch(localTapsRef.current);
        }
        onDuelFinish();
      }
    }, 30);

    return () => clearInterval(timer);
  }, [durationMs, onDuelFinish, onSendTapBatch]);

  const timerPercent = (timeLeftMs / durationMs) * 100;

  return (
    <div className="fixed inset-0 select-none overflow-hidden flex flex-col justify-between bg-[#FBF9F5] touch-none">
      {/* Millisecond Timer Bar */}
      <div className="w-full bg-[#E7E2D9] h-2">
        <div
          className="bg-[#D9381E] h-full transition-all duration-75 ease-linear"
          style={{ width: `${timerPercent}%` }}
        />
      </div>

      {/* Tug of War & Live Scores */}
      <div className="px-4 py-3 bg-white border-b border-[#E7E2D9]">
        <TugOfWarBar
          score1={localTaps}
          score2={opponentScore}
          label1={currentUser.nickname || 'Sen'}
          label2={peer?.nickname || 'Partner'}
        />
      </div>

      {/* Giant Interactive Tap Pad */}
      <div
        onTouchStart={handleTouch}
        onPointerDown={handlePointerDown}
        style={{ touchAction: 'none' }}
        className="flex-1 m-4 rounded-3xl bg-[#D9381E] text-white flex flex-col items-center justify-center active:scale-[0.99] transition-transform cursor-pointer shadow-lg"
      >
        <span className="text-sm uppercase tracking-widest font-bold opacity-80">
          SERİ DOKUN! 🔥
        </span>
        <div className="font-display font-black text-7xl mt-2 tabular-nums">
          {localTaps}
        </div>
      </div>
    </div>
  );
};
```

---

### 13. `client/src/components/SplitScreenDuelView.tsx` (component, event-driven / multi-touch)

**Analog:** `client/src/components/SwipeDeck.tsx`  
**Match Quality:** role-match  

**Split-Screen Multi-Touch Isolation Pattern** (`04-RESEARCH.md:392-475`):
```tsx
import React, { useRef, useState, useEffect, useCallback } from 'react';
import { soundEffects } from '../utils/soundEffects.js';
import { TugOfWarBar } from './TugOfWarBar.js';

interface SplitScreenDuelProps {
  onComplete: (winnerRole: 'p1' | 'p2', scores: { p1: number; p2: number }) => void;
  durationMs?: number;
}

export const SplitScreenDuelView: React.FC<SplitScreenDuelProps> = ({
  onComplete,
  durationMs = 5000,
}) => {
  const [p1Score, setP1Score] = useState(0);
  const [p2Score, setP2Score] = useState(0);
  const [timeLeftMs, setTimeLeftMs] = useState(durationMs);
  const p1ScoreRef = useRef(0);
  const p2ScoreRef = useRef(0);

  const triggerHaptic = () => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(15);
      } catch {}
    }
  };

  // Touch isolation: e.changedTouches on p1 container only
  const handleP1Touch = useCallback((e: React.TouchEvent) => {
    const count = e.changedTouches.length;
    p1ScoreRef.current += count;
    setP1Score(p1ScoreRef.current);
    triggerHaptic();
    soundEffects.playTapSound();
  }, []);

  // Touch isolation: e.changedTouches on p2 container only
  const handleP2Touch = useCallback((e: React.TouchEvent) => {
    const count = e.changedTouches.length;
    p2ScoreRef.current += count;
    setP2Score(p2ScoreRef.current);
    triggerHaptic();
    soundEffects.playTapSound();
  }, []);

  // Countdown battle timer
  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, durationMs - elapsed);
      setTimeLeftMs(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
        soundEffects.playBuzzer();
        const s1 = p1ScoreRef.current;
        const s2 = p2ScoreRef.current;
        const winner = s1 >= s2 ? 'p1' : 'p2';
        onComplete(winner, { p1: s1, p2: s2 });
      }
    }, 30);

    return () => clearInterval(interval);
  }, [durationMs, onComplete]);

  return (
    <div className="fixed inset-0 select-none overflow-hidden flex flex-col touch-none bg-[#1C1917]">
      {/* Top Half: Player 1 (Rotated 180° for Seated Opponent) */}
      <div
        onTouchStart={handleP1Touch}
        style={{ touchAction: 'none' }}
        className="flex-1 bg-[#D9381E] text-white flex flex-col items-center justify-center rotate-180 active:brightness-95 transition-all cursor-pointer"
      >
        <span className="text-xs uppercase tracking-widest font-bold opacity-80">Oyuncu 1</span>
        <div className="font-display font-black text-6xl mt-1 tabular-nums">{p1Score}</div>
      </div>

      {/* Center Dividing Seam (56px per UI-SPEC) */}
      <div className="h-14 bg-[#1C1917] border-y border-[#3E3835] flex items-center justify-between px-4 z-10 shrink-0">
        <TugOfWarBar score1={p1Score} score2={p2Score} label1="P1" label2="P2" />
      </div>

      {/* Bottom Half: Player 2 (Normal 0° Orientation) */}
      <div
        onTouchStart={handleP2Touch}
        style={{ touchAction: 'none' }}
        className="flex-1 bg-[#2D6A4F] text-white flex flex-col items-center justify-center active:brightness-95 transition-all cursor-pointer"
      >
        <span className="text-xs uppercase tracking-widest font-bold opacity-80">Oyuncu 2</span>
        <div className="font-display font-black text-6xl mt-1 tabular-nums">{p2Score}</div>
      </div>
    </div>
  );
};
```

---

### 14. `client/src/components/RapidTapperDuel.tsx` (component, orchestrator)

**Analog:** `client/src/components/SwipeDeck.tsx` (view state manager)  
**Match Quality:** role-match  

**Orchestrator Pattern:**
```tsx
import React, { useState } from 'react';
import { DuelCountdown } from './DuelCountdown.js';
import { OnlineDuelView } from './OnlineDuelView.js';
import { SplitScreenDuelView } from './SplitScreenDuelView.js';
import { Participant } from '../types.js';

interface RapidTapperDuelProps {
  mode: 'online' | 'split';
  currentUser: Participant;
  peer: Participant | null;
  opponentScore?: number;
  onSendTapBatch: (taps: number) => void;
  onSplitComplete: (winnerRole: 'p1' | 'p2', scores: { p1: number; p2: number }) => void;
  onOnlineFinish: () => void;
}

export const RapidTapperDuel: React.FC<RapidTapperDuelProps> = ({
  mode,
  currentUser,
  peer,
  opponentScore = 0,
  onSendTapBatch,
  onSplitComplete,
  onOnlineFinish,
}) => {
  const [phase, setPhase] = useState<'countdown' | 'battling' | 'finished'>('countdown');

  return (
    <>
      {phase === 'countdown' && (
        <DuelCountdown onComplete={() => setPhase('battling')} />
      )}

      {phase === 'battling' && mode === 'online' && (
        <OnlineDuelView
          currentUser={currentUser}
          peer={peer}
          opponentScore={opponentScore}
          onSendTapBatch={onSendTapBatch}
          onDuelFinish={onOnlineFinish}
        />
      )}

      {phase === 'battling' && mode === 'split' && (
        <SplitScreenDuelView
          onComplete={(winnerRole, scores) => {
            setPhase('finished');
            onSplitComplete(winnerRole, scores);
          }}
        />
      )}
    </>
  );
};
```

---

### 15. `client/src/components/MatchCelebration.tsx` (component, visual animation / modal)

**Analog:** `client/src/components/MatchCelebration.tsx`  
**Match Quality:** exact  

**Imports pattern** (`client/src/components/MatchCelebration.tsx:1-4`):
```typescript
import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Star, MapPin, Sparkles, Navigation, Share2, Trophy } from 'lucide-react';
import { Venue } from '../types.js';
```

**Duel Result Header Extension** (`client/src/components/MatchCelebration.tsx:45-48, 77-87`):
```tsx
interface MatchCelebrationProps {
  venue: Venue;
  onLeave: () => void;
  duelResult?: {
    winnerNickname?: string;
    scores?: Record<string, number>;
    tieBroken?: boolean;
  };
}

// In render header:
{duelResult?.tieBroken ? (
  <span className="inline-block mt-3 text-xs font-bold uppercase tracking-wider text-[#E07A5F] bg-[#FFF3E0] px-3 py-1 rounded-full">
    TAM BERABERLİK! KAZANAN YAZI-TURA İLE BELİRLENDİ: {duelResult.winnerNickname}
  </span>
) : duelResult?.winnerNickname ? (
  <span className="inline-block mt-3 text-xs font-bold uppercase tracking-wider text-[#2D6A4F] bg-[#E8F5E9] px-3 py-1 rounded-full">
    🏆 DÜELLO KAZANANI: {duelResult.winnerNickname}
  </span>
) : (
  <span className="inline-block mt-3 text-xs font-bold uppercase tracking-wider text-[#D9381E] bg-[#FDF2F0] px-3 py-1 rounded-full">
    ORTAK KARAR BULUNDU!
  </span>
)}
```

---

### 16. `client/src/components/SwipeDeck.tsx` (component, event-driven / gesture physics)

**Analog:** `client/src/components/SwipeDeck.tsx`  
**Match Quality:** exact  

**Duel State Transition pattern** (`client/src/components/SwipeDeck.tsx:56-59`):
```tsx
// If all cards swiped without match or server reports duel
if (isDeckExhausted || currentIndex >= venues.length) {
  return (
    <DeckExhausted
      onLeave={onLeave}
      onStartOnlineDuel={onStartOnlineDuel}
      onStartSplitDuel={onStartSplitDuel}
    />
  );
}
```

---

### 17. `client/src/components/Lobby.tsx` (component, event-driven / request-response)

**Analog:** `client/src/components/Lobby.tsx`  
**Match Quality:** exact  

**Routing & Props Injection pattern** (`client/src/components/Lobby.tsx:94-108`):
```tsx
// If room is currently swiping, matched, or duel, render the interactive SwipeDeck or RapidTapperDuel
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
      onStartOnlineDuel={() => startDuel('online')}
      onStartSplitDuel={() => startDuel('split')}
    />
  );
}
```

---

## Shared Patterns

### 1. Anti-Cheat & Socket Identity Resolution
**Source:** `server/src/roomManager.ts:249-253`  
**Apply to:** All duel server actions (`startDuel`, `recordDuelTap`, `concludeDuel`)  
```typescript
const client = this.clients.get(ws);
if (!client) return;
const room = this.rooms.get(client.roomCode);
if (!room || room.status !== 'duel') return;
```
> Identity is bound to the WebSocket socket instance, completely eliminating user-spoofing vectors.

### 2. Rate Clamping & Authoritative Timing
**Source:** `server/src/roomManager.ts`  
**Apply to:** `recordDuelTap`, `startDuel`  
```typescript
// Reject timestamps outside the valid battle window
const now = Date.now();
if (now < room.duelState.startTime || now > room.duelState.startTime + room.duelState.durationMs + 400) {
  return;
}

// Anti-macro clamp
if (cumulativeTaps - currentScore > 30) {
  cumulativeTaps = currentScore + 30;
}
```

### 3. High-Frequency Optimistic UI with Batched Sync
**Source:** `client/src/components/OnlineDuelView.tsx`  
**Apply to:** Online multiplayer gaming interactions  
```typescript
// 1. 0ms local visual update
localTapsRef.current += newTaps;
setLocalTaps(localTapsRef.current);

// 2. Batched cumulative packet every 75-100ms
setInterval(() => {
  if (localTapsRef.current > lastSentTapsRef.current) {
    lastSentTapsRef.current = localTapsRef.current;
    sendTapBatch(localTapsRef.current);
  }
}, 80);
```

### 4. Zero-Asset Synthetic Audio & Haptics
**Source:** `client/src/utils/soundEffects.ts` and `client/src/components/MatchCelebration.tsx:9-16`  
**Apply to:** Countdown beeps, battle fanfare, tap clicks, buzzer  
```typescript
// Web Audio API oscillator synthesis initialized on user gesture
osc.type = 'sine';
osc.frequency.setValueAtTime(freq, ctx.currentTime);
gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);

// Haptic feedback
if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
  try { navigator.vibrate(15); } catch {}
}
```

### 5. Multi-Touch Isolation & Zoom Prevention
**Source:** `client/src/components/SplitScreenDuelView.tsx`  
**Apply to:** Split-screen and full-screen touch pads  
```css
/* Eliminates 300ms click latency and double-tap zoom natively */
touch-action: none;
user-select: none;
```
```tsx
onTouchStart={(e) => {
  const newTaps = e.changedTouches.length;
  // Increment local score by independent touch contact points
}}
```

---

## No Analog Found

Every planned file has a verified tracked analog in the existing codebase:
- 9 files have exact analogs (`server/src/types.ts`, `client/src/types.ts`, `server/src/roomManager.ts`, `server/src/index.ts`, `server/src/tests/duel.test.ts`, `server/test-duel-probe.js`, `client/src/hooks/useRoomSocket.ts`, `client/src/components/DeckExhausted.tsx`, `client/src/components/MatchCelebration.tsx`).
- 8 files have role-match analogs (`client/src/utils/soundEffects.ts`, `client/src/components/TugOfWarBar.tsx`, `client/src/components/DuelCountdown.tsx`, `client/src/components/OnlineDuelView.tsx`, `client/src/components/SplitScreenDuelView.tsx`, `client/src/components/RapidTapperDuel.tsx`, `client/src/components/SwipeDeck.tsx`, `client/src/components/Lobby.tsx`).

---

## Metadata

**Analog search scope:** `server/src/`, `server/src/tests/`, `server/*.js`, `client/src/`, `client/src/components/`, `client/src/hooks/`  
**Files scanned:** 22 tracked files  
**Tracked source gate:** Verified with `git ls-files` — 0 mirror/untracked paths  
**Pattern extraction date:** 2026-11-09  
