import test from 'node:test';
import assert from 'node:assert/strict';
import { RoomManager } from '../roomManager.js';
import { WebSocket } from 'ws';

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

test('startDuel - transitions room into countdown, sets startTime ~3000ms ahead, initializes scores to 0, broadcasts DUEL_STARTING (DUEL-01)', async () => {
  const manager = new RoomManager();
  const hostMock = createMockSocket();
  const peerMock = createMockSocket();

  const { room, host } = await manager.createRoom(hostMock.ws, 'Host');
  manager.joinRoom(peerMock.ws, room.code, undefined, 'Peer');
  const peerId = Object.keys(room.participants).find((id) => id !== host.id)!;

  // Deck exhausted or direct transition into duel
  room.status = 'duel';

  const beforeTime = Date.now();
  const started = manager.startDuel(hostMock.ws, 'online');
  const afterTime = Date.now();

  assert.strictEqual(started, true);
  assert.ok(room.duelState);
  assert.strictEqual(room.duelState.status, 'countdown');
  assert.strictEqual(room.duelState.mode, 'online');
  assert.strictEqual(room.duelState.durationMs, 5000);
  assert.ok(room.duelState.startTime >= beforeTime + 2950 && room.duelState.startTime <= afterTime + 3050);
  assert.strictEqual(room.duelState.scores[host.id], 0);
  assert.strictEqual(room.duelState.scores[peerId], 0);
  assert.ok(room.duelState.timer);

  // Assert both host and peer received DUEL_STARTING
  const hostMsg = hostMock.sentMessages.find((m) => m.type === 'DUEL_STARTING');
  assert.ok(hostMsg);
  assert.strictEqual(hostMsg.durationMs, 5000);
  assert.strictEqual(hostMsg.mode, 'online');
  assert.strictEqual(hostMsg.startTime, room.duelState.startTime);

  const peerMsg = peerMock.sentMessages.find((m) => m.type === 'DUEL_STARTING');
  assert.ok(peerMsg);
  assert.strictEqual(peerMsg.durationMs, 5000);

  // Cleanup timer
  if (room.duelState.timer) {
    clearTimeout(room.duelState.timer);
  }
});

test('startDuel - rejects unauthorized sockets or calls when room.status !== duel (T-04-01)', async () => {
  const manager = new RoomManager();
  const hostMock = createMockSocket();
  const unauthMock = createMockSocket();

  const { room } = await manager.createRoom(hostMock.ws, 'Host');

  // 1. Unauthorized socket not in any room
  const unauthStarted = manager.startDuel(unauthMock.ws, 'online');
  assert.strictEqual(unauthStarted, false);
  assert.strictEqual(room.duelState, undefined);

  // 2. Room status is 'waiting' (not 'duel')
  assert.strictEqual(room.status, 'waiting');
  const waitingStarted = manager.startDuel(hostMock.ws, 'online');
  assert.strictEqual(waitingStarted, false);
  assert.strictEqual(room.duelState, undefined);

  // 3. Room status is 'swiping' (not 'duel')
  room.status = 'swiping';
  const swipingStarted = manager.startDuel(hostMock.ws, 'online');
  assert.strictEqual(swipingStarted, false);
  assert.strictEqual(room.duelState, undefined);
});

test('recordDuelTap - ignores taps sent during countdown before startTime (T-04-02)', async () => {
  const manager = new RoomManager();
  const hostMock = createMockSocket();
  const { room, host } = await manager.createRoom(hostMock.ws, 'Host');
  room.status = 'duel';
  manager.startDuel(hostMock.ws, 'online');

  // Immediately send tap during countdown (before startTime)
  manager.recordDuelTap(hostMock.ws, 10);
  assert.strictEqual(room.duelState!.scores[host.id], 0);

  // Clean timer
  if (room.duelState?.timer) clearTimeout(room.duelState.timer);
});

test('recordDuelTap - clamps tap deltas exceeding 30 to currentScore + 30 (T-04-02)', async () => {
  const manager = new RoomManager();
  const hostMock = createMockSocket();
  const { room, host } = await manager.createRoom(hostMock.ws, 'Host');
  room.status = 'duel';
  manager.startDuel(hostMock.ws, 'online');

  // Move startTime into active battle window
  room.duelState!.startTime = Date.now() - 500;

  // Bot attempts sending 1,000 taps in single packet
  manager.recordDuelTap(hostMock.ws, 1000);
  assert.strictEqual(room.duelState!.scores[host.id], 30);

  // Subsequent packet with 80 taps clamps from 30 to 60 (30 + 30)
  manager.recordDuelTap(hostMock.ws, 80);
  assert.strictEqual(room.duelState!.scores[host.id], 60);

  // Clean timer
  if (room.duelState?.timer) clearTimeout(room.duelState.timer);
});

test('recordDuelTap - rejects late taps sent after startTime + durationMs + 400ms (T-04-03)', async () => {
  const manager = new RoomManager();
  const hostMock = createMockSocket();
  const { room, host } = await manager.createRoom(hostMock.ws, 'Host');
  room.status = 'duel';
  manager.startDuel(hostMock.ws, 'online');

  // Simulate battle ended 500ms ago (past 400ms grace window)
  room.duelState!.startTime = Date.now() - (5000 + 500);
  room.duelState!.scores[host.id] = 20;

  // Attempt late tap packet
  manager.recordDuelTap(hostMock.ws, 25);
  // Score remains unchanged
  assert.strictEqual(room.duelState!.scores[host.id], 20);

  // Clean timer
  if (room.duelState?.timer) clearTimeout(room.duelState.timer);
});

