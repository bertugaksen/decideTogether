import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { Room } from '../types.js';
import { MemoryRoomRepository } from '../repositories/memoryRoomRepository.js';
import { SqliteRoomRepository } from '../repositories/sqliteRoomRepository.js';

function createSampleRoom(code: string, hostId: string = 'host_1'): Room {
  return {
    code,
    hostId,
    status: 'waiting',
    participants: {
      [hostId]: {
        id: hostId,
        nickname: 'Aç Panda',
        role: 'host',
        connected: true,
      },
    },
    createdAt: Date.now(),
    lastActiveAt: Date.now(),
    location: {
      districtId: 'kadikoy',
      label: 'Kadıköy, İstanbul',
      coords: { lat: 40.9901, lng: 29.0234 },
    },
    venues: [
      {
        id: 'venue_1',
        name: "Çiya Sofrası 'Güneş' & Bahçe;",
        category: 'Türk & Anadolu',
        rating: 4.6,
        reviewCount: 320,
        priceLevel: 2,
        address: 'Güneşlibahçe Sok. No:43, Kadıköy',
        location: { lat: 40.9901, lng: 29.0234 },
        photoUrl: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4',
        photos: [],
      },
    ],
  };
}

test('MemoryRoomRepository - CRUD lifecycle and listActive', () => {
  const repo = new MemoryRoomRepository();

  assert.equal(repo.get('1234'), null);

  const room = createSampleRoom('1234');
  repo.save(room);

  const retrieved = repo.get('1234');
  assert.ok(retrieved);
  assert.equal(retrieved.code, '1234');
  assert.equal(retrieved.hostId, 'host_1');
  assert.equal(retrieved.venues?.length, 1);

  const activeRooms = repo.listActive();
  assert.equal(activeRooms.length, 1);
  assert.equal(activeRooms[0].code, '1234');

  repo.delete('1234');
  assert.equal(repo.get('1234'), null);
  assert.equal(repo.listActive().length, 0);
});

test('MemoryRoomRepository - cleanupExpired removes old entries', () => {
  const repo = new MemoryRoomRepository();
  const room1 = createSampleRoom('1001');
  const room2 = createSampleRoom('1002');

  repo.save(room1);
  repo.save(room2);

  // maxAgeMs = 0 means cleanup will remove everything saved before threshold
  // With 10ms delay, threshold = Date.now() - 5ms will delete them
  const cleanedImmediate = repo.cleanupExpired(1000 * 60); // 1 minute in future: none expired
  assert.equal(cleanedImmediate, 0);
  assert.equal(repo.listActive().length, 2);

  const cleanedAll = repo.cleanupExpired(-1000); // negative age forces threshold > now
  assert.equal(cleanedAll, 2);
  assert.equal(repo.listActive().length, 0);
});

test('SqliteRoomRepository - in-memory CRUD and parameterized safety (T-08-01)', () => {
  const repo = new SqliteRoomRepository(':memory:');

  assert.equal(repo.get('9999'), null);

  // Test special characters in venue names to verify SQL parameterization safety
  const room = createSampleRoom('9999');
  repo.save(room);

  const retrieved = repo.get('9999');
  assert.ok(retrieved);
  assert.equal(retrieved.code, '9999');
  assert.equal(retrieved.venues?.[0]?.name, "Çiya Sofrası 'Güneş' & Bahçe;");

  const active = repo.listActive();
  assert.equal(active.length, 1);
  assert.equal(active[0]?.code, '9999');

  repo.delete('9999');
  assert.equal(repo.get('9999'), null);
  assert.equal(repo.listActive().length, 0);

  repo.close();
});

test('SqliteRoomRepository - persistent storage across instances and server reboot recovery', () => {
  const tempDbPath = path.join(os.tmpdir(), `test_decidetogether_${Date.now()}_${Math.random().toString(36).substring(2)}.db`);

  try {
    // 1. First server instance writes room to disk
    const instance1 = new SqliteRoomRepository(tempDbPath);
    const room = createSampleRoom('7777', 'host_survivor');
    room.status = 'swiping';
    instance1.save(room);
    instance1.close();

    // 2. Second server instance boots up reading the same file
    const instance2 = new SqliteRoomRepository(tempDbPath);
    const loaded = instance2.get('7777');

    assert.ok(loaded, 'Room must survive server reboot across repository instances');
    assert.equal(loaded.code, '7777');
    assert.equal(loaded.hostId, 'host_survivor');
    assert.equal(loaded.status, 'swiping');
    assert.equal(loaded.venues?.length, 1);

    // 3. Update room in instance 2
    loaded.status = 'matched';
    instance2.save(loaded);

    const reloaded = instance2.get('7777');
    assert.equal(reloaded?.status, 'matched');

    instance2.close();
  } finally {
    if (fs.existsSync(tempDbPath)) {
      try {
        fs.unlinkSync(tempDbPath);
      } catch {
        // cleanup best effort
      }
    }
  }
});

test('SqliteRoomRepository - cleanupExpired TTL removes abandoned rooms (T-08-02)', () => {
  const repo = new SqliteRoomRepository(':memory:');
  const r1 = createSampleRoom('5001');
  const r2 = createSampleRoom('5002');

  repo.save(r1);
  repo.save(r2);

  // maxAgeMs = 3600000 (1 hour): nothing expired yet
  const cleanedNone = repo.cleanupExpired(3600000);
  assert.equal(cleanedNone, 0);
  assert.equal(repo.listActive().length, 2);

  // negative maxAge ensures threshold is in the future, deleting all
  const cleanedAll = repo.cleanupExpired(-1000);
  assert.equal(cleanedAll, 2);
  assert.equal(repo.listActive().length, 0);

  repo.close();
});

test('RoomManager - accepts injected IRoomRepository and runs expired room cleanup (ENG-01, T-08-02)', async () => {
  const memoryRepo = new MemoryRoomRepository();
  const { RoomManager } = await import('../roomManager.js');
  const { WebSocket } = await import('ws');

  const manager = new RoomManager(memoryRepo);
  const mockWs = {
    readyState: WebSocket.OPEN,
    send: () => {},
  } as unknown as import('ws').WebSocket;

  const { room } = await manager.createRoom(mockWs, 'Injected Host');
  assert.ok(room.code);
  assert.equal(manager.getActiveRoomCount(), 1);

  // Assert room was written directly into the injected memory repository
  const storedInRepo = memoryRepo.get(room.code);
  assert.ok(storedInRepo);
  assert.equal(storedInRepo.code, room.code);

  // Run cleanupExpiredRooms with negative maxAge to force TTL expiration
  const cleanedCount = manager.cleanupExpiredRooms(-1000);
  assert.equal(cleanedCount, 1);
  assert.equal(manager.getActiveRoomCount(), 0);
  assert.equal(memoryRepo.get(room.code), null);

  manager.destroy();
});

