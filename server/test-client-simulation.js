import { WebSocket } from 'ws';

async function runClientSimulation() {
  console.log('--- Testing Plan 01-02 Client Logic & Session Resilience ---');

  // Simulated localStorage for Tab 1 and Tab 2
  const storageTab1 = new Map();
  const storageTab2 = new Map();

  // Tab 1 (Host)
  const ws1 = new WebSocket('ws://localhost:3001/ws');
  await new Promise((r) => ws1.on('open', r));

  ws1.send(JSON.stringify({ type: 'CREATE_ROOM' }));
  const roomCreated = await new Promise((r) => {
    ws1.on('message', (d) => {
      const msg = JSON.parse(d.toString());
      if (msg.type === 'ROOM_CREATED') r(msg);
    });
  });

  // Host saves to storage
  storageTab1.set('session', {
    roomCode: roomCreated.roomCode,
    userId: roomCreated.user.id,
    nickname: roomCreated.user.nickname,
    role: 'host',
  });
  console.log(`✓ Tab 1 (Host) saved session to localStorage: ${roomCreated.user.nickname}`);

  // Form WhatsApp share URL
  const shareUrl = `https://decidetogether.app/?room=${roomCreated.roomCode}`;
  console.log(`✓ Generated WhatsApp Share URL: ${shareUrl}`);

  // Tab 2 (Peer) opens the URL, parses ?room=...
  const parsedPin = new URL(shareUrl).searchParams.get('room');
  if (parsedPin !== roomCreated.roomCode) {
    throw new Error('URL parsing failed');
  }
  console.log(`✓ Tab 2 (Peer) parsed PIN from URL: ${parsedPin}`);

  // Tab 2 joins with parsed PIN
  const ws2 = new WebSocket('ws://localhost:3001/ws');
  await new Promise((r) => ws2.on('open', r));

  const tab1PeerJoined = new Promise((r) => {
    ws1.on('message', (d) => {
      const msg = JSON.parse(d.toString());
      if (msg.type === 'PEER_JOINED') r(msg);
    });
  });

  const tab2Joined = new Promise((r) => {
    ws2.on('message', (d) => {
      const msg = JSON.parse(d.toString());
      if (msg.type === 'ROOM_JOINED') r(msg);
    });
  });

  ws2.send(JSON.stringify({ type: 'JOIN_ROOM', roomCode: parsedPin }));
  const [hostNotice, peerState] = await Promise.all([tab1PeerJoined, tab2Joined]);

  // Peer saves to storage
  storageTab2.set('session', {
    roomCode: peerState.room.code,
    userId: peerState.user.id,
    nickname: peerState.user.nickname,
    role: 'peer',
  });
  console.log(`✓ Tab 2 (Peer) joined and saved session: ${peerState.user.nickname}`);

  // Tab 2 simulates page refresh (closes socket, reopens, sends JOIN_ROOM with userId)
  console.log('--- Simulating Browser Refresh on Tab 2 ---');
  const hostDisconnectNotice = new Promise((r) => {
    ws1.on('message', (d) => {
      const msg = JSON.parse(d.toString());
      if (msg.type === 'PEER_DISCONNECTED') r(msg);
    });
  });

  ws2.close();
  await hostDisconnectNotice;
  console.log('✓ Host received PEER_DISCONNECTED during page refresh');

  // Tab 2 reloads: reads from storageTab2 and connects
  const savedTab2 = storageTab2.get('session');
  const ws2Refreshed = new WebSocket('ws://localhost:3001/ws');
  await new Promise((r) => ws2Refreshed.on('open', r));

  const hostReconnectNotice = new Promise((r) => {
    ws1.on('message', (d) => {
      const msg = JSON.parse(d.toString());
      if (msg.type === 'PEER_RECONNECTED') r(msg);
    });
  });

  ws2Refreshed.send(
    JSON.stringify({
      type: 'JOIN_ROOM',
      roomCode: savedTab2.roomCode,
      userId: savedTab2.userId,
    })
  );

  await hostReconnectNotice;
  console.log('✓ Tab 2 restored session from localStorage and reconnected successfully!');

  ws1.close();
  ws2Refreshed.close();
  console.log('🎉 ALL PLAN 01-02 TESTS PASSED! 🎉');
  process.exit(0);
}

runClientSimulation().catch((err) => {
  console.error(err);
  process.exit(1);
});
