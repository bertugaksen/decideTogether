---
last_mapped_commit: c7f5562b7ba1bdd5b70cffe2de3f22fc3030914f
last_mapped_at: 2026-11-12
---
<!-- refreshed: 2026-11-12 -->
# Codebase Concerns

**Analysis Date:** 2026-11-12

## Tech Debt

**Hardcoded Relative WebSockets & Missing Production URL Configuration:**
- Issue: `useRoomSocket` dynamically calculates WebSocket URLs using `${protocol}//${window.location.host}/ws` with a fallback to `ws://localhost:3001/ws`. There is no environment variable configuration (`import.meta.env.VITE_API_URL` or `import.meta.env.VITE_WS_URL`). In local development, Vite proxies `/ws` and `/api` to port 3001, masking this issue. However, deploying the static frontend (e.g., Vercel, Netlify, Cloudflare Pages) and Node backend (e.g., Railway, Render, Fly.io) on separate domains breaks all WebSocket and REST API calls.
- Files: `client/src/hooks/useRoomSocket.ts`, `client/vite.config.ts`, `client/src/components/lobby/CreateRoomCard.tsx`
- Impact: Decoupled hosting architecture fails in production unless routed behind an explicit reverse proxy on the same domain.
- Fix approach: Inject configurable environment variables `VITE_API_BASE_URL` and `VITE_WS_BASE_URL` with fallback to `window.location.host`.

**Duplicated SwipeDeck State Rendering Branching in App.tsx and Lobby.tsx:**
- Issue: Both `App.tsx` and `Lobby.tsx` contain identical conditional logic checking `room && currentUser && (room.status === 'swiping' || room.status === 'matched' || room.status === 'duel')` to render `<SwipeDeck>`. Because `App.tsx` already conditionally mounts `<SwipeDeck>` when active and only renders `<Lobby>` when inactive, lines 99–121 in `Lobby.tsx` are completely unreachable dead code.
- Files: `client/src/App.tsx`, `client/src/components/Lobby.tsx`
- Impact: Unnecessary bundle weight, cognitive overhead, and potential state drift if props passed to `<SwipeDeck>` diverge between the two files.
- Fix approach: Remove lines 99–121 from `client/src/components/Lobby.tsx`, delegating top-level routing and `<SwipeDeck>` rendering solely to `client/src/App.tsx`.

**Residual Ad-Hoc Test Probe Scripts at Server Root:**
- Issue: Five legacy test probe scripts (`test-probe.js`, `test-client-simulation.js`, `test-duel-probe.js`, `test-location-probe.js`, `test-swipe-probe.js`) remain at the root of `server/`. These duplicate tests already formalized in `server/src/tests/` (`duel.test.ts`, `swipeDeck.test.ts`, `venueService.test.ts`).
- Files: `server/test-probe.js`, `server/test-client-simulation.js`, `server/test-duel-probe.js`, `server/test-location-probe.js`, `server/test-swipe-probe.js`
- Impact: Repository clutter, confusion over canonical test execution (`npm test` vs loose scripts), and drift from current API contracts.
- Fix approach: Remove obsolete root probe scripts and migrate any unique stress/simulation scenarios into `server/src/tests/` under Node's native test runner.

**Monolithic Embedded Mock Venues File (`mockVenues.ts` - 1,465 lines):**
- Issue: `server/src/services/mockVenues.ts` contains 1,465 lines of statically defined TypeScript objects defining fallback venues for 10 Turkish districts (Moda, Besiktas, Alsancak, Karsiyaka, Tunali, Kizilay, Kaleici, Lara, Nilufer, Seyhan).
- Files: `server/src/services/mockVenues.ts`, `server/src/services/venueService.ts`
- Impact: Bloats compilation units, complicates git diffs, and mixes static data fixtures with application code.
- Fix approach: Extract mock data into modular JSON fixtures or seed files within a dedicated data folder (e.g., `server/src/data/mockDistricts.json`), loaded lazily or during service initialization.

