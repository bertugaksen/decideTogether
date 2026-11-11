import { WebSocket } from 'ws';
import assert from 'node:assert';

async function runSwipeProbe() {
  console.log('--- Starting DecideTogether Swipe Deck & Match WebSocket Probe ---');

  const wsA = new WebSocket('ws://localhost:3001/ws');
  await new Promise((resolve, reject) => {
    wsA.on('open', resolve);
    wsA.on('error', reject);
  });
  console.log('✓ Host connected to WebSocket');

  // 1. Create Room
  wsA.send(JSON.stringify({ type: 'CREATE_ROOM', nickname: 'Probe Host' }));
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

  // 2. Peer Joins Room
  const wsB = new WebSocket('ws://localhost:3001/ws');
  await new Promise((resolve, reject) => {
    wsB.on('open', resolve);
    wsB.on('error', reject);
  });

  const peerJoined = new Promise((resolve) => {
    const handler = (data) => {
      const msg = JSON.parse(data.toString());
      if (msg.type === 'ROOM_JOINED') {
        wsB.off('message', handler);
        resolve(msg);
      }
    };
    wsB.on('message', handler);
  });

  wsB.send(JSON.stringify({ type: 'JOIN_ROOM', roomCode, nickname: 'Probe Peer' }));
  const joinedMsg = await peerJoined;
  const venues = joinedMsg.room.venues;
  assert.ok(venues && venues.length >= 10);
  console.log(`✓ Peer joined room with ${venues.length} venues`);

  // 3. Start Swiping
  const swipingStartedHost = new Promise((resolve) => {
    const handler = (data) => {
      const msg = JSON.parse(data.toString());
      if (msg.type === 'ROOM_STATE' && msg.room.status === 'swiping') {
        wsA.off('message', handler);
        resolve(msg);
      }
    };
    wsA.on('message', handler);
  });
  const swipingStartedPeer = new Promise((resolve) => {
    const handler = (data) => {
      const msg = JSON.parse(data.toString());
      if (msg.type === 'ROOM_STATE' && msg.room.status === 'swiping') {
        wsB.off('message', handler);
        resolve(msg);
      }
    };
    wsB.on('message', handler);
  });

  wsA.send(JSON.stringify({ type: 'START_SWIPING' }));
  await Promise.all([swipingStartedHost, swipingStartedPeer]);
  console.log('✓ Both clients received ROOM_STATE status="swiping"');

  // 4. Partner Progress Relay
  const partnerProgressPromise = new Promise((resolve) => {
    const handler = (data) => {
      const msg = JSON.parse(data.toString());
      if (msg.type === 'PARTNER_PROGRESS') {
        wsB.off('message', handler);
        resolve(msg);
      }
    };
    wsB.on('message', handler);
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
    const handler = (data) => {
      const msg = JSON.parse(data.toString());
      if (msg.type === 'MATCH') {
        wsA.off('message', handler);
        resolve(msg);
      }
    };
    wsA.on('message', handler);
  });
  const peerMatchPromise = new Promise((resolve) => {
    const handler = (data) => {
      const msg = JSON.parse(data.toString());
      if (msg.type === 'MATCH') {
        wsB.off('message', handler);
        resolve(msg);
      }
    };
    wsB.on('message', handler);
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
