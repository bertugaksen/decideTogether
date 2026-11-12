---
last_mapped_commit: c7f5562b7ba1bdd5b70cffe2de3f22fc3030914f
last_mapped_at: 2026-11-12
---
<!-- refreshed: 2026-11-12 -->
<Architecture>
**Analysis Date:** 2026-11-12

## System Overview

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                        Client Layer (Mobile Web PWA)                    │
│                        `client/src/` (React 19 + Vite)                  │
├──────────────────────────┬───────────────────────┬──────────────────────┤
│  Lobby & District Modal  │   Swipe Deck & Cards  │   Rapid Tapper Duel  │
│  `components/Lobby.tsx`  │ `components/Swipe...` │ `components/Rapid...`│
├──────────────────────────┴───────────────────────┴──────────────────────┤
│               useRoomSocket Hook (`client/src/hooks/useRoomSocket.ts`)  │
│               - Persistent LocalSession (`decidetogether_session`)      │
│               - 80ms Batched Duel Tap Queue                             │
│               - Auto-Reconnect & 30s Grace Period Tracker               │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
                     WebSocket (/ws) │ REST (/api/*)
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                   Server Transport & Routing Layer                      │
│                   `server/src/index.ts` (Express 4 + ws 8)              │
├────────────────────────────────────┬────────────────────────────────────┤
│  WebSocket Message Dispatcher      │  REST Endpoints & Photo Proxy      │
│  - Parses `ClientMessage` actions  │  - `/api/health`, `/health`        │
│  - Dispatches to `RoomManager`     │  - `/api/districts`, `/resolve`    │
│  - Broadcasts `ServerMessage`s     │  - `/api/venues/photo` (Google API)│
└────────────────────────────────────┼────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                      Domain & Application Services                      │
│                      `server/src/services/` & `roomManager.ts`          │
├──────────────────────────┬───────────────────────┬──────────────────────┤
│   RoomManager (Orchestrator)                     │  DuelEngine          │
│   `server/src/roomManager.ts`                    │  `services/duel...`  │
│   - PIN Generation (4-digit)                     │  - Tap rate clamp    │
│   - Peer Matchmaking & Role Assignment           │  - 5s battle timer   │
│   - Swipe Matching & Deck Exhaustion             │  - Winner resolution │
├──────────────────────────────────────────────────┴──────────────────────┤
│   VenueService (`server/src/services/venueService.ts`)                  │
│   - Google Places API (New) fetch Nearby & Field Masking                │
│   - Cuisine Diversity Balancing (`balanceDeckDiversity`)                │
│   - Fallback District Catalog (`mockVenues.ts`)                         │
│   - Coordinate Snapping & LRU Cache (`venueCache.ts` - 2h TTL)          │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                     Shared Contract & Domain Utilities                  │
│                     `shared/src/` (@decidetogether/shared)              │
├─────────────────────────────────────────────────────────────────────────┤
│  - TypeScript Protocol Types (`shared/src/types.ts`)                    │
│  - Action Links: Google Maps GPS & Delivery URLs (`shared/src/action...`)│
│  - Turkish Typography & Name Cleansing (`shared/src/textUtils.ts`)       │
│  - Smart Food Photo Fallbacks (`shared/src/foodPhotos.ts`)              │
│  - Curated District Database (`shared/src/districts.ts`)                │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        Persistence Layer (Database)                     │
│                        `server/src/repositories/`                       │
├─────────────────────────────────────────────────────────────────────────┤
│  - `IRoomRepository` interface (`roomRepository.ts`)                    │
│  - `SqliteRoomRepository` (`sqliteRoomRepository.ts`):                  │
│    Node 22 `node:sqlite` (DatabaseSync), WAL mode, L1 Map cache,        │
│    `decidetogether.db` table `rooms (code, data, updatedAt)`            │
│  - `MemoryRoomRepository` (`memoryRoomRepository.ts`): unit testing     │
└─────────────────────────────────────────────────────────────────────────┘
```

## Component Responsibilities

| Component | Responsibility | File |
|-----------|----------------|------|
| **App Shell** | Root view router switching between Lobby and active game states based on room status | `client/src/App.tsx` |
| **Room Socket Hook** | Encapsulates client WebSocket lifecycle, message serialization, offline queueing, local session storage, and reconnection | `client/src/hooks/useRoomSocket.ts` |
| **Geolocation Hook** | Requests browser navigator.geolocation, handles permission rejection, and passes GPS coordinates | `client/src/hooks/useGeolocation.ts` |
| **Lobby UI** | Renders room creation, 4-digit PIN entry, WhatsApp share trigger, and location selection pill | `client/src/components/Lobby.tsx` |
| **Room Waiting View** | Displays 4-digit room code, participant connection status badges, district selector trigger, and start swiping CTA | `client/src/components/RoomWaitingView.tsx` |
| **District Selector** | Modal list for switching active dining district or selecting live GPS coordinates | `client/src/components/DistrictSelector.tsx` |
| **Swipe Deck** | Renders 2-card sliding window stack, Framer Motion drag gestures, touch action buttons, and partner progress bar | `client/src/components/SwipeDeck.tsx` |
| **Venue Card** | Displays 78% food photography, scrim vignette, ratings, distance, and 22% category footer | `client/src/components/VenueCard.tsx` |
| **Match Celebration** | Climax modal displaying winning venue, warm confetti effects, turn-by-turn navigation CTA, and delivery links | `client/src/components/MatchCelebration.tsx` |
| **Deck Exhausted** | Draw dialog shown when all cards are swiped without mutual match; triggers Rapid Tapper duel | `client/src/components/DeckExhausted.tsx` |
| **Rapid Tapper Duel** | Orchestrates countdown, online duel, and split-screen local duel modes | `client/src/components/RapidTapperDuel.tsx` |
| **Online Duel View** | Handles optimistic local multi-touch tap tracking, 80ms WebSocket tap batch flushing, and live Tug-of-War bar | `client/src/components/OnlineDuelView.tsx` |
| **Split Screen Duel** | Single-device duel rendering two opposing tap pads with isolated multi-touch gesture handlers | `client/src/components/SplitScreenDuelView.tsx` |
| **Sound Effects** | Web Audio API oscillator tone generator for countdown beeps, fanfare, and tactile tap feedback | `client/src/utils/soundEffects.ts` |
| **HTTP & WS Server** | Initializes Express and `ws.WebSocketServer`, sets up REST endpoints, and manages socket connections | `server/src/index.ts` |
| **Room Manager** | Authoritative room lifecycle orchestrator: generates PINs, assigns roles, tracks socket mappings, handles swipes, instant matches, and disconnects | `server/src/roomManager.ts` |
| **Venue Service** | Fetches live places from Google Places API, applies Turkish cuisine diversity interleaving, and generates action links | `server/src/services/venueService.ts` |
| **Venue Cache** | In-memory LRU cache with 2-hour TTL and 500m coordinate grid snapping to minimize Google Places API billing | `server/src/services/venueCache.ts` |
| **Duel Engine** | Authoritative duel state machine: validates tap timestamps, enforces anti-cheat tap rate clamps, and calculates winner | `server/src/services/duelEngine.ts` |
| **SQLite Repository** | High-performance synchronous SQLite room persistence using Node 22 native `node:sqlite` in WAL mode | `server/src/repositories/sqliteRoomRepository.ts` |
| **Action Links Helper** | Constructs walking navigation URLs for Google Maps and search URLs for Yemeksepeti, Trendyol Yemek, Getir, Uber Eats | `shared/src/actionLinks.ts` |
| **Text Utils** | Cleans OCR/Google Turkish venue strings, converts ASCII transliterations into proper Turkish orthography | `shared/src/textUtils.ts` |
| **Food Photo Fallback** | Deterministic category-to-Unsplash image mapping guaranteeing high-resolution food imagery | `shared/src/foodPhotos.ts` |

## Pattern Overview

**Overall:** Event-Driven Client-Server Architecture with Authoritative State Machine & Monorepo Domain Sharing.

**Key Characteristics:**
- **Authoritative Server / Thin Client:** The client never computes matches, scores, or duel winners. The client renders UI state optimistically where necessary (e.g. card drag, duel tap counts) but accepts the server's state transitions as final truth.
- **Protocol-First Contract Sharing:** All message definitions (`ClientMessage`, `ServerMessage`), models (`Room`, `Venue`, `Participant`), and common utilities reside in `@decidetogether/shared`, guaranteeing compile-time type safety across frontend and backend.
- **Synchronous Write-Through Repository Pattern:** State operations execute via `IRoomRepository` backed by `SqliteRoomRepository`, utilizing Node 22 built-in `node:sqlite` in WAL mode with an in-memory L1 Map cache for <10ms persistence.
- **Dual Transport Strategy:** WebSockets (`ws`) handle ultra-low-latency bidirectional state sync (<100ms requirement for matches and duels), while standard Express REST handles stateless operations (health telemetry, district listing, Google photo proxying).

## Layers

**1. Presentation Layer (Client UI):**
- Purpose: Render fluid, mobile-first touch UI with tactile visual and auditory feedback.
- Location: `client/src/components/`, `client/src/App.tsx`
- Contains: React 19 functional components, Framer Motion animations, Lucide icons, Canvas Confetti triggers, Web Audio API tone synthesizers.
- Depends on: Presentation hooks (`useRoomSocket`, `useGeolocation`), `@decidetogether/shared`.
- Used by: End users on mobile or desktop browsers.

**2. Client State & Communication Layer:**
- Purpose: Maintain WebSocket connection, buffer outgoing messages during reconnection, cache session in `localStorage`, and manage React component state.
- Location: `client/src/hooks/`
- Contains: `useRoomSocket.ts`, `useGeolocation.ts`.
- Depends on: Browser WebSocket API, Web Storage API, Geolocation API, `@decidetogether/shared`.
- Used by: All React views (`Lobby`, `SwipeDeck`, `MatchCelebration`, `RapidTapperDuel`).

**3. Transport & Routing Layer (Server Gateway):**
- Purpose: Terminate HTTP and WebSocket requests, serialize/deserialize payloads, sanitize parameters, and proxy external API assets.
- Location: `server/src/index.ts`
- Contains: Express app, HTTP server, `WebSocketServer` instance, REST endpoints, photo proxy handler.
- Depends on: `server/src/roomManager.ts`, `server/src/logger.ts`, `@decidetogether/shared`.
- Used by: Connected client browser instances.

**4. Domain & Business Logic Layer (Server Core):**
- Purpose: Execute room state transitions, evaluate swipe intersections, maintain timers, score duel taps, and assemble diverse venue decks.
- Location: `server/src/roomManager.ts`, `server/src/services/`
- Contains: `RoomManager`, `VenueService`, `DuelEngine`, `VenueCache`, `MOCK_VENUES`.
- Depends on: `server/src/repositories/roomRepository.ts`, `@decidetogether/shared`, external Google Places API.
- Used by: Transport layer (`server/src/index.ts`).

**5. Persistence & Storage Layer (Server):**
- Purpose: Persist room state across server restarts, manage room lifecycles, and purge stale rooms older than 24 hours.
- Location: `server/src/repositories/`
- Contains: `IRoomRepository`, `SqliteRoomRepository`, `MemoryRoomRepository`.
- Depends on: Node 22 `node:sqlite` (`DatabaseSync`), `server/src/types.ts`.
- Used by: `RoomManager`.

**6. Shared Domain Layer:**
- Purpose: Common domain contracts, algorithmic calculations, string sanitation, and static asset fallbacks shared across client and server.
- Location: `shared/src/`
- Contains: Types (`types.ts`), Turkish orthography utilities (`textUtils.ts`), Haversine math and action link builders (`actionLinks.ts`), district catalogs (`districts.ts`), smart photo fallback tables (`foodPhotos.ts`).
- Depends on: Pure TypeScript runtime (zero external runtime dependencies).
- Used by: Both `client` and `server` packages.

## Data Flow

### Primary Request Path (Room Creation & Swiping Flow)

```text
Host Browser               Server (WS & RoomManager)              Peer Browser
    │                                  │                               │
    ├──── CREATE_ROOM ────────────────>│                               │
    │     (nickname, location)         ├─ Generate 4-digit PIN         │
    │                                  ├─ VenueService.resolveLocation │
    │                                  ├─ Save Room to SQLite          │
    │<─── ROOM_CREATED ────────────────┤                               │
    │                                  │<─── JOIN_ROOM ────────────────┤
    │                                  │     (roomCode, nickname)      │
    │                                  ├─ Assign role: 'peer'          │
    │                                  ├─ Room status: 'ready'         │
    │<─── PEER_JOINED / ROOM_READY ────┼──── ROOM_JOINED / ROOM_READY ─>
    │                                  │                               │
    ├──── START_SWIPING ──────────────>│                               │
    │                                  ├─ Room status: 'swiping'       │
    │<─── ROOM_STATE (swiping) ────────┼──── ROOM_STATE (swiping) ────>│
    │                                  │                               │
    ├──── SWIPE (venue_1, 'like') ────>│                               │
    │                                  ├─ Record vote                  │
    │                                  ├──── PARTNER_PROGRESS ─────────>
    │                                  │                               │
    │                                  │<─── SWIPE (venue_1, 'like') ──┤
    │                                  ├─ O(1) Instant Match Check     │
    │                                  ├─ Room status: 'matched'       │
    │<─── MATCH (venue_1) ─────────────┴──── MATCH (venue_1) ──────────>
```

1. **Room Creation:** Client invokes `createRoom()` (`client/src/hooks/useRoomSocket.ts:356`). Server generates unique 4-digit numeric PIN, queries `VenueService.resolveLocationAndVenues()`, saves room in SQLite, registers socket in `clients` Map, and emits `ROOM_CREATED` (`server/src/roomManager.ts:84-136`).
2. **Peer Joining:** Peer joins via PIN or URL parameter `?room=1234` (`client/src/components/Lobby.tsx:57-66`). Server links socket to room, sets status to `'ready'`, saves to SQLite, sends `ROOM_JOINED` to peer, and broadcasts `PEER_JOINED` and `ROOM_READY` (`server/src/roomManager.ts:139-265`).
3. **Swiping Initiation:** Either participant clicks "Start Swiping". Server verifies >= 2 participants are connected, updates status to `'swiping'`, and broadcasts `ROOM_STATE` (`server/src/roomManager.ts:444-476`).
4. **Swipe Execution & Progress Broadcast:** Client swipes card or clicks Like/Pass. `recordSwipe()` verifies client identity, checks active room status, stores vote, and broadcasts `PARTNER_PROGRESS` containing only index and card count (concealing the vote choice) (`server/src/roomManager.ts:478-523`).
5. **Instant Match Detection:** If both users vote `'like'` on the same venue ID, server marks room `'matched'`, persists winning venue, and broadcasts `MATCH` with venue details (`server/src/roomManager.ts:525-545`).
6. **Climax Presentation:** Both clients render `MatchCelebration` modal, fire warm confetti, and provide direct links to Google Maps navigation (`buildGoogleMapsNavigationUrl`) and delivery platforms (`client/src/components/MatchCelebration.tsx:40-87`).

### Deck Exhaustion & Duel Flow

1. **Exhaustion Trigger:** Both participants complete swiping all cards in the deck without finding a mutual match. `recordSwipe()` detects all votes cast, changes status to `'duel'`, and broadcasts `DECK_EXHAUSTED` (`server/src/roomManager.ts:548-568`).
2. **Duel Setup:** Clients present `DeckExhausted` modal. User clicks "Parmak Güreşini Başlat" (Online) or "Yan Yana Oyna" (Split-screen). Client sends `START_DUEL` (`client/src/hooks/useRoomSocket.ts:426`).
3. **Countdown & Battle Start:** `roomManager.startDuel()` calls `duelEngine.initializeDuel()`, scheduling a 3-second countdown and 5-second battle duration. Server broadcasts `DUEL_STARTING` (`server/src/roomManager.ts:596-625`).
4. **Online Tap Synchronization:** In online mode, users tap rapidly. `OnlineDuelView` updates local tap counts instantly with haptic feedback, batching updates via WebSocket every 80ms (`client/src/components/OnlineDuelView.tsx:52-60`).
5. **Anti-Cheat Validation:** `RoomManager.recordDuelTap()` calls `duelEngine.validateTap()`, enforcing timing boundaries (`startTime` to `startTime + durationMs + 400ms`) and clamping tap increments to max 30 taps per packet (`server/src/services/duelEngine.ts:52-72`). Updates are broadcast as `DUEL_PROGRESS`.
6. **Duel Conclusion:** When server timer fires (or split-screen host submits `RESOLVE_SPLIT_DUEL`), `RoomManager.concludeDuel()` executes. Winner is determined (fair coin toss on tie). Winning venue is selected hierarchically: winner's highest-rated like -> peer's highest-rated like -> top deck venue (`server/src/services/duelEngine.ts:114-150`). Server broadcasts `MATCH` with `duelResult`.

**State Management:**
- **Server:** Room state is held in memory and persisted synchronously to SQLite via `SqliteRoomRepository`. Single source of truth.
- **Client:** React component tree driven by `useRoomSocket` hook state (`room`, `currentUser`, `peer`, `partnerProgress`, `matchedVenue`, `isDeckExhausted`, `duelState`).
- **Storage:** Client caches active session (`SavedSession`) in browser `localStorage` under `decidetogether_session` to survive page reloads and mobile browser tab switches.

## Key Abstractions

**`IRoomRepository` (Repository Pattern):**
- Purpose: Decouples business logic in `RoomManager` from the storage engine.
- Examples: `server/src/repositories/roomRepository.ts`, `server/src/repositories/sqliteRoomRepository.ts`, `server/src/repositories/memoryRoomRepository.ts`.
- Pattern: Repository Pattern / Dependency Inversion.

**`VenueService` & `VenueCache` (Facade with Transparent Caching):**
- Purpose: Encapsulates venue retrieval, external API field masking, coordinate grid snapping, and fallback dataset merging behind a unified interface.
- Examples: `server/src/services/venueService.ts`, `server/src/services/venueCache.ts`.
- Pattern: Facade Pattern + Cache-Aside Pattern.

**`DuelEngine` (Domain Service / Strategy):**
- Purpose: Pure, stateless business rules for duel initialization, tap bounds validation, anti-cheat limits, and hierarchical venue resolution.
- Examples: `server/src/services/duelEngine.ts`.
- Pattern: Domain Service / Strategy Pattern.

**`useRoomSocket` (Custom React Hook Facade):**
- Purpose: Abstracts raw WebSocket event handling, auto-reconnection, JSON parsing, message queueing, and localStorage synchronization into clean React state and action functions.
- Examples: `client/src/hooks/useRoomSocket.ts`.
- Pattern: Facade Pattern / Custom React Hook.

## Entry Points

**Client Web Application:**
- Location: `client/src/main.tsx` & `client/src/App.tsx`
- Triggers: User visits root URL in mobile or desktop web browser (`http://localhost:5173` or production domain).
- Responsibilities: Initializes React DOM root, mounts `App`, attaches `useRoomSocket`, determines view routing (Lobby vs. SwipeDeck).

**Backend Server (HTTP & WebSocket):**
- Location: `server/src/index.ts`
- Triggers: Node runtime execution (`tsx watch src/index.ts` or `node dist/index.js`).
- Responsibilities: Loads environment variables via `dotenv`, instantiates Express application, initializes `RoomManager`, starts HTTP server on port 3001, mounts `WebSocketServer` at path `/ws`, and registers REST routes.

## Architectural Constraints

- **Threading & Runtime:** Single-threaded Node.js event loop (Node >= 22.5.0). Synchronous database calls (`node:sqlite` `DatabaseSync`) are executed directly on the main thread; write performance relies on WAL mode and prepared statements.
- **In-Memory Sockets & Scaling:** `RoomManager` stores active WebSocket connections in a local Map (`private clients: Map<WebSocket, ConnectedClient>`). Consequently, rooms cannot span across multiple server processes or containers without introducing a shared pub/sub layer (such as Redis).
- **Two-Participant Bound:** Rooms are strictly constrained to 2 active participants (`host` and `peer`). The join logic rejects connections if 2 active participants already exist (`server/src/roomManager.ts:220-225`).
- **Connection Grace Period:** Client disconnections do not instantly delete user participation. A 30-second grace window (`reconnectWindowMs = 30000`) allows mobile users to switch networks or revive locked phone screens (`server/src/roomManager.ts:342-378`).
- **Room Expiration (TTL):** Inactive rooms are purged from SQLite after 24 hours via a periodic cleanup interval running every 30 minutes (`server/src/roomManager.ts:35-40`).
- **External API Protection:** Direct calls to Google Places API from browser clients are prohibited. The server proxies photo media (`/api/venues/photo`) with 24-hour cache headers and protects `GOOGLE_PLACES_API_KEY`.

## Anti-Patterns

### Trusting Client-Supplied User IDs in WebSocket Payloads

**What happens:** Client sends `userId` inside action messages (e.g. `SWIPE` or `DUEL_TAP`), and the server trusts this parameter to update room state.
**Why it's wrong:** Any client could forge requests pretending to be their peer, casting votes or submitting fraudulent duel scores on their partner's behalf.
**Do this instead:** Map socket instances strictly to session state upon connection (`this.clients.get(ws)`). Resolve `userId` exclusively from the server-side socket mapping (`server/src/roomManager.ts:486-487`).

### Leaking Secret API Keys to Client Bundles

**What happens:** Putting `GOOGLE_PLACES_API_KEY` into `VITE_` prefixed environment variables for direct frontend Google Places API queries.
**Why it's wrong:** Google Cloud API keys are exposed in client JavaScript bundles, resulting in quota theft and billing abuse.
**Do this instead:** Execute all Google Places requests on the server (`server/src/services/venueService.ts:224-358`). Serve photo assets through the authenticated server proxy endpoint (`server/src/index.ts:69-98`).

### Disclosing Peer Vote Choices During Swiping

**What happens:** Broadcasting the user's vote (`'like'` or `'pass'`) to their partner as soon as each swipe occurs.
**Why it's wrong:** Eliminates tension, reveals decision biases early, and breaks the core gamified instant match mechanic.
**Do this instead:** Broadcast only aggregate progress (`PARTNER_PROGRESS` with card index and total count) to the partner (`server/src/roomManager.ts:513-522`). Conceal vote selections until a match occurs or duel resolves.

## Error Handling

**Strategy:** Defensive boundary handling with graceful degradation and silent fallbacks for non-critical features.

**Patterns:**
- **Fallback Venue Catalog:** If Google Places API request fails, times out (6s abort controller), or returns zero food venues, `VenueService` transparently falls back to curated static district mock data (`MOCK_VENUES`) without interrupting the room session (`server/src/services/venueService.ts:391-394`).
- **Safe Fallback Photos:** If a venue lacks a photo or the Google photo proxy fails, `getSmartFoodPhoto()` deterministically supplies a themed Unsplash photo based on category keywords (`shared/src/foodPhotos.ts`).
- **WebSocket Reconnection & Queueing:** If the WebSocket connection drops, `useRoomSocket` queues outgoing messages in `messageQueueRef` and automatically reconnects every 2 seconds, flushing the queue upon `onopen` (`client/src/hooks/useRoomSocket.ts:28-35, 84-93`).
- **Input Sanitation & Regex Validation:** Coordinates are clamped to -90..90 / -180..180 (`isValidCoordinate`), photo query parameters are checked against `VALID_PHOTO_NAME_REGEX`, and phone numbers are verified via `sanitizePhoneUri`.

## Cross-Cutting Concerns

**Logging:**
- Structured logging service implemented in `server/src/logger.ts` outputting ISO timestamps, log levels (`INFO`, `WARN`, `ERROR`, `DEBUG`), and JSON metadata objects.
- Error logs capture stack traces and contextual endpoint descriptors without leaking sensitive credentials or environment keys.

**Validation:**
- Coordinates validated on entry using `isValidCoordinate()` in `server/src/services/venueService.ts:16-27`.
- 4-digit numeric PINs validated using regex `/^\d{4}$/` on client (`client/src/components/Lobby.tsx:61`) and verified in SQLite repository.
- Duel tap rates clamped to 30 taps per packet to eliminate auto-clicker scripts (`server/src/services/duelEngine.ts:66-68`).

**Authentication:**
- Frictionless zero-login architecture. Users identify via ephemeral generated user IDs (`user_${timestamp}_${rand}`) and custom or randomized Turkish food nicknames (`Aç Panda`, `Kararsız Koala`).
- Sessions are maintained in browser `localStorage` and mapped internally on the server using persistent WebSocket connection references.

---

*Architecture analysis: 2026-11-12*
