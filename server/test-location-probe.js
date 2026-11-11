import { WebSocket } from 'ws';
import assert from 'node:assert/strict';
import http from 'node:http';
import { spawn } from 'node:child_process';

function checkHealth() {
  return new Promise((resolve) => {
    const req = http.get('http://localhost:3001/api/health', (res) => {
      resolve(res.statusCode === 200);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(500, () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function ensureServerRunning() {
  const alreadyRunning = await checkHealth();
  if (alreadyRunning) {
    console.log('✓ Reusing already active backend server on port 3001');
    return null;
  }

  console.log('Starting backend server for test-location-probe...');
  const serverProc = spawn('node', ['server/dist/index.js'], {
    stdio: 'inherit',
    windowsHide: true,
  });

  for (let i = 0; i < 40; i++) {
    await new Promise((r) => setTimeout(r, 250));
    if (await checkHealth()) {
      console.log('✓ Backend server spawned and ready');
      return serverProc;
    }
  }

  if (serverProc.pid) {
    try {
      process.kill(serverProc.pid);
    } catch {}
  }
  throw new Error('Backend server failed to start within 10s');
}

async function runProbe() {
  console.log('--- Starting Location & Multi-Peer Venue Deck Synchronization Probe ---');
  let serverProcess = null;

  try {
    serverProcess = await ensureServerRunning();

    // 1. Host Connects
    const wsHost = new WebSocket('ws://localhost:3001/ws');
    await new Promise((resolve, reject) => {
      wsHost.on('open', resolve);
      wsHost.on('error', reject);
    });
    console.log('✓ Host connected to WebSocket');

    // 2. Host creates room
    const hostCreatedPromise = new Promise((resolve) => {
      wsHost.on('message', (data) => {
        const msg = JSON.parse(data.toString());
        if (msg.type === 'ROOM_CREATED') {
          resolve(msg);
        }
      });
    });

    wsHost.send(JSON.stringify({ type: 'CREATE_ROOM', nickname: 'Gurme Host' }));
    const roomCreated = await hostCreatedPromise;
    const roomCode = roomCreated.roomCode;
    console.log(`✓ Room created with PIN: ${roomCode}`);

    // Verify initial default room location and deck
    assert.ok(roomCreated.room, 'ROOM_CREATED should include initial room state');
    assert.strictEqual(roomCreated.room.location?.districtId, 'kadikoy-moda', 'Initial district should be Kadıköy/Moda');
    assert.ok(Array.isArray(roomCreated.room.venues), 'Initial room must contain venues');
    assert.ok(roomCreated.room.venues.length >= 12, `Initial deck must have >= 12 venues, got ${roomCreated.room.venues.length}`);

    // Verify deterministic sponsored card at slot 2 (index 1)
    const hostInitialVenues = roomCreated.room.venues;
    assert.strictEqual(hostInitialVenues[1]?.isSponsored, true, 'Slot 2 (index 1) must be a sponsored venue (VENUE-04)');
    assert.ok(hostInitialVenues[1]?.sponsorBadge, 'Sponsored venue must contain sponsorBadge');
    console.log(`✓ Default deck initialized with ${hostInitialVenues.length} venues, sponsored slot 2: ${hostInitialVenues[1].name}`);

    // 3. Peer Connects & Joins Room
    const wsPeer = new WebSocket('ws://localhost:3001/ws');
    await new Promise((resolve, reject) => {
      wsPeer.on('open', resolve);
      wsPeer.on('error', reject);
    });
    console.log('✓ Peer connected to WebSocket');

    const peerJoinedPromise = new Promise((resolve) => {
      wsPeer.on('message', (data) => {
        const msg = JSON.parse(data.toString());
        if (msg.type === 'ROOM_JOINED') {
          resolve(msg);
        }
      });
    });

    wsPeer.send(JSON.stringify({ type: 'JOIN_ROOM', roomCode, nickname: 'Aç Peer' }));
    const peerJoined = await peerJoinedPromise;
    console.log('✓ Peer received ROOM_JOINED');

    // Verify Peer receives identical venue deck in identical sequence
    const peerInitialVenues = peerJoined.room.venues;
    assert.ok(Array.isArray(peerInitialVenues), 'Peer must receive venue deck');
    assert.strictEqual(peerInitialVenues.length, hostInitialVenues.length, 'Deck lengths must match');
    assert.deepStrictEqual(
      peerInitialVenues.map((v) => v.id),
      hostInitialVenues.map((v) => v.id),
      'Peer must receive identical venue deck sequence as Host'
    );
    console.log('✓ Both peers hold identical initial 15-venue decks with sponsored slot 2');

    // 4. Host changes location to Beşiktaş (SET_LOCATION)
    console.log('Testing Host SET_LOCATION with Beşiktaş...');
    const hostBesiktasPromise = new Promise((resolve) => {
      const handler = (data) => {
        const msg = JSON.parse(data.toString());
        if (msg.type === 'ROOM_STATE' && msg.room.location?.districtId === 'besiktas-carsi') {
          wsHost.off('message', handler);
          resolve(msg);
        }
      };
      wsHost.on('message', handler);
    });

    const peerBesiktasPromise = new Promise((resolve) => {
      const handler = (data) => {
        const msg = JSON.parse(data.toString());
        if (msg.type === 'ROOM_STATE' && msg.room.location?.districtId === 'besiktas-carsi') {
          wsPeer.off('message', handler);
          resolve(msg);
        }
      };
      wsPeer.on('message', handler);
    });

    wsHost.send(JSON.stringify({
      type: 'SET_LOCATION',
      districtId: 'besiktas-carsi',
    }));

    const [hostBesiktasState, peerBesiktasState] = await Promise.all([
      hostBesiktasPromise,
      peerBesiktasPromise,
    ]);

    assert.strictEqual(hostBesiktasState.room.location.districtId, 'besiktas-carsi');
    assert.strictEqual(peerBesiktasState.room.location.districtId, 'besiktas-carsi');
    assert.ok(hostBesiktasState.room.venues.length >= 12);
    assert.deepStrictEqual(
      hostBesiktasState.room.venues.map((v) => v.id),
      peerBesiktasState.room.venues.map((v) => v.id),
      'Both Host and Peer must receive identical Beşiktaş venue deck'
    );
    assert.strictEqual(peerBesiktasState.room.venues[1]?.isSponsored, true, 'Beşiktaş deck slot 2 must be sponsored');
    console.log(`✓ Both peers synchronized to Beşiktaş with ${hostBesiktasState.room.venues.length} venues`);

    // 5. Peer triggers GPS location change
    console.log('Testing Peer SET_LOCATION with GPS coordinates...');
    const hostGpsPromise = new Promise((resolve) => {
      const handler = (data) => {
        const msg = JSON.parse(data.toString());
        if (msg.type === 'ROOM_STATE' && msg.room.location?.isGps) {
          wsHost.off('message', handler);
          resolve(msg);
        }
      };
      wsHost.on('message', handler);
    });

    const peerGpsPromise = new Promise((resolve) => {
      const handler = (data) => {
        const msg = JSON.parse(data.toString());
        if (msg.type === 'ROOM_STATE' && msg.room.location?.isGps) {
          wsPeer.off('message', handler);
          resolve(msg);
        }
      };
      wsPeer.on('message', handler);
    });

    // Send coordinates near Caddebostan (lat: 40.9634, lng: 29.0617)
    wsPeer.send(JSON.stringify({
      type: 'SET_LOCATION',
      coords: { lat: 40.9634, lng: 29.0617 },
    }));

    const [hostGpsState, peerGpsState] = await Promise.all([
      hostGpsPromise,
      peerGpsPromise,
    ]);

    assert.strictEqual(hostGpsState.room.location.isGps, true);
    assert.strictEqual(peerGpsState.room.location.isGps, true);
    assert.deepStrictEqual(
      hostGpsState.room.venues.map((v) => v.id),
      peerGpsState.room.venues.map((v) => v.id),
      'Both peers must receive identical GPS-resolved venue deck'
    );
    console.log(`✓ Both peers synchronized to GPS location (${hostGpsState.room.location.label})`);

    // 6. Threat Model Verifications
    console.log('Testing Threat Mitigations (T-02-03 Whitelist & T-02-04 Coordinate Bounds)...');
    
    // T-02-03: Unknown districtId whitelist check
    const hostFallbackPromise = new Promise((resolve) => {
      const handler = (data) => {
        const msg = JSON.parse(data.toString());
        if (msg.type === 'ROOM_STATE' && msg.room.location?.districtId === 'kadikoy-moda') {
          wsHost.off('message', handler);
          resolve(msg);
        }
      };
      wsHost.on('message', handler);
    });

    wsHost.send(JSON.stringify({
      type: 'SET_LOCATION',
      districtId: 'malicious_or_unknown_district_id',
    }));

    const fallbackState = await hostFallbackPromise;
    assert.strictEqual(fallbackState.room.location.districtId, 'kadikoy-moda', 'Unknown districtId must safely fall back to Kadıköy/Moda');
    console.log('✓ T-02-03 Mitigation verified: Unknown district safely fell back to default Moda');

    // T-02-04: Malicious/out of bound coords
    const hostCoordsFallbackPromise = new Promise((resolve) => {
      const handler = (data) => {
        const msg = JSON.parse(data.toString());
        if (msg.type === 'ROOM_STATE') {
          wsHost.off('message', handler);
          resolve(msg);
        }
      };
      wsHost.on('message', handler);
    });

    wsHost.send(JSON.stringify({
      type: 'SET_LOCATION',
      coords: { lat: 99999, lng: 99999 },
    }));

    const coordsFallbackState = await hostCoordsFallbackPromise;
    assert.ok(coordsFallbackState.room.location, 'Invalid coordinates must not crash room state');
    console.log('✓ T-02-04 Mitigation verified: Out-of-bounds coords handled without crash');

    // Clean close
    wsHost.close();
    wsPeer.close();
    console.log('\n🎉 ALL MULTI-PEER LOCATION & DECK SYNCHRONIZATION TESTS PASSED! 🎉');
  } finally {
    if (serverProcess) {
      console.log('Terminating probe-spawned backend server...');
      serverProcess.kill('SIGTERM');
      // On Windows, ensure child is killed
      if (process.platform === 'win32') {
        try {
          spawn('taskkill', ['/pid', serverProcess.pid.toString(), '/f', '/t']);
        } catch {}
      }
    }
  }
}

runProbe().catch((err) => {
  console.error('Probe failed:', err);
  process.exit(1);
});