test('concludeDuel - resolves winner based on higher tap count and broadcasts MATCH (DUEL-04)', async () => {
  const manager = new RoomManager();
  const hostMock = createMockSocket();
  const peerMock = createMockSocket();

  const { room, host } = await manager.createRoom(hostMock.ws, 'Host');
  manager.joinRoom(peerMock.ws, room.code, undefined, 'Peer');
  const peerId = Object.keys(room.participants).find((id) => id !== host.id)!;

  room.status = 'duel';
  manager.startDuel(hostMock.ws, 'online');

  // Host scored 45, Peer scored 30
  room.duelState!.scores[host.id] = 45;
  room.duelState!.scores[peerId] = 30;

  manager.concludeDuel(room.code);

  assert.strictEqual(room.status, 'matched');
  assert.ok(room.matchedVenue);
  assert.strictEqual(room.duelState!.status, 'finished');

  const matchMsg = hostMock.sentMessages.find((m) => m.type === 'MATCH');
  assert.ok(matchMsg);
  assert.strictEqual(matchMsg.duelResult.winnerId, host.id);
  assert.strictEqual(matchMsg.duelResult.scores[host.id], 45);
  assert.strictEqual(matchMsg.duelResult.scores[peerId], 30);
  assert.strictEqual(matchMsg.duelResult.tieBroken, undefined);
});

test('concludeDuel - breaks exact score ties via fair coin toss with tieBroken: true (DUEL-04)', async () => {
  const manager = new RoomManager();
  const hostMock = createMockSocket();
  const peerMock = createMockSocket();

  const { room, host } = await manager.createRoom(hostMock.ws, 'Host');
  manager.joinRoom(peerMock.ws, room.code, undefined, 'Peer');
  const peerId = Object.keys(room.participants).find((id) => id !== host.id)!;

  room.status = 'duel';
  manager.startDuel(hostMock.ws, 'online');

  // Exact tie
  room.duelState!.scores[host.id] = 40;
  room.duelState!.scores[peerId] = 40;

  manager.concludeDuel(room.code);

  assert.strictEqual(room.status, 'matched');
  assert.ok(room.matchedVenue);

  const matchMsg = hostMock.sentMessages.find((m) => m.type === 'MATCH');
  assert.ok(matchMsg);
  assert.strictEqual(matchMsg.duelResult.tieBroken, true);
  assert.ok([host.id, peerId].includes(matchMsg.duelResult.winnerId));
});

test('resolveDuelWinner - selects winner likes, falls back to peer likes, falls back to deck[0] (DUEL-04)', async () => {
  const manager = new RoomManager();
  const hostMock = createMockSocket();
  const peerMock = createMockSocket();

  const { room, host } = await manager.createRoom(hostMock.ws, 'Host');
  manager.joinRoom(peerMock.ws, room.code, undefined, 'Peer');
  const peerId = Object.keys(room.participants).find((id) => id !== host.id)!;

  assert.ok(room.venues && room.venues.length >= 3);
  const venue0 = room.venues[0];
  const venue1 = room.venues[1];
  const venue2 = room.venues[2];

  // 1. Winner (host) liked venue 1
  room.votes = {
    [host.id]: { [venue1.id]: 'like' },
    [peerId]: { [venue2.id]: 'like' },
  };
  const winnerVenue1 = manager.resolveDuelWinner(room.code, host.id);
  assert.strictEqual(winnerVenue1?.id, venue1.id);

  // 2. Winner (host) passed on all, fallback to peer likes
  room.votes = {
    [host.id]: { [venue0.id]: 'pass', [venue1.id]: 'pass' },
    [peerId]: { [venue2.id]: 'like' },
  };
  const winnerVenue2 = manager.resolveDuelWinner(room.code, host.id);
  assert.strictEqual(winnerVenue2?.id, venue2.id);

  // 3. Both passed on all / empty votes, fallback to top deck venue
  room.votes = {
    [host.id]: {},
    [peerId]: {},
  };
  const winnerVenue3 = manager.resolveDuelWinner(room.code, host.id);
  assert.strictEqual(winnerVenue3?.id, venue0.id);
});

test('handleDisconnect - cancels active duel timer when participant drops during duel (IN-03)', async () => {
  const manager = new RoomManager();
  const hostMock = createMockSocket();
  const peerMock = createMockSocket();

  const { room } = await manager.createRoom(hostMock.ws, 'Host');
  manager.joinRoom(peerMock.ws, room.code, undefined, 'Peer');

  room.status = 'duel';
  manager.startDuel(hostMock.ws, 'online');

  assert.ok(room.duelState?.timer, 'Duel timer should be active');

  // Peer drops connection during duel
  manager.handleDisconnect(peerMock.ws);

  assert.strictEqual(room.duelState?.timer, undefined, 'Duel timer should be cleared on disconnect');
});

test('leaveRoom - cancels active duel timer when participant leaves during duel (IN-03)', async () => {
  const manager = new RoomManager();
  const hostMock = createMockSocket();
  const peerMock = createMockSocket();

  const { room } = await manager.createRoom(hostMock.ws, 'Host');
  manager.joinRoom(peerMock.ws, room.code, undefined, 'Peer');

  room.status = 'duel';
  manager.startDuel(hostMock.ws, 'online');

  assert.ok(room.duelState?.timer, 'Duel timer should be active');

  // Peer explicitly leaves room
  manager.leaveRoom(peerMock.ws);

  assert.strictEqual(room.duelState?.timer, undefined, 'Duel timer should be cleared on leaveRoom');
  assert.strictEqual(room.status, 'waiting', 'Room should reset to waiting');
});
