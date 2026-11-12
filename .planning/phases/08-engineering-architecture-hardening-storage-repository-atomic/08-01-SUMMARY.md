---
phase: 08-engineering-architecture-hardening-storage-repository-atomic
plan: 01
subsystem: storage-persistence
tags: [repository-pattern, sqlite, logging, health-check]
requires:
  - phase: 01-room-and-real-time-connection
    provides: RoomManager and WebSocket room lifecycle
provides:
  - IRoomRepository contract with Memory and SQLite implementations
  - Zero-data-loss SQLite room persistence across server reboots
  - Periodic 24h TTL cleanup of abandoned rooms
  - Structured logger with timestamped severity levels
  - Production /health endpoint for monitoring probes
affects:
  - server/src/roomManager.ts
  - server/src/index.ts
tech-stack:
  added:
    - node:sqlite (native Node.js v22+ DatabaseSync)
  patterns:
    - Repository Pattern
    - In-Memory Cache with Synchronous WAL SQLite Persistence
    - Structured Logging
key-files:
  created:
    - server/src/repositories/roomRepository.ts
    - server/src/repositories/memoryRoomRepository.ts
    - server/src/repositories/sqliteRoomRepository.ts
    - server/src/logger.ts
    - server/src/tests/roomRepository.test.ts
  modified:
    - server/src/roomManager.ts
    - server/src/index.ts
    - .gitignore
decisions:
  - "Use native node:sqlite DatabaseSync instead of better-sqlite3 to maintain zero external C++ build dependencies"
  - "Maintain in-memory cache in SqliteRoomRepository alongside synchronous WAL persistence for sub-millisecond WebSocket response times and object reference stability"
  - "Configure PRAGMA busy_timeout = 5000 and PRAGMA journal_mode = WAL for robust concurrent access under parallel test execution"
  - "Add 24-hour TTL periodic cleanup (every 30 mins) with timer.unref() to prevent database growth from abandoned rooms"
metrics:
  duration: 8m
  completed_date: "2026-11-12"
status: complete
actuals:
  tokens: 42000
  tasks: 3
  commits: 3
plan_head_before: 475caff
plan_head_after: 3f891f8
---

# Phase 08 Plan 01: Storage Repository, Native SQLite Persistence, Structured Logging & Health Check Summary

Decoupled in-memory room management from persistence via `IRoomRepository`, added zero-external-dependency SQLite storage using native `node:sqlite`, introduced structured logging, and added a production monitoring `/health` endpoint.

## Key Accomplishments

1. **IRoomRepository & Dual Implementations**:
   - `IRoomRepository` interface: `get`, `save`, `delete`, `listActive`, `cleanupExpired`.
   - `MemoryRoomRepository`: RAM-backed map for fast unit tests without disk I/O.
   - `SqliteRoomRepository`: Native `DatabaseSync` (`node:sqlite`) with `WAL` journal mode and parameterized queries (`T-08-01`) persisting rooms into `./decidetogether.db`.

2. **Injected Dependency in RoomManager**:
   - `RoomManager` refactored to accept `IRoomRepository` in constructor (defaulting to `SqliteRoomRepository`).
   - Ephemeral WebSocket handles (`clients`) remain safely in memory while room business state is stored in repository.
   - 24-hour TTL expired room cleanup scheduled every 30 minutes with `unref()` (`T-08-02`).

3. **Structured Logger & Production Health Monitoring**:
   - `logger.ts` outputs standardized ISO timestamps, severity levels (`[INFO]`, `[WARN]`, `[ERROR]`), and JSON metadata.
   - Replaced raw `console.log` and `console.error` in `server/src/index.ts`.
   - Mounted `GET /health` and `GET /api/health` returning JSON telemetry (`status`, `uptime`, `activeRooms`, `storage`, `timestamp`) with zero sensitive data disclosure (`T-08-03`).

4. **100% Test Passing with Zero Regressions**:
   - All 37 existing tests continue to pass without regression.
   - Added 7 new test suites verifying CRUD lifecycle, reboot recovery across instances, TTL cleanup, dependency injection, and structured logger formatting (44/44 tests passing).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Circular reference handling for duel timers in SQLite serialization**
- **Found during:** Task 2 implementation
- **Issue:** Room objects containing active NodeJS.Timeout in `duelState.timer` throw `Converting circular structure to JSON` when serialized to SQLite.
- **Fix:** Added a custom JSON serializer replacer in `SqliteRoomRepository.save` that cleanly omits circular timer handles during persistence while preserving active duel state.
- **Files modified:** `server/src/repositories/sqliteRoomRepository.ts`
- **Commit:** `769458b`

**2. [Rule 1 - Bug] Concurrency lock and reference identity in parallel test runners**
- **Found during:** Task 2 execution
- **Issue:** `tsx --test` runs multiple test files in parallel, causing SQLite `database is locked` errors and object reference mismatches in existing tests that modify returned room references directly.
- **Fix:** Configured `PRAGMA busy_timeout = 5000` and `PRAGMA journal_mode = WAL`, and added an active in-memory cache layer inside `SqliteRoomRepository` ensuring instant O(1) object reference identity and zero-lock concurrent queries.
- **Files modified:** `server/src/repositories/sqliteRoomRepository.ts`
- **Commit:** `769458b`

## Verification Evidence

- `npm.cmd run test --workspace=server`: 44/44 tests passing in 808ms.
- `npm.cmd run build --workspace=client`: compiles cleanly with Vite in 5.93s.
- `npm.cmd run build --workspace=server`: compiles cleanly with `tsc`.

## Self-Check: PASSED
- FOUND: `server/src/repositories/roomRepository.ts`
- FOUND: `server/src/repositories/memoryRoomRepository.ts`
- FOUND: `server/src/repositories/sqliteRoomRepository.ts`
- FOUND: `server/src/logger.ts`
- FOUND: `server/src/tests/roomRepository.test.ts`
- FOUND commit `53f7a4d`
- FOUND commit `769458b`
- FOUND commit `3f891f8`
