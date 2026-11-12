---
last_mapped_commit: c7f5562b7ba1bdd5b70cffe2de3f22fc3030914f
last_mapped_at: 2026-11-12
---
# External Integrations
**Analysis Date:** 2026-11-12

## APIs & External Services

**Location & Venue Search:**
- Google Places API (New) - Queries nearby restaurants, cafes, and bakeries matching user GPS coordinates or selected district center points.
  - SDK/Client: Native Node.js `fetch` via `POST https://places.googleapis.com/v1/places:searchNearby` (`server/src/services/venueService.ts`).
  - Auth: `GOOGLE_PLACES_API_KEY` (configured in server environment).
  - Field Masking: Strict field masking via `X-Goog-FieldMask` requesting only required fields (`places.id`, `places.displayName`, `places.formattedAddress`, `places.location`, `places.rating`, `places.userRatingCount`, `places.priceLevel`, `places.photos`, `places.primaryTypeDisplayName`, `places.currentOpeningHours.openNow`, phone numbers, and maps URI).
  - Photo Proxy: Dedicated server proxy `GET /api/venues/photo` (`server/src/index.ts`) streams place photos to client browsers with 24-hour cache headers, keeping `GOOGLE_PLACES_API_KEY` secure and unexposed to clients.
  - Caching & Fallback: Cached via `lru-cache` (`server/src/services/venueCache.ts`) with a 1-hour TTL. When the API key is not provided, network errors occur, or rate limits are reached, the system falls back seamlessly to 7 pre-configured district datasets in `server/src/services/mockVenues.ts`.

**Turn-by-Turn Navigation:**
- Google Maps - Generates direct walking navigation routes to chosen venues on the match celebration screen.
  - Client: Deep URL linking generated in `shared/src/actionLinks.ts` via `buildGoogleMapsNavigationUrl()`.
  - Pattern: `https://www.google.com/maps/dir/?api=1&destination={name},+{address}&travelmode=walking&destination_place_id={placeId}`.
  - GPS Dynamic Routing: Intentionally omits the `origin` parameter so mobile devices start navigation directly from the user's live GPS ("Konumunuz").

**Food Delivery Deep Links:**
- Food Ordering Platforms - Direct universal links into native apps (or web fallbacks) for immediate food ordering:
  - Yemeksepeti: `https://www.yemeksepeti.com/search?query={venueName}`
  - Uber Eats: `https://www.ubereats.com/search?q={venueName}`
  - GetirYemek: `https://getir.com/yemek/arama?q={venueName}`
  - Trendyol Yemek: `https://www.trendyol.com/sr?q={venueName}+{district}`
  - Client: Constructed dynamically via `buildDeliveryLinks()` in `shared/src/actionLinks.ts` and rendered in `client/src/components/celebration/CelebrationPillGrid.tsx`.

**Social Sharing:**
- WhatsApp Web / Mobile API - One-tap room invite sharing and match result broadcast.
  - Client: Direct URL launcher via `window.open("https://api.whatsapp.com/send?text=...", "_blank")` in `client/src/components/Lobby.tsx` and `client/src/components/celebration/CelebrationPillGrid.tsx`.
  - No SDK or token required.

**Content & Asset CDNs:**
- Unsplash CDN - High-resolution food photography fallbacks categorized by cuisine types (burgers, pastries/cafes, Italian/pizza, kebap/grill, home cooking, and world cuisine) served from `https://images.unsplash.com` (`shared/src/foodPhotos.ts`).
- Google Fonts - Web font typography assets (`Fraunces` and `Inter`) loaded from `https://fonts.googleapis.com` and `https://fonts.gstatic.com` (`client/index.html`).

**Browser APIs:**
- W3C Geolocation API - Captures high-accuracy mobile GPS coordinates (`latitude`, `longitude`) with an 8-second timeout and 30-second cache (`client/src/hooks/useGeolocation.ts`).
- Web Audio API - In-memory synthesized audio tone generator for 3-2-1 duel countdown ticks (523Hz), start fanfare (1046Hz), tap feedback (180Hz), and game buzzers (320Hz) (`client/src/utils/soundEffects.ts`). Requires zero external sound assets.

## Data Storage

**Databases:**
- Embedded SQLite (`node:sqlite`)
  - Connection: Local disk file `./decidetogether.db` (initialized in `server/src/repositories/sqliteRoomRepository.ts`).
  - Client: Node.js standard library `node:sqlite` (`DatabaseSync` and `StatementSync`).
  - PRAGMA Settings: `PRAGMA journal_mode = WAL;`, `PRAGMA busy_timeout = 5000;`.
  - Schema:
    - Table: `rooms (code TEXT PRIMARY KEY, data TEXT NOT NULL, updatedAt INTEGER NOT NULL)`
    - Index: `idx_rooms_updatedAt ON rooms(updatedAt)`
  - Persistence Pattern: Repository pattern (`IRoomRepository` interface). Automatically writes room state on changes and runs periodic cleanup for rooms older than 24 hours (`server/src/roomManager.ts`).
