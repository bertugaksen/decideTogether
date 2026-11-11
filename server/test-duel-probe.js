import { WebSocket } from 'ws';
import assert from 'node:assert';
import { spawn } from 'node:child_process';

let serverProc = null;

async function ensureServer() {
  try {
    const ws = new WebSocket('ws://localhost:3001/ws');
    await new Promise((resolve, reject) => {
      ws.on('open', () => {
        ws.close();
        resolve(true);
      });
      ws.on('error', reject);
    });
    console.log('✓ Connected to active backend server on ws://localhost:3001/ws');
    return;
  } catch {
    console.log('Backend not currently running on :3001. Spawning temporary test instance...');
    const isWindows = process.platform === 'win32';
    const npxCmd = isWindows ? 'npx.cmd' : 'npx';
    serverProc = spawn(npxCmd, ['tsx', 'src/index.ts'], {
      cwd: import.meta.dirname,
      stdio: 'pipe',
      shell: isWindows,
    });

    for (let i = 0; i < 30; i++) {
      await new Promise((r) => setTimeout(r, 300));
      try {
        const ws = new WebSocket('ws://localhost:3001/ws');
        const connected = await new Promise((resolve, reject) => {
          ws.on('open', () => {
            ws.close();
            resolve(true);
          });
          ws.on('error', reject);
        });
        if (connected) {
          console.log('✓ Temporary test server ready on ws://localhost:3001/ws');
          return;
        }
      } catch {
        // Retry next tick
      }
    }
    throw new Error('Timed out waiting for test server to start');
  }
}

