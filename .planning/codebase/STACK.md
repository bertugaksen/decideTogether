---
last_mapped_commit: c7f5562b7ba1bdd5b70cffe2de3f22fc3030914f
last_mapped_at: 2026-11-12
---
# Technology Stack
**Analysis Date:** 2026-11-12

## Languages

**Primary:**
- TypeScript 5.7.2 - Full-stack language used across all packages: frontend client (`client/src`), backend server (`server/src`), and shared library (`shared/src`). Type configurations defined in `client/tsconfig.json`, `server/tsconfig.json`, and `shared/tsconfig.json`.

**Secondary:**
- JavaScript (Node.js ESM) - Diagnostic and simulation test probes (`server/test-client-simulation.js`, `server/test-duel-probe.js`, `server/test-location-probe.js`, `server/test-probe.js`, `server/test-swipe-probe.js`).
- HTML5 / CSS3 - Base page markup (`client/index.html`) and Tailwind CSS v4 design tokens/theme variables (`client/src/index.css`).

## Runtime

**Environment:**
- Node.js >=22.5.0 (specified in root `package.json` engines; tested on Node 22.x in `.github/workflows/ci.yml`, local runtime detected Node v24.19.0). Requires Node >=22.5.0 specifically for the native `node:sqlite` module.
- Modern Web Browsers (Mobile & Desktop) - Client runs on evergreen browsers supporting ES2022, HTML5 WebSockets, Geolocation API, and Web Audio API (`client/src/hooks/useGeolocation.ts`, `client/src/utils/soundEffects.ts`).

**Package Manager:**
- npm 11.17.0 (configured with npm workspaces: `shared`, `server`, `client` in root `package.json`).
- Lockfile: `package-lock.json` present at root and `client/package-lock.json`.

## Frameworks

**Core:**
- React 19.0.0 (`client/package.json`) - Declarative UI library driving client views, components, and hooks.
- React DOM 19.0.0 (`client/package.json`) - DOM rendering for React.
- Express 4.21.2 (`server/package.json`) - HTTP web server handling REST endpoints (`/health`, `/api/districts`, `/api/locations/resolve`, `/api/venues/photo`, `/api/rooms/:code`).
- ws 8.18.0 (`server/package.json`) - WebSocket server mounted on `/ws` handling real-time bidirectional messaging (`server/src/index.ts`, `server/src/roomManager.ts`).

**Testing:**
- Node.js Native Test Runner (`node:test`) - Run through `tsx --test src/tests/*.test.ts` (`server/package.json`). Tests located in `server/src/tests/` (`duel.test.ts`, `postMatchActions.test.ts`, `roomRepository.test.ts`, `sponsoredInsertion.test.ts`, `swipeDeck.test.ts`, `venueCache.test.ts`, `venueService.test.ts`).
- Client testing framework: Not detected (frontend currently validated via `tsc -b && vite build` and server unit tests in CI).

**Build/Dev:**
- Vite 6.1.0 (`client/package.json`) - Fast frontend bundler and development server (`client/vite.config.ts`).
- `@vitejs/plugin-react` 4.3.4 (`client/package.json`) - React Fast Refresh and JSX transformation.
- Tailwind CSS 4.0.6 (`tailwindcss`) with `@tailwindcss/vite` 4.0.6 (`client/package.json`) - Utility-first CSS framework with native `@import "tailwindcss";` and `@theme` blocks (`client/src/index.css`).
- `tsx` 4.19.2 (`server/package.json`) - TypeScript execute and live watch runner for development (`tsx watch src/index.ts`).
- `concurrently` 9.1.2 (`package.json`) - Concurrent multi-workspace development script execution (`package.json`).

## Key Dependencies

**Critical:**
- `ws` 8.18.0 - Powers room synchronization, two-way swipe notifications, and sub-100ms duel tap messaging (`server/src/index.ts`, `client/src/hooks/useRoomSocket.ts`).
- `framer-motion` 12.4.7 - Physics-based gesture animation library driving card swiping (`drag="x"`), directional exit velocity (`-800` / `+800`), snap-back springs, and duel UI animations (`client/src/components/SwipeDeck.tsx`, `client/src/components/VenueCard.tsx`).
- `node:sqlite` (Node.js standard library) - Embedded synchronous SQLite database (`DatabaseSync`, `StatementSync`) for persistent room storage and automatic 24-hour TTL expiration (`server/src/repositories/sqliteRoomRepository.ts`).
- `lru-cache` 11.0.0 - In-memory least-recently-used cache for Google Places API queries and resolved geocoordinates (`server/src/services/venueCache.ts`).
- `dotenv` 18.0.10 - Loads environment configuration from `.env` files into `process.env` on server startup (`server/src/index.ts`).
- `cors` 2.8.5 - Express middleware enabling Cross-Origin Resource Sharing for API requests (`server/src/index.ts`).

**Infrastructure & UI Utilities:**
- `lucide-react` 0.475.0 - Icon set used across lobby, waiting room, swipe cards, celebration modal, and duel surfaces (`client/src/components/`).
- `canvas-confetti` 1.9.4 & `@types/canvas-confetti` 1.9.0 - Confetti particle explosions on match resolution (`client/src/components/celebration/celebrationConfetti.ts`).
- `clsx` 2.1.1 & `tailwind-merge` 3.0.1 - Conditional className composition and Tailwind utility conflict resolution.

## Configuration

**Environment:**
- Managed via `dotenv` on backend (`server/src/index.ts`).
- Required / Supported Variables:
  - `PORT`: HTTP and WebSocket server port (defaults to `3001`).
  - `GOOGLE_PLACES_API_KEY`: API key for Google Places (New) API (`server/src/services/venueService.ts`). Optional; system falls back to mock district datasets if missing.
  - `NODE_ENV`: Runtime environment (`development` | `production`).
  - `DEBUG`: Enables verbose debug logging (`server/src/logger.ts`).
- Frontend development proxy configured in `client/vite.config.ts`:
  - `/api` proxies to `http://localhost:3001`
  - `/ws` proxies with WebSocket upgrade to `ws://localhost:3001`

**Build:**
- Root: `package.json` coordinates workspace builds:
  - `npm run build:shared` -> compiles shared library (`shared/dist`)
  - `npm run build` -> compiles shared library, server (`server/dist`), and client (`client/dist`)
- Client: `client/vite.config.ts` and `client/tsconfig.json` (`target: ES2022`, `moduleResolution: bundler`, `noEmit: true` for Vite build).
- Server: `server/tsconfig.json` (`target: ES2022`, `module: NodeNext`, `moduleResolution: NodeNext`, `outDir: ./dist`).
- Shared: `shared/tsconfig.json` (`target: ES2022`, `module: NodeNext`, `declaration: true`, `outDir: ./dist`).

## Platform Requirements

**Development:**
- Node.js >=22.5.0 (enforced by `node:sqlite`).
- npm >=10.0.0.
- Modern browser with WebSockets, Geolocation, and AudioContext support.
- Shell: bash or PowerShell (commands wrapped in `cmd /c` on Windows if script execution policies are restricted).

**Production:**
- Backend: Any Node.js >=22.5.0 execution environment with persistent local disk for SQLite (Railway, Render, Fly.io, or VPS).
- Frontend: Static asset hosting (Vercel, Cloudflare Pages, Netlify) or served directly via Express/reverse proxy.
- Platform Target: Mobile Web (PWA responsive layout with viewport lock `user-scalable=no` in `client/index.html`).

---

*Stack analysis: 2026-11-12*
