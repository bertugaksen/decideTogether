---
last_mapped_commit: c7f5562b7ba1bdd5b70cffe2de3f22fc3030914f
last_mapped_at: 2026-11-12
---
</Coding Conventions>
<Testing Patterns>
**Analysis Date:** 2026-11-12

## Test Framework

**Runner:**
- Node.js built-in test runner (`node:test`)
- TypeScript execution engine: `tsx` (^4.19.2) on Node.js (>= 22.5.0)
- Config: `server/package.json` (`"test": "tsx --test src/tests/*.test.ts"`)

**Assertion Library:**
- Node.js built-in strict assertions (`node:assert/strict`)

**Run Commands:**
```bash
npm run test --workspace=server        # Run all server test suites
npx tsx --test src/tests/*.test.ts      # Direct tsx test run from server/ directory
npx tsx --test --watch src/tests/*.test.ts # Watch mode
node --test --experimental-test-coverage src/tests/*.test.ts # Built-in code coverage
npx tsx --test src/tests/duel.test.ts  # Run a single test file
```

## Test File Organization

**Location:**
- Server: Centralized separate directory in `server/src/tests/`.
- Client: Currently no automated test runner configured in `client/` workspace.
- Shared: Shared contracts and utility functions are verified indirectly through `server/src/tests/`.
- Integration/Live Probes: Standalone node scripts located in `server/` root.

**Naming:**
- Unit & Integration test suites: `[feature].test.ts` (e.g. `duel.test.ts`, `swipeDeck.test.ts`, `roomRepository.test.ts`).
- Ad-hoc integration probe scripts: `test-[scenario]-probe.js` (e.g. `test-probe.js`, `test-duel-probe.js`, `test-swipe-probe.js`).

**Structure:**
```
server/
├── src/
│   ├── tests/
│   │   ├── duel.test.ts              # Rapid Tapper tie-breaker duel mechanics & scoring
│   │   ├── postMatchActions.test.ts  # Turn-by-turn navigation, delivery links, phone sanitization
│   │   ├── roomRepository.test.ts    # Memory and SQLite repository CRUD & TTL expiration
│   │   ├── sponsoredInsertion.test.ts# Organic deck verification (zero fake sponsor injection)
│   │   ├── swipeDeck.test.ts         # Room lifecycle, 2-player join, mutual match detection
│   │   ├── venueCache.test.ts        # Geohash snap grid (500m) & LRU eviction
│   │   └── venueService.test.ts      # Coordinate validation, district fallback, deck balancing
│   ├── repositories/
│   ├── services/
│   ├── roomManager.ts
│   └── index.ts
├── test-client-simulation.js         # Concurrent multi-client WebSocket simulator
├── test-duel-probe.js                # Live WebSocket duel tapping probe
├── test-location-probe.js            # Live GPS district resolution probe
├── test-probe.js                     # End-to-end room creation & match probe
└── test-swipe-probe.js               # Real-time swipe progression probe
```

## Test Structure

**Suite Organization:**
Tests use top-level `test()` blocks with descriptive titles annotated with requirement IDs:
```typescript
import test from 'node:test';
import assert from 'node:assert/strict';
import { RoomManager } from '../roomManager.js';
import { WebSocket } from 'ws';

test('startDuel - transitions room into countdown, sets startTime ~3000ms ahead, initializes scores to 0, broadcasts DUEL_STARTING (DUEL-01)', async () => {
  const manager = new RoomManager();
  const hostMock = createMockSocket();
  const peerMock = createMockSocket();

  const { room, host } = await manager.createRoom(hostMock.ws, 'Host');
  manager.joinRoom(peerMock.ws, room.code, undefined, 'Peer');
  const peerId = Object.keys(room.participants).find((id) => id !== host.id)!;

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

  // Assert both host and peer received DUEL_STARTING broadcast
  const hostMsg = hostMock.sentMessages.find((m) => m.type === 'DUEL_STARTING');
  assert.ok(hostMsg);
  assert.strictEqual(hostMsg.durationMs, 5000);
  assert.strictEqual(hostMsg.mode, 'online');

  // Teardown: Clean up background timers to prevent hanging test process
  if (room.duelState.timer) {
    clearTimeout(room.duelState.timer);
  }
});
```

**Patterns:**
- **Setup Pattern:**
  - Instantiate a clean instance of `RoomManager` or repository per test to avoid state pollution.
  - Use in-memory SQLite (`new SqliteRoomRepository(':memory:')`) or `MemoryRoomRepository` for deterministic database tests.
  - Create virtual sockets via `createMockSocket()`.
- **Teardown Pattern:**
  - Clear any active `NodeJS.Timeout` instances (`room.duelState.timer`, `cleanupInterval`) to allow `node:test` to terminate cleanly:
    ```typescript
    if (room.duelState?.timer) {
      clearTimeout(room.duelState.timer);
    }
    ```
  - For tests creating disk-based SQLite files, remove temporary test database files in cleanup blocks using `fs.unlinkSync()`.
- **Assertion Pattern:**
  - Use strict assertion functions: `assert.strictEqual()` for primitives, `assert.ok()` for truthiness and range bounds, `assert.notStrictEqual()` for inequality, and `assert.match()` for regex checks.

## Mocking

