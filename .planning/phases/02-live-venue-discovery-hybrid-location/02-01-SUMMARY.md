---
phase: 02-live-venue-discovery-hybrid-location
plan: 01
subsystem: api
tags: [places-api, lru-cache, caching, mock-data, sponsored-cards, photo-proxy]

# Dependency graph
requires:
  - phase: 01-realtime-core-lobby-pairing
    provides: RoomManager, Room model, PIN generation, and WebSocket state
provides:
  - VenueService with Google Places API (New) fetcher and strict field masking
  - In-memory VenueCache with 2-hour TTL and 500m coordinate grid snapping
  - High-fidelity Istanbul curated 15-venue decks across 4 districts (Moda, Beşiktaş, Caddebostan, Nişantaşı)
  - Deterministic slot 2 sponsored venue card insertion with "Öne Çıkan Lezzet" badge
  - GET /api/districts and GET /api/venues/photo proxy concealing GOOGLE_PLACES_API_KEY
affects: [02-02, 03-swiping-engine]

# Actuals (#2632)
actuals:
  tokens: 11250
  tasks: 3
  commits: 3
plan_head_before: 35bf6beb91100ffcf9a77c0dc5577f9f30711746
plan_head_after: 5c6949826d83bf748a6605400015f68f9b407d9b

# Tech tracking
tech-stack:
  added: [lru-cache@^11.0.0]
  patterns: [in-memory TTL coordinate grid snapping, strict Places API field masking, server-side photo proxy, deterministic sponsored deck placement]

key-files:
  created:
    - server/src/services/venueCache.ts
    - server/src/services/mockVenues.ts
    - server/src/services/venueService.ts
    - server/src/tests/venueCache.test.ts
    - server/src/tests/venueService.test.ts
    - server/src/tests/sponsoredInsertion.test.ts
  modified:
    - server/package.json
    - server/src/types.ts
    - client/src/types.ts
    - server/src/index.ts

key-decisions:
  - "Used lru-cache with 2-hour TTL (7,200,000ms) and 500m (0.005°) grid snapping to protect API quota and eliminate billing spikes"
  - "Configured strict X-Goog-FieldMask on Places API (New) nearby search to avoid expensive Enterprise Atmosphere pricing tier"
  - "Mounted GET /api/venues/photo proxy on backend to shield GOOGLE_PLACES_API_KEY with Unsplash fallback"
  - "Deterministic placement of primary sponsored card at slot 2 (index 1) to build immediate user trust while guaranteeing 100% swipe exposure"

patterns-established:
  - "Coordinate Snapping: getCoordinateCacheKey snaps GPS drifts within 500m to geo:lat,lng grid"
  - "Multi-tier Venue Resolution: Cache -> Google Places API -> Istanbul Curated Mock Datasets"

requirements-completed:
  - VENUE-02
  - VENUE-03
  - VENUE-04

coverage:
  - id: D1
    description: "VenueService offline fallback resolves 15-venue decks with full details across 4 Istanbul districts"
    requirement: VENUE-02
    verification:
      - kind: unit
        ref: "server/src/tests/venueService.test.ts"
        status: pass
    human_judgment: false
  - id: D2
    description: "VenueCache caches queries in-memory for 2 hours with 500m grid snapping"
    requirement: VENUE-03
    verification:
      - kind: unit
        ref: "server/src/tests/venueCache.test.ts"
        status: pass
    human_judgment: false
  - id: D3
    description: "Sponsored cards are deterministically placed at slot 2 (index 1) with 'Öne Çıkan Lezzet' badge"
    requirement: VENUE-04
    verification:
      - kind: unit
        ref: "server/src/tests/sponsoredInsertion.test.ts"
        status: pass
    human_judgment: false
  - id: D4
    description: "GET /api/districts and GET /api/venues/photo endpoints shield Google Places API key from clients"
    requirement: VENUE-02
    verification:
      - kind: unit
        ref: "server/src/tests/venueService.test.ts"
        status: pass
    human_judgment: false

duration: 12min
completed: 2026-11-08
status: complete
---

# Phase 02 Plan 01: Venue Discovery Engine & Caching Summary

**Google Places API (New) venue engine with strict field masking, 2-hour coordinate grid-snapped in-memory caching, 4-district Istanbul mock datasets, and slot-2 deterministic sponsored deck insertion.**

## Performance

- **Duration:** 12 min
- **Started:** 2026-11-08T16:21:00Z
- **Completed:** 2026-11-08T16:33:00Z
- **Tasks:** 3
- **Files modified:** 10

## Accomplishments

