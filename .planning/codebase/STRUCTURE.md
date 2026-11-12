---
last_mapped_commit: 9e5f2869d318f9f5659401bc97637e665352495e
last_mapped_at: 2026-11-12
---
<Codebase Structure>
**Analysis Date:** 2026-11-12

## Directory Layout

```
decidetogether/
├── .github/
│   └── workflows/
│       └── ci.yml                     # Continuous integration workflow (build, test)
├── .planning/
│   ├── codebase/                      # Architectural and technical documentation
│   │   ├── ARCHITECTURE.md            # System patterns, layers, data flow
│   │   ├── CONVENTIONS.md             # Code style, formatting, imports
│   │   ├── INTEGRATIONS.md            # APIs, external services, deployment
│   │   ├── STACK.md                   # Languages, frameworks, dependencies
│   │   ├── STRUCTURE.md               # Directory layout and code placement guide
│   │   └── TESTING.md                 # Test framework, runner, test suites
│   ├── phases/                        # SDD phase plans, summaries, and verification
│   ├── PROJECT.md                     # Core project requirements and constraints
│   ├── REQUIREMENTS.md                # Feature requirements matrix
│   ├── ROADMAP.md                     # Milestone roadmap and phase tracker
│   └── STATE.md                       # Current project execution state
├── client/                            # Frontend Web Application (React 19 + Vite)
│   ├── public/
│   │   └── logo.jpg                   # Public static logo
│   ├── src/
│   │   ├── assets/
│   │   │   └── logo.jpg               # Bundled visual assets
│   │   ├── components/                # React UI components
│   │   │   ├── celebration/           # Post-match celebration sub-components
│   │   │   │   ├── celebrationConfetti.ts   # Canvas confetti particle triggers
│   │   │   │   ├── CelebrationHeroCTA.tsx   # Google Maps primary navigation button
│   │   │   │   ├── CelebrationPillGrid.tsx  # Call, delivery, and web action pills
│   │   │   │   └── CelebrationVenueCard.tsx # Winner venue card with rating & distance
│   │   │   ├── lobby/                 # Pre-game lobby sub-components
│   │   │   │   ├── CreateRoomCard.tsx       # Host room creation card
│   │   │   │   ├── JoinRoomCard.tsx         # 4-digit PIN room join card
│   │   │   │   └── LocationPill.tsx         # District & GPS location selector trigger
│   │   │   ├── DeckExhausted.tsx      # Draw screen when deck ends without match
│   │   │   ├── DistrictSelector.tsx   # District selection & GPS coordinate modal
│   │   │   ├── DuelCountdown.tsx      # 3-2-1 animated duel countdown timer
│   │   │   ├── Lobby.tsx              # Main lobby view container
│   │   │   ├── MatchCelebration.tsx   # Instant match climax celebration modal
│   │   │   ├── OnlineDuelView.tsx     # Remote WebSocket Rapid Tapper duel view
│   │   │   ├── RapidTapperDuel.tsx    # Rapid Tapper duel orchestrator
│   │   │   ├── RoomWaitingView.tsx    # Host waiting room with PIN & share CTAs
│   │   │   ├── SplitScreenDuelView.tsx# Single-device split screen duel view
│   │   │   ├── SwipeDeck.tsx          # Card swiping view with progress tracker
│   │   │   ├── TugOfWarBar.tsx        # Dynamic tug-of-war score balance bar
│   │   │   ├── VenueCard.tsx          # 78/22 food card with Framer Motion gestures
│   │   │   └── VenueListModal.tsx     # Preview modal listing current room venues
│   │   ├── hooks/                     # Custom React hooks
│   │   │   ├── useGeolocation.ts      # HTML5 Geolocation API wrapper
│   │   │   └── useRoomSocket.ts       # Central WebSocket room & session hook
│   │   ├── utils/                     # Frontend client utilities
│   │   │   ├── actionLinks.ts         # Post-match link re-exports
│   │   │   └── soundEffects.ts        # Web Audio API procedural sound synthesizer
│   │   ├── App.tsx                    # Root application component & screen router
│   │   ├── index.css                  # Tailwind CSS v4 theme variables & typography
│   │   ├── main.tsx                   # React 19 DOM mount entry point
│   │   ├── types.ts                   # Client-side type definitions
│   │   └── vite-env.d.ts              # Vite environment typings
│   ├── index.html                     # HTML5 shell with viewport & font imports
│   ├── package.json                   # Client package manifest
│   ├── tsconfig.json                  # Client TypeScript configuration
│   └── vite.config.ts                 # Vite bundler configuration & proxy routes
├── server/                            # Backend Server (Node 22 + Express + ws)
│   ├── src/
│   │   ├── repositories/              # State persistence implementations
│   │   │   ├── memoryRoomRepository.ts# In-memory Map room repository for tests
│   │   │   ├── roomRepository.ts      # IRoomRepository interface definition
│   │   │   └── sqliteRoomRepository.ts# Node 22 node:sqlite WAL room repository
│   │   ├── services/                  # Backend domain services
│   │   │   ├── actionLinks.ts         # Navigation & delivery link generator
│   │   │   ├── duelEngine.ts          # Duel rules, anti-cheat, scoring & winner logic
│   │   │   ├── mockVenues.ts          # Fallback venues & curated Istanbul districts
│   │   │   ├── venueCache.ts          # In-memory LRU cache with coordinate snapping
│   │   │   └── venueService.ts        # Google Places API integration & deck balancer
│   │   ├── tests/                     # Unit & integration test suites
│   │   │   ├── duel.test.ts           # Rapid Tapper scoring & resolution tests
│   │   │   ├── postMatchActions.test.ts # Google Maps & delivery links tests
│   │   │   ├── roomRepository.test.ts # SQLite & Memory repository tests
│   │   │   ├── sponsoredInsertion.test.ts # Sponsored venue insertion tests
│   │   │   ├── swipeDeck.test.ts      # Swiping, progress & instant match tests
│   │   │   ├── venueCache.test.ts     # LRU cache TTL & grid snapping tests
│   │   │   └── venueService.test.ts   # Places fetching & cuisine balancing tests
│   │   ├── index.ts                   # Express & WebSocket server bootstrap entry
│   │   ├── logger.ts                  # Structured logging service
│   │   ├── roomManager.ts             # Authoritative room state machine
│   │   └── types.ts                   # Server-specific types & shared re-exports
│   ├── decidetogether.db              # Local SQLite database (WAL mode)
│   ├── package.json                   # Server package manifest
│   └── tsconfig.json                  # Server TypeScript configuration
├── shared/                            # Shared Domain Library (@decidetogether/shared)
│   ├── src/
│   │   ├── actionLinks.ts             # Haversine distance & universal links builder
│   │   ├── districts.ts               # Default Turkish district coordinates & cuisines
│   │   ├── foodPhotos.ts              # Categorized food imagery fallback dictionary
│   │   ├── index.ts                   # Shared library barrel exports
│   │   ├── textUtils.ts               # Turkish orthography & venue name cleaning
│   │   └── types.ts                   # Canonical TypeScript entity & message types
│   ├── package.json                   # Shared package manifest
│   └── tsconfig.json                  # Shared TypeScript configuration
├── package.json                       # NPM Workspaces monorepo root manifest
└── package-lock.json                  # Monorepo dependency lockfile
```