async function runDuelProbe() {
  console.log('--- Starting DecideTogether Rapid Tapper Duel WebSocket Integration Probe ---');

  await ensureServer();

  const wsA = new WebSocket('ws://localhost:3001/ws');
  await new Promise((resolve, reject) => {
    wsA.on('open', resolve);
    wsA.on('error', reject);
  });
  console.log('✓ Host connected to WebSocket');

  // 1. Host creates room
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
  const hostId = roomCreated.user.id;
  console.log(`✓ Room created with PIN: ${roomCode}, Host ID: ${hostId}`);

  // 2. Peer connects and joins
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

  wsB.send(JSON.stringify({ type: 'JOIN_ROOM', roomCode, nickname: 'Duel Peer' }));
  const joinedMsg = await peerJoined;
  const peerId = joinedMsg.user.id;
  const venues = joinedMsg.room.venues;
  assert.ok(venues && venues.length >= 10);
  console.log(`✓ Peer joined room with ${venues.length} venues. Peer ID: ${peerId}`);

  // 3. Start Swiping
  const swipingStartedA = new Promise((resolve) => {
    const handler = (data) => {
      const msg = JSON.parse(data.toString());
      if (msg.type === 'ROOM_STATE' && msg.room.status === 'swiping') {
        wsA.off('message', handler);
        resolve(msg);
      }
    };
    wsA.on('message', handler);
  });
  const swipingStartedB = new Promise((resolve) => {
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
  await Promise.all([swipingStartedA, swipingStartedB]);
  console.log('✓ Both clients in swiping state');

  // 4. Exhaust deck without mutual like
  // Host likes venue 0 and passes remaining.
  // Peer passes venue 0, likes venue 1, and passes remaining.
  const deckExhaustedA = new Promise((resolve) => {
    const handler = (data) => {
      const msg = JSON.parse(data.toString());
      if (msg.type === 'DECK_EXHAUSTED') {
        wsA.off('message', handler);
        resolve(msg);
      }
    };
    wsA.on('message', handler);
  });
  const deckExhaustedB = new Promise((resolve) => {
    const handler = (data) => {
      const msg = JSON.parse(data.toString());
      if (msg.type === 'DECK_EXHAUSTED') {
        wsB.off('message', handler);
        resolve(msg);
      }
    };
    wsB.on('message', handler);
  });

  for (let i = 0; i < venues.length; i++) {
    const hostVote = i === 0 ? 'like' : 'pass';
    const peerVote = i === 1 ? 'like' : 'pass';

    wsA.send(JSON.stringify({
      type: 'SWIPE',
      venueId: venues[i].id,
      vote: hostVote,
      cardIndex: i,
      totalCards: venues.length,
    }));

    wsB.send(JSON.stringify({
      type: 'SWIPE',
      venueId: venues[i].id,
      vote: peerVote,
      cardIndex: i,
      totalCards: venues.length,
    }));
  }

  await Promise.all([deckExhaustedA, deckExhaustedB]);
  console.log('✓ Both clients received DECK_EXHAUSTED broadcast, room transitioning to duel');

  // 5. Host starts online duel
  const duelStartingA = new Promise((resolve) => {
    const handler = (data) => {
      const msg = JSON.parse(data.toString());
      if (msg.type === 'DUEL_STARTING') {
        wsA.off('message', handler);
        resolve(msg);
      }
    };
    wsA.on('message', handler);
  });
  const duelStartingB = new Promise((resolve) => {
    const handler = (data) => {
      const msg = JSON.parse(data.toString());
      if (msg.type === 'DUEL_STARTING') {
        wsB.off('message', handler);
        resolve(msg);
      }
    };
    wsB.on('message', handler);
  });

  wsA.send(JSON.stringify({ type: 'START_DUEL', mode: 'online' }));
  const [startMsgA, startMsgB] = await Promise.all([duelStartingA, duelStartingB]);
  assert.strictEqual(startMsgA.mode, 'online');
  assert.strictEqual(startMsgA.durationMs, 5000);
  assert.strictEqual(startMsgB.startTime, startMsgA.startTime);
  console.log(`✓ DUEL_STARTING received by both clients. Duration: ${startMsgA.durationMs}ms, Countdown: ~3000ms`);

  // 6. Wait for countdown (startTime)
  const waitMs = Math.max(0, startMsgA.startTime - Date.now()) + 50;
  console.log(`... Synchronizing countdown (${waitMs}ms) ...`);
  await new Promise((r) => setTimeout(r, waitMs));

  // 7. Send batched taps from both clients
  const duelProgressA = new Promise((resolve) => {
    const handler = (data) => {
      const msg = JSON.parse(data.toString());
      if (msg.type === 'DUEL_PROGRESS' && msg.scores[hostId] === 15 && msg.scores[peerId] === 10) {
        wsA.off('message', handler);
        resolve(msg);
      }
    };
    wsA.on('message', handler);
  });

  wsA.send(JSON.stringify({ type: 'DUEL_TAP', taps: 15 }));
  wsB.send(JSON.stringify({ type: 'DUEL_TAP', taps: 10 }));

  await duelProgressA;
  console.log('✓ DUEL_PROGRESS relayed with updated tallies: Host=15, Peer=10');

  // 8. Wait for authoritative server conclusion timer and MATCH broadcast
  console.log('... Awaiting authoritative duel timer buzzer (~5.3s) ...');
  const matchA = new Promise((resolve) => {
    const handler = (data) => {
      const msg = JSON.parse(data.toString());
      if (msg.type === 'MATCH') {
        wsA.off('message', handler);
        resolve(msg);
      }
    };
    wsA.on('message', handler);
  });
  const matchB = new Promise((resolve) => {
    const handler = (data) => {
      const msg = JSON.parse(data.toString());
      if (msg.type === 'MATCH') {
        wsB.off('message', handler);
        resolve(msg);
      }
    };
    wsB.on('message', handler);
  });

  const [matchMsgA, matchMsgB] = await Promise.all([matchA, matchB]);
  console.log('✓ MATCH received by both clients upon duel buzzer completion');

  // 9. Assertions on duel result and winner restaurant resolution
  assert.ok(matchMsgA.duelResult);
  assert.strictEqual(matchMsgA.duelResult.winnerId, hostId);
  assert.strictEqual(matchMsgA.duelResult.scores[hostId], 15);
  assert.strictEqual(matchMsgA.duelResult.scores[peerId], 10);
  assert.strictEqual(matchMsgA.venue.id, venues[0].id); // Winner (host) liked venue 0
  assert.strictEqual(matchMsgB.venue.id, venues[0].id);
  console.log(`✓ Winner accurately resolved as Host (${hostId}) with winning restaurant: "${matchMsgA.venue.name}"`);

  wsA.close();
  wsB.close();
  if (serverProc) {
    serverProc.kill();
  }
  console.log('🎉 ALL RAPID TAPPER DUEL PROBE INTEGRATION TESTS PASSED! 🎉');
  process.exit(0);
}

runDuelProbe().catch((err) => {
  console.error('Rapid Tapper Duel probe failed:', err);
  if (serverProc) {
    serverProc.kill();
  }
  process.exit(1);
});
