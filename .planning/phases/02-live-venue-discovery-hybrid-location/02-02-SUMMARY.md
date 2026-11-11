---
phase: 02-live-venue-discovery-hybrid-location
plan: 02
subsystem: ui-api
tags: [websockets, real-time-sync, geolocation, district-selector, lobby, warm-editorial-minimal]

# Dependency graph
requires:
  - phase: 02-01
    provides: VenueService, VenueCache, Google Places fetcher, Istanbul curated datasets, and sponsored slot-2 insertion
provides:
  - SET_LOCATION WebSocket event handler and synchronized multi-peer deck broadcasting
  - useGeolocation hook with 8-second timeout guard and Turkish error mapping
  - Warm Editorial Minimal DistrictSelector bottom sheet modal component
  - Interactive Lobby district chip and live 15-venue deck preview
  - Multi-client automated location & deck synchronization probe (server/test-location-probe.js)
affects: [03-swiping-engine]

# Actuals (#2632)
actuals:
  tokens: 14500
  tasks: 3
  commits: 3
plan_head_before: f7ea185613f5997736889dd4fb6f46c0b24e309a
plan_head_after: 9e605ed77f6e2478babe91adc224c96cee3e7404

# Tech tracking
tech-stack:
  added: []
  patterns: [real-time room deck synchronization, battery-safe geolocation with timeout guard, Warm Editorial bottom sheet modal, threat-model input sanitization]

key-files:
  created:
    - client/src/hooks/useGeolocation.ts
    - client/src/components/DistrictSelector.tsx
    - server/test-location-probe.js
  modified:
    - server/src/roomManager.ts
    - server/src/index.ts
    - server/src/types.ts
    - client/src/types.ts
    - client/src/hooks/useRoomSocket.ts
    - client/src/components/Lobby.tsx

key-decisions:
  - "Default room initialization now resolves initial 15-venue deck for Kadıköy/Moda at creation so participants have cards ready instantly"
  - "Input sanitization: Whitelisted districtId against known districts (T-02-03) and enforced finite geographic bounds on coordinates (-90..90, -180..180) (T-02-04)"
  - "Configured useGeolocation with enableHighAccuracy: false, timeout: 8000ms, and maximumAge: 300000ms to eliminate battery drain and stall risks"
  - "DistrictSelector modal adopts Warm Editorial Minimal styling (#FBF9F5 canvas, #E7E2D9 border, #D9381E primary, #1C1917 charcoal, #2D6A4F basil) matching Lobby aesthetics"

patterns-established:
  - "Peer Deck Synchronization: Any room participant can trigger location changes, broadcasting identical venue deck sequence in real time"
  - "Hybrid Location UX: Seamless dual path allowing one-tap GPS coordinate capture with graceful fallback to preset culinary districts"

requirements-completed:
  - VENUE-01
  - VENUE-02
  - VENUE-03
  - VENUE-04

coverage:
  - id: D1
    description: "SET_LOCATION WebSocket event resolves location/venues and broadcasts synchronized ROOM_STATE to all peers"
    requirement: VENUE-01
    verification:
      - kind: integration
        ref: "server/test-location-probe.js"
        status: pass
    human_judgment: false
  - id: D2
    description: "Both room participants hold the identical 15-venue deck in the same sequence with slot 2 sponsor"
    requirement: VENUE-04
    verification:
      - kind: integration
        ref: "server/test-location-probe.js"
        status: pass
    human_judgment: false
  - id: D3
    description: "useGeolocation hook captures GPS coordinates with 8s timeout guard and Turkish error translations"
    requirement: VENUE-01
    verification:
      - kind: unit
        ref: "client/src/hooks/useGeolocation.ts"
        status: pass
    human_judgment: false
  - id: D4
    description: "DistrictSelector and Lobby render Warm Editorial Minimal design tokens with live deck preview"
    requirement: VENUE-01
    verification:
      - kind: build
        ref: "npm run build --workspace=client"
        status: pass
    human_judgment: false

duration: 15min
completed: 2026-11-08
status: complete
---

# Phase 02 Plan 02: Hybrid Location UI & Real-Time Deck Synchronization Summary

**Real-time WebSocket room location synchronization, battery-safe useGeolocation hook with 8s timeout, Warm Editorial Minimal DistrictSelector modal, and dynamic Lobby deck preview.**

## Performance