- **Venue Data Models & Synchronized Types:** Exported `Venue`, `District`, and `RoomLocation` models across both `server` and `client` TypeScript codebases, and extended `Room` with `location` and `venues` fields.
- **Curated Istanbul Mock Datasets:** Created 15 rich, authentic restaurant profiles for 4 Istanbul dining hubs (Kadıköy/Moda, Beşiktaş/Çarşı, Kadıköy/Caddebostan, Şişli/Nişantaşı) with real photos, ratings, price levels, and Turkish cuisine categories.
- **2-Hour In-Memory TTL Cache with Grid Snapping:** Built `VenueCache` with `lru-cache`, 7,200,000ms TTL, and `getCoordinateCacheKey` rounding coordinates to a 0.005° step grid (~500m), preventing duplicate API requests caused by GPS drift.
- **Google Places API (New) & Safe Photo Proxy:** Implemented `fetchGooglePlacesNearby` with strict `X-Goog-FieldMask` and mounted `GET /api/venues/photo` proxy on Express to completely shield `GOOGLE_PLACES_API_KEY` from client inspection.
- **Deterministic Sponsored Card Placement:** Implemented `injectSponsoredVenues` inserting primary sponsor into slot 2 (index 1) with the "Öne Çıkan Lezzet" badge and capping deck at 15 items.
- **Automated Test Suite:** Created 14 unit tests in `node:test` covering coordinate snapping, cache eviction, Places API mapping, nearest district math, and sponsored card insertion.

## Task Commits

Each task was committed atomically:

1. **Task 1: Scaffold Venue data models, Istanbul mock datasets, and REST districts endpoint** - `11240fb` (feat)
2. **Task 2: Implement in-memory VenueCache with 2-hour TTL and 500m coordinate grid snapping** - `4c773df` (feat)
3. **Task 3: Implement VenueService with Google Places API, fallback, and sponsored slot 2 insertion** - `5c69498` (feat)

## Files Created/Modified

- `server/package.json` - Added `lru-cache@^11.0.0` dependency and test script (`tsx --test src/tests/*.test.ts`).
- `server/src/types.ts` - Added `Venue`, `District`, `RoomLocation`, and extended `Room` / message types.
- `client/src/types.ts` - Synchronized `Venue`, `District`, `RoomLocation`, and `Room` types.
- `server/src/services/mockVenues.ts` - Curated datasets for 4 Istanbul dining districts and sponsored candidates.
- `server/src/services/venueCache.ts` - `VenueCache` with 2-hour TTL, max 500 entries, and `getCoordinateCacheKey`.
- `server/src/services/venueService.ts` - Places API fetcher, nearest district calculation, offline fallback, and sponsored card injector.
- `server/src/index.ts` - Mounted `GET /api/districts` and `GET /api/venues/photo` proxy endpoints.
- `server/src/tests/venueCache.test.ts` - Unit tests for coordinate snapping, TTL, and cache operations.
- `server/src/tests/venueService.test.ts` - Unit tests for coordinate validation, district fallback, and price mapping.
- `server/src/tests/sponsoredInsertion.test.ts` - Unit tests for deterministic slot 2 and slot 3 sponsored card placement.

## Decisions Made

- Configured `lru-cache` with explicit `max: 500` and `ttl: 7200000` (2 hours) to meet VENUE-03 and prevent memory leaks.
- Used coordinate snapping step of `0.005°` (~500m) to group close queries into the same cache key.
- Kept `GOOGLE_PLACES_API_KEY` strictly server-side by routing photo media through `/api/venues/photo` with a 1-day client `Cache-Control` header and CDN fallback.
- Placed sponsored restaurant at slot 2 (index 1) to build immediate trust on card 1 while ensuring 100% swipe exposure.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Type Fix] Typecast response.json() in venueService.ts**
- **Found during:** Task 3 verification
- **Issue:** TypeScript in Node 22/24 typed `response.json()` as `unknown`, causing `TS18046: 'data' is of type 'unknown'`.
- **Fix:** Explicitly cast `(await response.json()) as any;`.
- **Files modified:** `server/src/services/venueService.ts`
- **Verification:** `npm run build --workspace=server` exited with code 0.
- **Committed in:** `5c69498`

---

**Total deviations:** 1 auto-fixed (type error).
**Impact on plan:** Minor type fix required for strict TypeScript compilation. No scope creep.

## Issues Encountered

None.

## User Setup Required

None - no external API key is mandatory for local/offline testing; the service cleanly falls back to curated Istanbul mock datasets when `GOOGLE_PLACES_API_KEY` is not present. If live Google Places queries are desired, configure `GOOGLE_PLACES_API_KEY` in `server/.env`.

## Next Phase Readiness

- `VenueService` and `VenueCache` are fully verified and ready for Plan 02-02 (WebSocket room location synchronization and client Lobby district selector / GPS integration).

---
## Self-Check: PASSED
- `server/src/services/mockVenues.ts` exists: FOUND
- `server/src/services/venueCache.ts` exists: FOUND
- `server/src/services/venueService.ts` exists: FOUND
- `server/src/tests/venueCache.test.ts` exists: FOUND
- `server/src/tests/venueService.test.ts` exists: FOUND
- `server/src/tests/sponsoredInsertion.test.ts` exists: FOUND
- Commit `11240fb` exists: FOUND
- Commit `4c773df` exists: FOUND
- Commit `5c69498` exists: FOUND
- All 14 unit tests pass: PASSED