## Directory Purposes

**`client/src/components/`:**
- Purpose: Presentational and interactive React UI components.
- Contains: Full-screen views (`Lobby`, `SwipeDeck`), feature modals (`MatchCelebration`, `DeckExhausted`, `DistrictSelector`, `VenueListModal`), duel views (`RapidTapperDuel`, `OnlineDuelView`, `SplitScreenDuelView`), and sub-component folders (`lobby/`, `celebration/`).
- Key files: `SwipeDeck.tsx`, `VenueCard.tsx`, `Lobby.tsx`, `MatchCelebration.tsx`.

**`client/src/hooks/`:**
- Purpose: Reusable stateful React logic decoupled from UI markup.
- Contains: Custom hooks managing network communication and browser hardware APIs.
- Key files: `useRoomSocket.ts` (WebSocket connection, offline queue, localStorage session), `useGeolocation.ts` (HTML5 browser geolocation).

**`client/src/utils/`:**
- Purpose: Client-only operational helpers.
- Contains: Procedural audio synthesis via Web Audio API, link transformers.
- Key files: `soundEffects.ts` (zero-asset Web Audio oscillator), `actionLinks.ts` (re-exports from shared).

**`server/src/repositories/`:**
- Purpose: Persistence layer abstracting data access from room domain operations.
- Contains: Interface specifications and persistent database drivers.
- Key files: `roomRepository.ts` (`IRoomRepository`), `sqliteRoomRepository.ts` (Node 22 `node:sqlite`), `memoryRoomRepository.ts` (isolated test store).

**`server/src/services/`:**
- Purpose: Encapsulated server business logic and third-party API communication.
- Contains: External API clients, in-memory caching, algorithmic deciders, and mock datasets.
- Key files: `venueService.ts` (Google Places API & deck diversity), `duelEngine.ts` (timing validation & anti-cheat), `venueCache.ts` (LRU cache with 500m coordinate snapping), `mockVenues.ts` (static fallback districts and restaurants).

**`server/src/tests/`:**
- Purpose: Automated automated regression and behavior verification.
- Contains: Test suites executing with Node's native test runner (`tsx --test`).
- Key files: `swipeDeck.test.ts`, `duel.test.ts`, `roomRepository.test.ts`, `venueService.test.ts`.

**`shared/src/`:**
- Purpose: Shared domain models, protocol definitions, and utility algorithms utilized across both client and server packages.
- Contains: Type definitions, string sanitizers, math algorithms, and static configuration lists.
- Key files: `types.ts` (`Room`, `Venue`, `Participant`, `ClientMessage`, `ServerMessage`), `actionLinks.ts` (`calculateDistanceKm`, `buildGoogleMapsNavigationUrl`, `buildDeliveryLinks`), `textUtils.ts` (`cleanTurkishVenueName`), `foodPhotos.ts` (`getSmartFoodPhoto`).