**CI Pipeline Node Matrix Discrepancy with State Documentation:**
- Issue: The GitHub Actions workflow file specifies `node-version: [22.x]`, whereas documentation (`.planning/STATE.md`) references a `Node 20.x/22.x matrix`. Because `server/src/repositories/sqliteRoomRepository.ts` relies on Node's native `DatabaseSync` (`node:sqlite`) which requires Node.js >= 22.5.0 (declared in root `package.json`), running under Node 20.x would crash with a module resolution failure.
- Files: `.github/workflows/ci.yml`, `.planning/STATE.md`, `package.json`
- Impact: Documentation inconsistency; developer confusion if attempting to support Node 20 LTS environments.
- Fix approach: Update documentation to clarify Node 22.5+ requirement and maintain CI testing against Node 22.x.

## Known Bugs

**Dual Reconnection Race Condition with Peer Slot Replacement:**
- Symptoms: If a peer's connection momentarily drops and a new user attempts to join using the room PIN while the disconnected peer simultaneously reconnects with their existing `userId`, the new user unseats and deletes the disconnected peer (`delete room.participants[oldPeerId]`). The original peer's subsequent reconnect request then fails with "Oda dolu" or "Oda bulunamadı".
- Files: `server/src/roomManager.ts`
- Trigger: Network latency or quick browser reload by peer while a third party attempts to join the room.
- Workaround: The 30-second disconnect timeout keeps the participant record alive, but lines 207–218 eagerly purge disconnected peers if an unknown socket connects before the 30-second grace deadline expires.
- Fix approach: In `server/src/roomManager.ts`, require the 30-second grace window to fully elapse before allowing a new unauthenticated connection to displace an inactive peer slot.

**Split Screen Duel Tie-Breaking Math.random() Inconsistency Between Client and Server:**
- Symptoms: When an exact tie occurs in split screen duel mode (`p1Score === p2Score`), `client/src/components/SplitScreenDuelView.tsx` executes `Math.random() < 0.5 ? 'p1' : 'p2'` and sends `winnerRole` via `RESOLVE_SPLIT_DUEL`. Concurrently, `server/src/index.ts` checks `p1Score === p2Score` and overrides `winnerRole` with `undefined`, invoking `duelEngine.determineWinner` to roll its own independent `Math.random() < 0.5`.
- Files: `client/src/components/SplitScreenDuelView.tsx`, `server/src/index.ts`, `server/src/services/duelEngine.ts`
- Trigger: Exact equal tap count between Player 1 and Player 2 in split-screen duel mode.
- Workaround: The server's authoritative resolution takes precedence and broadcasts `MATCH` with `tieBroken: true`, but the client performs redundant local coin tossing.
- Fix approach: In `SplitScreenDuelView.tsx`, omit client-side random resolution on ties; pass `{ p1, p2 }` scores directly to the server and let the backend act as the single source of truth for tie-breaking.

## Security Considerations

**4-Digit PIN Code Space Exhaustion & Unauthenticated Room Enumeration:**
- Risk: 4-digit PINs (1000–9999) provide only 9,000 unique room codes. An attacker can repeatedly call `CREATE_ROOM` via WebSocket to occupy all 9,000 slots, causing `generateUniquePin()` to exceed 9,000 iterations and throw `Error: No available room codes`. Furthermore, an attacker can brute-force `GET /api/rooms/:code` or WebSocket `JOIN_ROOM` to snoop on active dining sessions.
- Files: `server/src/roomManager.ts`, `server/src/index.ts`
- Current mitigation: Rooms without active connections are cleaned up on empty leave or via the 24-hour TTL cleaner; room capacity capped at 2 participants.
- Recommendations:
  1. Add rate limiting on `CREATE_ROOM` and `JOIN_ROOM` operations per IP address.
  2. Implement an optional room secret or token (UUID) in the join URL so entering a PIN requires possession of the room link or explicit host approval.
  3. Shorten expired room TTL from 24 hours to 1–2 hours.

