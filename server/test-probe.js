import { WebSocket } from 'ws';

async function runTest() {
  console.log('--- Starting DecideTogether WebSocket Test Probe ---');

  // Client A (Host)
  const wsA = new WebSocket('ws://localhost:3001/ws');

  let roomCode = '';
  let hostId = '';
  let peerId = '';

  await new Promise((resolve) => wsA.on('open', resolve));
  console.log('✓ Host connected to WebSocket');

  // Step 1: Create room
  wsA.send(JSON.stringify({ type: 'CREATE_ROOM' }));

  const roomCreated = await new Promise((resolve) => {
    wsA.on('message', (data) => {
      const msg = JSON.parse(data.toString());
      if (msg.type === 'ROOM_CREATED') {
        resolve(msg);
      }
    });
  });

  roomCode = roomCreated.roomCode;
  hostId = roomCreated.user.id;
  console.log(`✓ Room created with 4-digit PIN: ${roomCode}, Host: ${roomCreated.user.nickname} (${hostId})`);

  if (!/^\d{4}$/.test(roomCode)) {
    throw new Error(`PIN must be 4 digits, got: ${roomCode}`);
  }

  // Step 2: Client B (Peer) joins room
  const wsB = new WebSocket('ws://localhost:3001/ws');
  await new Promise((resolve) => wsB.on('open', resolve));
  console.log('✓ Peer connected to WebSocket');

  const peerJoinedPromiseHost = new Promise((resolve) => {
    wsA.on('message', (data) => {
      const msg = JSON.parse(data.toString());
      if (msg.type === 'PEER_JOINED') {
        resolve(msg);
      }
    });
  });

  const peerJoinedPromisePeer = new Promise((resolve) => {
    wsB.on('message', (data) => {
      const msg = JSON.parse(data.toString());
      if (msg.type === 'ROOM_JOINED') {
        resolve(msg);
      }
    });
  });

  wsB.send(JSON.stringify({ type: 'JOIN_ROOM', roomCode }));

  const [peerMsgForHost, peerMsgForPeer] = await Promise.all([
    peerJoinedPromiseHost,
    peerJoinedPromisePeer,
  ]);

  peerId = peerMsgForPeer.user.id;
  console.log(`✓ Peer joined successfully as: ${peerMsgForPeer.user.nickname} (${peerId})`);
  console.log(`✓ Host received PEER_JOINED: ${peerMsgForHost.participant.nickname}`);

  // Step 3: Peer disconnects and test 30s grace period notification
  const peerDisconnectPromise = new Promise((resolve) => {
    wsA.on('message', (data) => {
      const msg = JSON.parse(data.toString());
      if (msg.type === 'PEER_DISCONNECTED') {
        resolve(msg);
      }
    });
  });

  wsB.close();
  const disconnectMsg = await peerDisconnectPromise;
  console.log(`✓ Host received PEER_DISCONNECTED (grace period: ${disconnectMsg.reconnectDeadlineMs}ms)`);

  // Step 4: Peer reconnects with existing userId
  const wsB2 = new WebSocket('ws://localhost:3001/ws');
  await new Promise((resolve) => wsB2.on('open', resolve));

  const peerReconnectPromise = new Promise((resolve) => {
    wsA.on('message', (data) => {
      const msg = JSON.parse(data.toString());
      if (msg.type === 'PEER_RECONNECTED') {
        resolve(msg);
      }
    });
  });

  wsB2.send(JSON.stringify({ type: 'JOIN_ROOM', roomCode, userId: peerId }));
  await peerReconnectPromise;
  console.log(`✓ Peer reconnected successfully, Host received PEER_RECONNECTED`);

  wsA.close();
  wsB2.close();
  console.log('🎉 ALL BACKEND WEBSOCKET TESTS PASSED SUCCESSFULLY! 🎉');
  process.exit(0);
}

runTest().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