- Ephemeral In-Memory Repository (`server/src/repositories/memoryRoomRepository.ts`)
  - Alternative implementation of `IRoomRepository` using a native `Map<string, Room>`, utilized for isolated unit testing and memory-only environments.

**File Storage:**
- Local filesystem only. No remote cloud object storage (S3, GCS) is required.

**Caching:**
- Server-side LRU Cache: In-memory `lru-cache` v11 in `server/src/services/venueCache.ts`. Caches district queries and rounded geocoordinate buckets (2 decimal places ~1.1km radius) with a 1-hour TTL and maximum 500 entries.
- Client-side LocalStorage: Key `decidetogether_session` stores active room code, user ID, nickname, and role in `client/src/hooks/useRoomSocket.ts` to allow automatic reconnection within 30 seconds of network disconnect or page reload.

## Authentication & Identity

**Auth Provider:**
- Custom Anonymous Session System (Zero-Friction / Passwordless)
  - Implementation: No external identity provider (Auth0, Firebase, Clerk, or Supabase) is used.
  - Identification: Each participant is issued an anonymous ephemeral ID format (`user_{timestamp}_{randomSuffix}`) upon creating or joining a room (`server/src/roomManager.ts`).
  - Nicknames: Automatic playful Turkish food-themed nicknames ("Aç Panda", "Kararsız Koala", "Gurme Tilki", "Keyifli Kedi", "Obur Rakun", "Lezzet Avcısı", "Aç Baykuş") assigned on connection, with user option to edit inline (`client/src/components/RoomWaitingView.tsx`).
  - Room Access: Secured via randomly generated 4-digit numeric PINs (1000–9999).

## Monitoring & Observability

**Error Tracking:**
- None detected (no Sentry, Rollbar, or external APM integration currently installed).

**Logs:**
- Custom structured logger (`server/src/logger.ts`) implementing `ILogger` interface with `info()`, `warn()`, `error()`, and `debug()` methods.
- Output: Standard console output formatted with ISO 8601 timestamps, log severity tags, error stack traces, and serialized JSON metadata.
- Environment control: `logger.debug()` is active when `process.env.DEBUG` is set or `process.env.NODE_ENV === 'development'`.

**Uptime & Health Checks:**
- REST endpoints: `GET /health` and `GET /api/health` (`server/src/index.ts`).
- Payload:
  ```json
  {
    "status": "ok",
    "uptime": 123.45,
    "activeRooms": 2,
    "storage": "sqlite",
    "timestamp": "2026-11-12T17:54:00.000Z"
  }
  ```
- Designed for production probes (e.g., Railway Health Check, UptimeRobot, BetterStack).

## CI/CD & Deployment

**Hosting:**
- Target: Full-stack Node.js hosting platform supporting Node >=22.5.0 with persistent disk (e.g. Railway, Render, Fly.io, or VPS) and optional static frontend hosting (Vercel, Cloudflare Pages).

**CI Pipeline:**
- GitHub Actions workflow defined in `.github/workflows/ci.yml`.
- Runs on push and pull request to `master` and `main` branches.
- Runner: `ubuntu-latest` with Node.js `22.x` and npm dependency caching.
- Build & Verification steps:
  1. `npm ci`
  2. `npm run build:shared` (compiles contracts)
  3. `npm run build --workspace=client` (Vite production build)
  4. `npm test --workspace=server` (runs server test suite)

## Environment Configuration

**Required env vars:**
- `PORT`: HTTP and WebSocket listening port for Express/ws (defaults to `3001` if unset).
- `GOOGLE_PLACES_API_KEY`: Google Cloud Places API key. Optional for development/demo (falls back to mock district datasets), required for live Google Places venue discovery.

**Optional env vars:**
- `NODE_ENV`: Runtime environment (`development` | `production`).
- `DEBUG`: Flag to enable verbose debug logging output.

**Secrets location:**
- Stored locally in `.env` file (loaded via `dotenv/config` in `server/src/index.ts`).
- Protected by `.gitignore` rules (`.env`, `*.env`, `*.env.*`, `*api*key*`).

## Webhooks & Callbacks

**Incoming:**
- None. Real-time updates operate entirely over persistent client-to-server WebSocket connections on `/ws`.

**Outgoing:**
- None. Outgoing actions are client-initiated navigation links and deep links (Google Maps, WhatsApp, delivery apps).

---

*Integration audit: 2026-11-12*