## Key File Locations

**Entry Points:**
- `client/src/main.tsx`: Client web app bootstrap; attaches React root to DOM.
- `client/src/App.tsx`: Top-level application controller switching between Lobby and Active Game views.
- `server/src/index.ts`: Backend Express HTTP and WebSocket server initialization, REST routing, and photo proxy.
- `shared/src/index.ts`: Public API export barrel for `@decidetogether/shared`.

**Configuration:**
- `package.json`: Monorepo root scripts (`dev`, `build`, `start`) and workspace definitions.
- `client/vite.config.ts`: Vite server port, host exposure, and `/api` + `/ws` reverse proxies.
- `client/src/index.css`: Tailwind CSS v4 design tokens, color palette, and font families.
- `server/tsconfig.json` & `client/tsconfig.json` & `shared/tsconfig.json`: TypeScript compiler options.

**Core Logic:**
- `server/src/roomManager.ts`: Master state machine managing 4-digit PIN rooms, participants, swiping, matches, and duels.
- `server/src/services/venueService.ts`: Google Places API querying, field masking, category translation, and cuisine interleaving.
- `server/src/services/duelEngine.ts`: Authoritative duel timing, anti-cheat limits, score aggregation, and winner resolution.
- `client/src/hooks/useRoomSocket.ts`: Client-side WebSocket lifecycle, auto-reconnect, and message dispatch.
- `shared/src/actionLinks.ts`: Haversine distance calculation and universal deep link construction.

**Testing:**
- `server/src/tests/*.test.ts`: Node 22 native unit and integration test suites.

## Naming Conventions

**Files:**
- React components: `PascalCase.tsx` (e.g. `SwipeDeck.tsx`, `VenueCard.tsx`, `LocationPill.tsx`).
- React hooks: `camelCase.ts` with `use` prefix (e.g. `useRoomSocket.ts`, `useGeolocation.ts`).
- Services and utilities: `camelCase.ts` (e.g. `venueService.ts`, `duelEngine.ts`, `soundEffects.ts`).
- Repository interfaces and implementations: `camelCase.ts` or `PascalCase.ts` (e.g. `roomRepository.ts`, `sqliteRoomRepository.ts`).
- Tests: `[module].test.ts` placed in `server/src/tests/` (e.g. `swipeDeck.test.ts`, `duel.test.ts`).

**Directories:**
- Feature clusters and package roots: `kebab-case` or lowercase (e.g. `client`, `server`, `shared`, `components/lobby`, `components/celebration`).
- Source directories: `src/`.

**TypeScript Types & Constants:**
- Interfaces and Types: `PascalCase` (e.g. `Room`, `Participant`, `ClientMessage`, `ServerMessage`).
- Enums / Unions: String literals in lowercase/snake_case (e.g. `'waiting' | 'ready' | 'swiping' | 'matched' | 'duel'`).
- Global Constants: `SCREAMING_SNAKE_CASE` (e.g. `VENUE_CACHE_TTL_MS`, `MOCK_DISTRICTS`, `FOOD_NICKNAMES`).

## Where to Add New Code

**New Feature (e.g. Cuisine Filter / Diet Preferences):**
- Contract & Types: Add request and entity parameters in `shared/src/types.ts`.
- Server Filtering Logic: Implement preference filter in `server/src/services/venueService.ts` and dispatch through `server/src/roomManager.ts`.
- Client UI: Add selector component under `client/src/components/lobby/` or as a new modal in `client/src/components/`.
- Tests: Add test scenarios in `server/src/tests/venueService.test.ts`.

**New Component/Module:**
- Shared UI Component: Create component in `client/src/components/` (or nested subfolder if part of a feature group like `lobby/` or `celebration/`).
- New Domain Service: Create class in `server/src/services/[serviceName].ts` and expose factory or singleton instance.

**Utilities & Helpers:**
- Cross-platform business logic or mathematical calculations: Add to `shared/src/[helperName].ts` and export from `shared/src/index.ts`.
- Browser-specific visual/audio helpers: Add to `client/src/utils/[helperName].ts`.
- Server-specific backend utilities: Add to `server/src/services/` or `server/src/logger.ts`.

## Special Directories

**`.planning/`:**
- Purpose: GSD workflow artifacts, phase execution plans, research notes, and architectural maps.
- Generated: Partially generated during GSD planning and mapping workflows.
- Committed: Yes (essential project planning source of truth).

**`server/decidetogether.db*`:**
- Purpose: Local SQLite database files (`decidetogether.db`, `decidetogether.db-wal`, `decidetogether.db-shm`).
- Generated: Yes (created automatically by `SqliteRoomRepository` at server boot).
- Committed: No (must remain in `.gitignore`).

**`node_modules/`:**
- Purpose: Third-party dependencies installed by npm.
- Generated: Yes (created via `npm install`).
- Committed: No.

**`dist/` (in `client/dist`, `server/dist`, `shared/dist`):**
- Purpose: Transpiled JavaScript production output bundles.
- Generated: Yes (created by `npm run build`).
- Committed: No.

---

*Structure analysis: 2026-11-12*
