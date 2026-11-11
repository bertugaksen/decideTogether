import test from 'node:test';
import assert from 'node:assert/strict';
import { RoomManager } from '../roomManager.js';
import { WebSocket } from 'ws';
import { Room, Venue } from '../types.js';

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
  assert.ok(room.votes);
  assert.ok(room.progress);

  const stateMsg = hostMock.sentMessages.find((m) => m.type === 'ROOM_STATE');
  assert.ok(stateMsg);
  assert.strictEqual(stateMsg.room.status, 'swiping');
});

test('startSwiping - rejects swiping when only 1 participant is connected', async () => {
  const manager = new RoomManager();
  const hostMock = createMockSocket();

  const { room } = await manager.createRoom(hostMock.ws, 'Host User');
  assert.strictEqual(room.status, 'waiting');

  const started = manager.startSwiping(hostMock.ws);
  assert.strictEqual(started, false);
  assert.strictEqual(room.status, 'waiting');

  const errorMsg = hostMock.sentMessages.find((m) => m.type === 'ERROR');
  assert.ok(errorMsg);
  assert.match(errorMsg.message, /partnerinizin odaya katılması/);
});

test('recordSwipe - detects mutual like and broadcasts MATCH immediately (<100ms)', async () => {
  const manager = new RoomManager();
  const hostMock = createMockSocket();
  const peerMock = createMockSocket();

  const { room } = await manager.createRoom(hostMock.ws, 'Host User');
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

  const peerMatchMsg = peerMock.sentMessages.find((m) => m.type === 'MATCH');
  assert.ok(peerMatchMsg);
  assert.strictEqual(peerMatchMsg.venue.id, testVenue.id);
});

test('recordSwipe - different votes do not trigger match', async () => {
  const manager = new RoomManager();
  const hostMock = createMockSocket();
  const peerMock = createMockSocket();

  const { room } = await manager.createRoom(hostMock.ws, 'Host');
  manager.joinRoom(peerMock.ws, room.code, undefined, 'Peer');
  manager.startSwiping(hostMock.ws);

  const testVenue = room.venues![0];
  const total = room.venues!.length;

  manager.recordSwipe(hostMock.ws, testVenue.id, 'like', 0, total);
  const res = manager.recordSwipe(peerMock.ws, testVenue.id, 'pass', 0, total);

  assert.strictEqual(res.matchedVenue, undefined);
  assert.strictEqual(room.status, 'swiping');
});

test('recordSwipe - relays partner progress to peer without disclosing vote (T-03-05)', async () => {
  const manager = new RoomManager();
  const hostMock = createMockSocket();
  const peerMock = createMockSocket();

  const { room, host } = await manager.createRoom(hostMock.ws, 'Host');
  manager.joinRoom(peerMock.ws, room.code, undefined, 'Peer');
  manager.startSwiping(hostMock.ws);

  const testVenue = room.venues![0];
  const total = room.venues!.length;

  manager.recordSwipe(hostMock.ws, testVenue.id, 'like', 0, total);

  // Peer should have received PARTNER_PROGRESS
  const progressMsg = peerMock.sentMessages.find((m) => m.type === 'PARTNER_PROGRESS');
  assert.ok(progressMsg);
  assert.strictEqual(progressMsg.userId, host.id);
  assert.strictEqual(progressMsg.cardIndex, 1);
  assert.strictEqual(progressMsg.totalCards, total);
  assert.strictEqual((progressMsg as any).vote, undefined); // No vote leakage

  // Host should NOT have received their own progress
  const hostProgressMsg = hostMock.sentMessages.find((m) => m.type === 'PARTNER_PROGRESS');
  assert.strictEqual(hostProgressMsg, undefined);
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

  // Peer swipes pass on all except last card
  for (let i = 0; i < total - 1; i++) {
    manager.recordSwipe(peerMock.ws, venues[i].id, 'pass', i, total);
  }

  // Before peer swipes last card, still swiping
  assert.strictEqual(room.status, 'swiping');

  // Peer swipes last card
  const finalRes = manager.recordSwipe(peerMock.ws, venues[total - 1].id, 'pass', total - 1, total);
  assert.strictEqual(finalRes.deckExhausted, true);
  assert.strictEqual(room.status, 'duel');

  const deckExhaustedMsg = hostMock.sentMessages.find((m) => m.type === 'DECK_EXHAUSTED');
  assert.ok(deckExhaustedMsg);
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

test('recordSwipe - ignores votes for unknown venue IDs (T-03-03)', async () => {
  const manager = new RoomManager();
  const hostMock = createMockSocket();
  const peerMock = createMockSocket();

  const { room } = await manager.createRoom(hostMock.ws, 'Host');
  manager.joinRoom(peerMock.ws, room.code, undefined, 'Peer');
  manager.startSwiping(hostMock.ws);

  const res = manager.recordSwipe(hostMock.ws, 'unknown_venue_9999', 'like', 0, 15);
  assert.deepStrictEqual(res, {});
  assert.strictEqual(room.votes?.[room.hostId]?.['unknown_venue_9999'], undefined);
});