**Google Places Photo Proxy Bandwidth & Quota Relaying:**
- Risk: `/api/venues/photo` accepts `name`, `cat`, and `title` query parameters. Although `VALID_PHOTO_NAME_REGEX` validates against path traversal, the endpoint remains an open proxy for Google Places photos, enabling third parties to consume server egress bandwidth and Google Places photo media quotas without rate limits.
- Files: `server/src/index.ts`
- Current mitigation: Regex validation (`places/[A-Za-z0-9_-]+/photos/[A-Za-z0-9_-]+`), `Cache-Control: public, max-age=86400`, API key kept secret on the server.
- Recommendations: Enforce request rate limiting on `/api/venues/photo` and validate that requested photo references correspond to active venues currently present in the room cache.

**Unrestricted WebSocket Message Ingestion & Flooding:**
- Risk: WebSocket connections lack per-connection throttling or message volume bounds. While `DUEL_TAP` enforces an anti-cheat delta ceiling (+30 taps), a malicious client could flood `SWIPE`, `SET_LOCATION`, `UPDATE_NICKNAME`, or `DUEL_TAP` messages, triggering continuous SQLite write serialization and CPU load.
- Files: `server/src/index.ts`, `server/src/roomManager.ts`
- Current mitigation: In-memory delta clamping on taps; generic error handling for malformed JSON messages.
- Recommendations: Add token-bucket rate limiting per socket (e.g., max 25 messages/second per connection) and reject excessive message frequencies with socket closure or warnings.

## Performance Bottlenecks

**Synchronous SQLite Serialization on Every Swipe and Duel Tap:**
- Problem: `SqliteRoomRepository.save(room)` executes synchronous `JSON.stringify(room)` and `StatementSync.run()` on Node's main event loop on every swipe and tap batch.
- Files: `server/src/repositories/sqliteRoomRepository.ts`, `server/src/roomManager.ts`
- Cause: During the 5-second Rapid Tapper duel, both clients transmit tap batches every 80ms (~25 updates/second per room). Persisting the entire room state (including full venue arrays and voting maps) to disk on every packet introduces event loop latency under concurrent load.
- Improvement path:
  1. Keep duel score states in memory during active battles and flush to SQLite only upon duel conclusion (`concludeDuel`).
  2. Normalize room tables so static venue data is stored separately from mutable room state (votes, progress, duel scores).

**Vite Production Bundle Overhead with Un-split Motion & Celebration Assets:**
- Problem: Mobile web performance targets require <100ms interaction latency and fast mobile load times. Loading heavy dependencies upfront increases First Contentful Paint (FCP) on 3G/4G connections.
- Files: `client/package.json`, `client/src/components/SwipeDeck.tsx`, `client/src/components/MatchCelebration.tsx`, `client/src/components/RapidTapperDuel.tsx`
- Cause: `framer-motion` (v12) and `canvas-confetti` are bundled into the main initial chunk, even though duel and celebration components are only needed after deck exhaustion or matching.
- Improvement path:
  1. Lazy-load `RapidTapperDuel`, `MatchCelebration`, and `VenueListModal` with `React.lazy` and `Suspense`.
  2. Migrate from full `framer-motion` to `framer-motion/dom` or `LazyMotion` with `domAnimation` feature sets.

**Single-Node Process Binding for WebSocket State:**
- Problem: The application cannot scale horizontally across multiple instances or serverless containers.
- Files: `server/src/roomManager.ts`, `server/src/services/venueCache.ts`
- Cause: Connected client sessions (`Map<WebSocket, ConnectedClient>`) and in-memory caches (`LRUCache`) are locked to single-process memory.
- Improvement path: Introduce Redis or a managed Pub/Sub adapter (e.g. Redis Streams or Socket.io Redis adapter) to synchronize room broadcasts and session state across multiple server containers.

## Fragile Areas