**Framework:**
- Zero third-party mocking libraries (no Jest, Vitest, Sinon, or proxyquire).
- Custom, lightweight mock factories implemented with TypeScript object literals and typed casts.

**Patterns:**
Mocking WebSocket connections:
```typescript
// Pattern from server/src/tests/duel.test.ts and server/src/tests/swipeDeck.test.ts
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

Mocking Google Places API (Offline fallback mode):
```typescript
// Pattern from server/src/tests/venueService.test.ts
// Passing undefined as API key activates offline mock district repository
const service = new VenueService(undefined);
const deck = await service.getVenuesForDistrict('kadikoy-moda');
assert.strictEqual(deck.length, 15);
```

**What to Mock:**
- **Network Transport:** `WebSocket` client sockets using `createMockSocket()`.
- **External Web APIs:** Google Places API via offline mock mode (`new VenueService(undefined)`).
- **Time/Intervals:** Pass dynamic offsets or manual timers when testing time-dependent actions.

**What NOT to Mock:**
- **Room State & Business Logic:** Never mock `RoomManager`, `duelEngine`, or `VenueCache`; test the real domain objects.
- **Data Persistence:** Do not mock `DatabaseSync`; test SQLite persistence using in-memory databases (`:memory:`).
- **Node.js Core Modules:** Use genuine Node `node:fs`, `node:path`, `node:os`, `node:sqlite`.

## Fixtures and Factories

**Test Data:**
Sample room factory for repository and state validation:
```typescript
// Pattern from server/src/tests/roomRepository.test.ts
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
      },
    ],
  };
}
```

**Location:**
- Shared static mock fixtures: `server/src/services/mockVenues.ts` (`MOCK_DISTRICTS`, `MOCK_VENUES`).
- Dynamic test factories: Co-located directly in the relevant test files (`server/src/tests/roomRepository.test.ts`, `server/src/tests/duel.test.ts`).

## Coverage

**Requirements:**
- No strict minimum coverage threshold enforced in CI pipelines.
- 100% of core backend domains (room management, swiping, duel engine, repository persistence, caching, and venue formatting) are covered across 7 test suites comprising ~1,018 test lines.

**View Coverage:**
```bash
node --test --experimental-test-coverage src/tests/*.test.ts
```

## Test Types

**Unit Tests:**
- Validate standalone algorithms and utilities:
  - Coordinate range boundary verification (`isValidCoordinate` in `server/src/tests/venueService.test.ts`).
  - Haversine distance formula calculation (`calculateDistanceKm` in `server/src/tests/postMatchActions.test.ts`).
  - Navigation URL generation with Google Maps Place IDs (`buildGoogleMapsNavigationUrl` in `server/src/tests/postMatchActions.test.ts`).
  - Phone sanitization and safety rejection (`sanitizePhoneUri` in `server/src/tests/postMatchActions.test.ts`).
  - 500m grid coordinate snapping and cache key resolution (`getCoordinateCacheKey` in `server/src/tests/venueCache.test.ts`).

**Integration Tests:**
- Validate multi-component interactions and state machines:
  - `RoomManager` + `IRoomRepository`: Two-client room join, mutual like detection, match broadcast (`server/src/tests/swipeDeck.test.ts`).
  - `SqliteRoomRepository`: Table initialization, schema migration, parameterized statement safety, and WAL mode (`server/src/tests/roomRepository.test.ts`).
  - `VenueService` + `VenueCache`: In-memory caching, offline district fallback, and 15-item deck diversity balancing (`server/src/tests/venueService.test.ts`).
  - `duelEngine`: Rapid Tapper countdown, real-time tap throttling, rate limit clamping, and coin-toss tie-breaker resolution (`server/src/tests/duel.test.ts`).

**E2E Tests:**
- Ad-hoc Node.js probe scripts test live running servers:
  - `server/test-probe.js`: Connects two real WebSocket clients to `ws://localhost:3001/ws`, executes room creation, peer join, and verifies PIN exchange.
  - `server/test-client-simulation.js`: Simulates concurrent multi-room traffic.
  - Browser-level UI automated E2E testing (Playwright or Cypress) is not currently installed.

## Common Patterns

**Async Testing:**
Always declare test functions as `async` when dealing with promises, repositories, or services:
```typescript
test('recordSwipe - detects mutual like and broadcasts MATCH immediately (<100ms)', async () => {
  const manager = new RoomManager();
  const hostMock = createMockSocket();
  const peerMock = createMockSocket();

  const { room } = await manager.createRoom(hostMock.ws, 'Host User');
  manager.joinRoom(peerMock.ws, room.code, undefined, 'Peer User');
  manager.startSwiping(hostMock.ws);

  const testVenue = room.venues![0];
  const total = room.venues!.length;

  manager.recordSwipe(hostMock.ws, testVenue.id, 'like', 0, total);
  const res = manager.recordSwipe(peerMock.ws, testVenue.id, 'like', 0, total);

  assert.ok(res.matchedVenue);
  assert.strictEqual(res.matchedVenue.id, testVenue.id);
  assert.strictEqual(room.status, 'matched');
});
```

**Error Testing:**
Assert rejection of invalid actions, unauthorized sockets, and malformed inputs:
```typescript
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
```

---

*Testing analysis: 2026-11-12*
