# Phase 08: Engineering Architecture Hardening — Research

**Researched:** 2026-11-12  
**Domain:** Software Engineering Architecture, Storage Repository Pattern, SQLite, Component Decomposition, CI/CD  
**Confidence:** HIGH  

---

## Summary

DecideTogether has completed all 7 core functional and visual phases, scoring 21/24 in UI audits with 37 passing server tests. However, under the hood, 4 architectural "Vibe Coder" shortcuts remain:
1. **Volatile In-Memory Storage:** Active rooms live purely in a Node.js RAM `Map<string, Room>`. Server restarts (deployments, restarts, sleep modes) destroy all in-flight rooms.
2. **Component Monoliths:** `Lobby.tsx` (340 lines) and `MatchCelebration.tsx` (260 lines) entangle UI rendering, action handlers, layout, and sub-modals in single files.
3. **No Automated CI Quality Gate:** Tests are only run manually via local terminals; no GitHub Actions CI workflow prevents regressive commits on PRs.
4. **Unstructured Console Logging & No Health Monitoring:** The backend relies on direct `console.log` calls without log levels or correlation IDs, and lacks a `/health` endpoint for production uptime monitors.

---

## 1. Storage Repository Pattern (`IRoomRepository`)

### Native SQLite via `node:sqlite` (Node 22+)
Verification confirms `node:sqlite` (`DatabaseSync`) is natively built into the host Node runtime (`v24.20.0`).
- **Zero External Dependencies:** No `npm install better-sqlite3` or native build toolchains (python, visual studio C++).
- **Synchronous & Predictable:** `DatabaseSync` provides instant synchronous queries identical in performance to RAM for low-latency WebSocket rooms.
- **Pluggable Architecture:**
  - `IRoomRepository`: Contract defining `get(code)`, `save(room)`, `delete(code)`, `listActive()`, `cleanupExpired(maxAgeMs)`.
  - `MemoryRoomRepository`: Fast in-memory map implementation used for unit tests.
  - `SqliteRoomRepository`: File-backed persistent database (`./decidetogether.db`) ensuring room recovery after server reboots.

---

## 2. Atomic UI Decomposition

### Celebration Decomposition
`client/src/components/MatchCelebration.tsx` will be broken down into:
- `client/src/components/celebration/CelebrationHeroCTA.tsx`: Google Haritalar navigation button.
- `client/src/components/celebration/CelebrationPillGrid.tsx`: 2x2 grid of secondary action pills (Yemeksepeti, Uber Eats, Call, WhatsApp).
- `client/src/components/celebration/celebrationConfetti.ts`: Pure helper encapsulating the single warm confetti burst.
- `MatchCelebration.tsx`: Thin coordinator modal holding state and layout.

### Lobby Decomposition
`client/src/components/Lobby.tsx` will be broken down into:
- `client/src/components/lobby/CreateRoomCard.tsx`: Host room creation button and loading spinner.
- `client/src/components/lobby/JoinRoomCard.tsx`: 4-digit PIN input and join button.
- `client/src/components/lobby/LocationPill.tsx`: Location chip and district selector trigger.
- `Lobby.tsx`: Clean composition view coordinating sockets and sub-components.

---

## 3. GitHub Actions CI/CD Pipeline

A standardized `.github/workflows/ci.yml` will run on every `push` and `pull_request` to `master`:
1. Checkout code.
2. Setup Node.js (matrix: Node 20, Node 22).
3. Install dependencies: `npm ci`.
4. Run client build: `npm run build --workspace=client` (TypeScript + Vite).
5. Run server test suite: `npm test --workspace=server` (Node native test runner).

---

## 4. Structured Logger & Health Endpoint

- `server/src/logger.ts`: Provides structured ISO timestamped logs with level severity (`[INFO]`, `[WARN]`, `[ERROR]`) and optional JSON metadata (`roomId`, `userId`).
- `GET /health` in `server/src/index.ts`: Returns HTTP 200 with JSON payload `{ status: 'ok', uptime: process.uptime(), activeRooms: count, storage: 'sqlite' }`.