**Mobile Browser AudioContext Autoplay Restrictions:**
- Files: `client/src/utils/soundEffects.ts`, `client/src/components/DeckExhausted.tsx`, `client/src/components/DuelCountdown.tsx`
- Why fragile: Mobile Safari (iOS) and Chrome (Android) enforce strict user gesture requirements before allowing `AudioContext` to emit sound. If the countdown starts automatically or is initiated by the partner while the local user has not yet touched the screen, countdown ticks and buzzer tones fail silently.
- Safe modification: Ensure `soundEffects.initOnUserGesture()` is hooked into all lobby button clicks, card touches, and initial swipe interactions to keep the shared `AudioContext` active.
- Test coverage: Zero automated browser tests exist for audio synthesis.

**Mobile Touch Gestures vs. Native Browser Navigation:**
- Files: `client/src/components/VenueCard.tsx`, `client/src/components/OnlineDuelView.tsx`, `client/src/components/SplitScreenDuelView.tsx`
- Why fragile: Frantic 5-second tapping during rapid tapper duels can easily trigger native iOS pull-to-refresh, double-tap zoom, text selection, or edge swipe back gestures if `touchAction: 'none'`, `user-select: none`, and `select-none` styles fail to inherit across child DOM nodes.
- Safe modification: Verify any layout changes on physical iOS Safari and Android Chrome devices under rapid multi-finger tapping.
- Test coverage: Untested by automated test runners.

**Client-Side Geolocation Edge Cases & Permission Failures:**
- Files: `client/src/hooks/useGeolocation.ts`, `client/src/components/lobby/LocationPill.tsx`, `server/src/services/venueService.ts`
- Why fragile: Geolocation requests can fail silently or time out depending on browser permissions, lack of HTTPS, device GPS availability, or user denial.
- Safe modification: Any modification to location acquisition must preserve fallback to default districts (`kadikoy-moda` or `adana-seyhan`) and avoid blocking room creation.
- Test coverage: Server coordinates validation is tested in `venueService.test.ts`, but browser hook behavior and error state transitions lack automated tests.

## Scaling Limits

**Single-Process Concurrency Ceiling:**
- Current capacity: Approximately 500–1,000 concurrent active rooms (~1,000–2,000 active WebSocket connections) on a standard 1GB RAM virtual server.
- Limit: Node.js process memory and CPU bounds from synchronous SQLite operations and single-threaded event loop message dispatch.
- Scaling path: Implement Redis Pub/Sub and sticky session load balancing across clustered Node workers.

**4-Digit PIN Collision at Scale:**
- Current capacity: 9,000 concurrent rooms maximum (PIN range 1000–9999).
- Limit: Above 4,000 active rooms, random collision rates spike, degrading room creation speed. At 9,000 rooms, creation crashes.
- Scaling path: Transition to 5-digit or 6-digit PINs (100,000+ codes) or alphanumeric room tokens.

**Google Places API Monthly Free Quota:**
- Current capacity: Google Cloud provides $200 monthly credit (~5,000–10,000 Place Search requests depending on field SKU selection).
- Limit: High room creation volume in non-cached coordinates will exhaust the free tier and incur unexpected API billing.
- Scaling path: The 2-hour coordinate cache (`VenueCache` with 500m snapping) mitigates repeat queries; fallback to curated Turkish district presets (`mockVenues.ts`) ensures uptime even when quota is depleted.

## Dependencies at Risk

**Experimental Node.js Native SQLite (`node:sqlite`):**
- Package: `node:sqlite` (`DatabaseSync` / `StatementSync`)
- Risk: `node:sqlite` is marked experimental in Node.js 22.x. While built-in and dependency-free, breaking API adjustments or stability notices could occur across minor Node.js upgrades.
- Impact: Potential compatibility breaks or deprecation warnings on future Node runtime versions.
- Migration plan: If instability arises or compatibility with Node 20 LTS is required, replace with `better-sqlite3` or SQLite WASM.