- **Duration:** 15 min
- **Started:** 2026-11-08T16:32:00Z
- **Completed:** 2026-11-08T16:47:00Z
- **Tasks:** 3
- **Files modified/created:** 9

## Accomplishments

- **Tracer WebSocket Event (`SET_LOCATION`):** Integrated `VenueService` into `RoomManager`. Room creation automatically provisions a 15-venue deck for Kadıköy/Moda. Implemented `setLocation` with `T-02-03` district whitelisting and `T-02-04` coordinate bounds checking, broadcasting synchronized `ROOM_STATE` to all room participants.
- **Client `useGeolocation` Hook:** Created a resilient browser geolocation wrapper with `enableHighAccuracy: false`, `timeout: 8000ms`, and `maximumAge: 300000ms`, preventing battery drain and indoor stalls while mapping error codes to clear Turkish feedback.
- **Warm Editorial Minimal `DistrictSelector`:** Built a responsive bottom sheet modal using the design system tokens (`#FBF9F5` canvas, `#E7E2D9` border, `#D9381E` primary, `#1C1917` charcoal, `#2D6A4F` basil) supporting 1-tap GPS resolution and 4 preset Istanbul culinary districts with cuisine tags and active checkmarks.
- **Live Lobby Integration:** Updated Lobby hero section with an interactive location chip and transformed the 'Seçki Havuzu' card to dynamically reflect the active district label and ready venue count (`room.venues.length`).
- **Multi-Peer Synchronization Probe:** Built `server/test-location-probe.js` which verifies host creation, peer join, district changes, GPS updates, and threat mitigations, ensuring both clients receive the identical 15-venue sequence in real time.

## Task Commits

Each task was committed atomically:

1. **Task 1: Tracer slice: Wire SET_LOCATION WebSocket event and verify multi-peer deck synchronization** - `bec706e` (feat)
2. **Task 2: Implement client useGeolocation hook and DistrictSelector modal component** - `88be1ee` (feat)
3. **Task 3: Integrate setLocation in useRoomSocket and update Lobby with live district selection and deck preview** - `9e605ed` (feat)

## Files Created/Modified

- `server/src/roomManager.ts` - Instantiated VenueService, updated createRoom to initialize default deck, added setLocation with input validation and ROOM_STATE broadcast.
- `server/src/index.ts` - Added SET_LOCATION case to WebSocket message dispatcher.
- `server/src/types.ts` & `client/src/types.ts` - Added room payload to ROOM_CREATED server message.
- `server/test-location-probe.js` - Automated multi-peer WebSocket integration probe testing real-time location and deck synchronization.
- `client/src/hooks/useGeolocation.ts` - Geolocation hook with 8-second timeout, error state management, and Turkish error feedback.
- `client/src/components/DistrictSelector.tsx` - Responsive modal bottom sheet for district and GPS location selection.
- `client/src/hooks/useRoomSocket.ts` - Added setLocation action and updated room state on ROOM_STATE / LOCATION_UPDATED.
- `client/src/components/Lobby.tsx` - Interactive location trigger in hero section, dynamic deck preview banner, and DistrictSelector modal integration.

## Decisions Made

- Added `room` to `ROOM_CREATED` server message so host receives initial location and venue deck immediately upon room creation.
- Set `timeout: 8000ms` on browser GPS requests to avoid hanging indefinitely in poor reception environments.
- Implemented T-02-03 and T-02-04 mitigations directly in `RoomManager.setLocation` by whitelisting district IDs against `MOCK_DISTRICTS` and validating coordinates as finite numbers within -90..90 and -180..180 ranges.

## Deviations from Plan

None - plan executed exactly as written.

## Self-Check: PASSED
- `server/src/roomManager.ts` exists: FOUND
- `server/src/index.ts` exists: FOUND
- `client/src/hooks/useGeolocation.ts` exists: FOUND
- `client/src/components/DistrictSelector.tsx` exists: FOUND
- `client/src/hooks/useRoomSocket.ts` exists: FOUND
- `client/src/components/Lobby.tsx` exists: FOUND
- `server/test-location-probe.js` exists: FOUND
- Commit `bec706e` exists: FOUND
- Commit `88be1ee` exists: FOUND
- Commit `9e605ed` exists: FOUND
- `npm run build` passes: PASSED
- `node server/test-location-probe.js` passes: PASSED
- All 14 server unit tests pass: PASSED