**Bleeding-Edge React 19 Ecosystem Compatibility:**
- Package: `react` ^19.0.0, `react-dom` ^19.0.0, `@vitejs/plugin-react` ^4.3.4
- Risk: React 19 is newly adopted; third-party component libraries or utilities may encounter peer dependency warnings or hydration discrepancies.
- Impact: Occasional dependency resolution flags during `npm install` when adding community UI packages.
- Migration plan: Pin package versions strictly in `package.json` and verify peer dependency compatibility before introducing external component libraries.

**Tailwind CSS v4 Configuration & Tooling:**
- Package: `@tailwindcss/vite` ^4.0.6, `tailwindcss` ^4.0.6
- Risk: Tailwind CSS v4 is an architectural rewrite replacing `tailwind.config.js` with CSS `@theme` directives and lightningcss.
- Impact: Standard plugins or legacy Tailwind recipes from external UI libraries require manual conversion.
- Migration plan: Maintain CSS-native custom properties in `client/src/index.css`.

## Missing Critical Features

**Client-Side Production URL / Environment Variable Configuration:**
- Problem: Client hardcodes WebSocket and API calls to `window.location.host`.
- Blocks: Hosting the frontend separately (e.g. Vercel) and backend separately (e.g. Railway) without reverse proxying on the identical origin.

**Mid-Duel Reconnection State Recovery:**
- Problem: If a player disconnects during the 5-second rapid tapper duel, the server duel timer concludes automatically. When the player reconnects, they jump straight to `MATCH` or `DECK_EXHAUSTED` without contextual feedback of what transpired.
- Blocks: Graceful recovery from brief cellular connectivity blips during the duel battle phase.

**Host Room Management Controls (Kick, Reset Deck, Change Radius Mid-Game):**
- Problem: Once swiping commences, participants cannot restart the deck, alter cuisine preferences, or kick an inactive partner without leaving the room entirely.
- Blocks: User flexibility when dining intentions or group dynamics shift mid-session.

**PWA Web App Manifest & Service Worker:**
- Problem: The mobile web application currently lacks a `manifest.json` / `manifest.webmanifest` and service worker caching for offline shell loading and native "Add to Home Screen" install prompts.
- Blocks: True native-like mobile PWA installation experience on iOS and Android devices.

## Test Coverage Gaps

**Client Frontend Unit & Component Tests (Zero Coverage):**
- What's not tested: `SwipeDeck.tsx`, `VenueCard.tsx`, `RapidTapperDuel.tsx`, `OnlineDuelView.tsx`, `SplitScreenDuelView.tsx`, `MatchCelebration.tsx`, `useRoomSocket.ts`, and `actionLinks.ts`.
- Files: All components under `client/src/`
- Risk: UI regressions, gesture handling breakdowns, state synchronization failures, and sound effect crashes can pass unnoticed into production.
- Priority: High

**WebSocket Reconnection & Timeout Edge Cases:**
- What's not tested: Disconnect grace period expiration (30-second timeout), simultaneous disconnect of both participants, client rejoining with conflicting nickname, and state reset when room empty.
- Files: `server/src/roomManager.ts`, `client/src/hooks/useRoomSocket.ts`
- Risk: Inactive rooms lingering in memory, zombie client entries, or broken room status state machines.
- Priority: Medium

**Google Places Photo Proxy Upstream Failures:**
- What's not tested: Upstream Google Places API timeouts (6-second abort controller), 403 quota exhaustion responses, malicious photo name inputs, and fallback photo redirect verification.
- Files: `server/src/index.ts` (lines 69–98)
- Risk: Unhandled HTTP errors or connection leakage during Google Cloud service degradation.
- Priority: Medium

**Full Multi-User End-to-End (E2E) Flow:**
- What's not tested: Two real browser contexts creating a room, synchronizing location, swiping cards, reaching instant match, and triggering simultaneous celebration confetti.
- Files: Full system (`client/` and `server/`)
- Risk: Mismatched WebSocket message payloads or client race conditions undetected by isolated server tests.
- Priority: High

---

*Concerns audit: 2026-11-12*
