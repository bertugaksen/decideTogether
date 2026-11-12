---
last_mapped_commit: c7f5562b7ba1bdd5b70cffe2de3f22fc3030914f
last_mapped_at: 2026-11-12
---
</Codebase Structure>
<Coding Conventions>
**Analysis Date:** 2026-11-12

## Naming Patterns

**Files:**
- **React Components:** PascalCase with `.tsx` extension. Place UI components in `client/src/components/` (e.g. `client/src/components/SwipeDeck.tsx`, `client/src/components/Lobby.tsx`, `client/src/components/VenueCard.tsx`). Sub-domain components are nested in subfolders (e.g. `client/src/components/celebration/CelebrationHeroCTA.tsx`, `client/src/components/lobby/CreateRoomCard.tsx`).
- **React Custom Hooks:** camelCase with `use` prefix in `client/src/hooks/` (e.g. `client/src/hooks/useRoomSocket.ts`, `client/src/hooks/useGeolocation.ts`).
- **Services & Managers:** camelCase with `.ts` extension (e.g. `server/src/roomManager.ts`, `server/src/services/venueService.ts`, `server/src/services/venueCache.ts`, `server/src/services/duelEngine.ts`).
- **Repositories:** camelCase with repository descriptor (e.g. `server/src/repositories/roomRepository.ts`, `server/src/repositories/memoryRoomRepository.ts`, `server/src/repositories/sqliteRoomRepository.ts`).
- **Utilities & Helpers:** camelCase with `.ts` extension (e.g. `shared/src/textUtils.ts`, `shared/src/actionLinks.ts`, `client/src/utils/soundEffects.ts`).
- **Data Contracts & Types:** `types.ts` located at the root of `src/` for each workspace (`shared/src/types.ts`, `server/src/types.ts`, `client/src/types.ts`).
- **Tests:** Name after module or feature with `.test.ts` inside `server/src/tests/` (e.g. `server/src/tests/duel.test.ts`, `server/src/tests/swipeDeck.test.ts`, `server/src/tests/roomRepository.test.ts`).
- **Ad-hoc Probes:** kebab-case in `server/` root (e.g. `server/test-probe.js`, `server/test-duel-probe.js`).

**Functions:**
- Use camelCase for all functions and class methods.
- Action/Command functions: Start with an imperative verb (e.g. `createRoom`, `joinRoom`, `leaveRoom`, `recordSwipe`, `startDuel`, `recordDuelTap`).
- Data Transformation/Formatting: Use `clean*`, `format*`, or `build*` (e.g. `cleanTurkishVenueName`, `formatPriceTier`, `buildGoogleMapsNavigationUrl`, `buildDeliveryLinks`).
- Predicate/Validation functions: Use `is*`, `has*`, or `isValid*` returning boolean (e.g. `isValidCoordinate`, `toAsciiLookupKey`).
- Factory helpers: Prefix with `create*` (e.g. `createMockSocket`, `createSampleRoom`).
- React event handlers: Prefix with `handle*` or `on*` (e.g. `handleCopyPin`, `handleWhatsAppShare`, `handleJoinSubmit`).

**Variables:**
- Use camelCase for all local variables, state variables, and object properties (e.g. `roomCode`, `currentUser`, `isGameActive`, `partnerProgress`, `connectionStatus`).
- Prefix boolean variables with `is`, `has`, or `can` (e.g. `isDeckExhausted`, `isGps`, `isSponsored`, `hasAutoJoinedRef`).
- React state setters: Use `set*` following standard React conventions (e.g. `const [inputPin, setInputPin] = useState('')`).
- Immutable module-level constants, lookup dictionaries, and regex patterns: Use `UPPER_SNAKE_CASE` (e.g. `FOOD_NICKNAMES`, `MOCK_DISTRICTS`, `MOCK_VENUES`, `STORAGE_KEY`, `VALID_PHOTO_NAME_REGEX`, `TURKISH_FOOD_TERM_CORRECTIONS`).

**Types:**
- Use PascalCase for all types, interfaces, and enums (e.g. `Room`, `Venue`, `Participant`, `DuelState`, `ClientMessage`, `ServerMessage`).
- Prefix abstract interface contracts with `I` when defining polymorphic services or repositories (e.g. `IRoomRepository` in `server/src/repositories/roomRepository.ts`, `ILogger` in `server/src/logger.ts`).
- Use `interface` for entity data structures with extensible object shapes (e.g. `interface Room`, `interface Venue`).
- Use `type` for discriminated unions, message protocols, string literal unions, and utility shapes (e.g. `type RoomStatus = 'waiting' | 'ready' | 'swiping' | 'matched' | 'duel'`, `type ClientMessage = ...`).
- Component prop types: Name after component + `Props` (e.g. `SwipeDeckProps`, `LobbyProps`, `CelebrationHeroCTAProps`, `TugOfWarBarProps`).

## Code Style

**Formatting:**
- **Indentation:** 2 spaces (no tabs).
- **Semicolons:** Always use semicolons at the end of statements (`semi: true`).
- **Quotes:** Single quotes `'...'` for strings in TypeScript and test code; double quotes `"..."` for HTML/JSX attributes (`className="..."`).
- **Line Length:** Wrap long expressions around 80-100 characters.
- **Bracket Spacing:** Single spaces inside object literals: `{ room, currentUser }`.
- **Trailing Commas:** Use trailing commas for multi-line object literals, arrays, and parameter lists.

**Linting:**
- **Compiler as Linter:** TypeScript compiler (`tsc`) serves as the strict quality gate.
- **Client Configuration (`client/tsconfig.json`):**
  - `"strict": true`
  - `"noUnusedLocals": true`
  - `"noUnusedParameters": true`
  - `"noFallthroughCasesInSwitch": true`
  - `"moduleResolution": "bundler"`
  - `"allowImportingTsExtensions": true`
- **Server and Shared Configuration (`server/tsconfig.json`, `shared/tsconfig.json`):**
  - `"target": "ES2022"`
  - `"module": "NodeNext"`
  - `"moduleResolution": "NodeNext"`
  - `"strict": true`
  - `"forceConsistentCasingInFileNames": true`

## Import Organization

**Order:**
1. **Node.js Built-in Modules:** Always use the `node:` protocol prefix.
   ```typescript
   import test from 'node:test';
   import assert from 'node:assert/strict';
   import { DatabaseSync } from 'node:sqlite';
   import { createServer } from 'node:http';
   ```
2. **Third-Party / External Dependencies:**
   ```typescript
   import React, { useState, useEffect } from 'react';
   import { WebSocket } from 'ws';
   import { motion, AnimatePresence } from 'framer-motion';
   import { Heart, X, MapPin } from 'lucide-react';
   ```
3. **Workspace Packages:**
   ```typescript
   import { Room, Venue, cleanTurkishVenueName } from '@decidetogether/shared';
   ```
4. **Internal Workspace Relative Imports:**
   ```typescript
   import { RoomManager } from './roomManager.js';
   import { VenueCard } from './components/VenueCard.js';
   import { logger } from './logger.js';
   ```
5. **Type Imports & Static Assets:**
   ```typescript
   import type { useRoomSocket } from '../hooks/useRoomSocket.js';
   import logoImg from '../assets/logo.jpg';
   ```

**Path Aliases & Extension Rules:**
- **Mandatory `.js` extension:** Because `server` and `shared` use TypeScript's `"moduleResolution": "NodeNext"`, ALL relative imports must explicitly include the `.js` extension (e.g. `import { Room } from '../types.js';`), even when referencing `.ts` source files.
- The client codebase adopts this convention for consistency (e.g. `import { useRoomSocket } from './hooks/useRoomSocket.js';`).
- **Workspace Alias:** `@decidetogether/shared` is resolved via npm workspaces. Do not use relative cross-workspace imports like `../../shared/src/...`.
- No root path aliases (`@/...`) are defined; all internal imports use explicit relative paths (`./`, `../`).

## Error Handling

**Patterns:**

1. **Service Method Result Types:**
   Methods validating operations return a status object instead of throwing:
   ```typescript
   // In server/src/roomManager.ts
   public joinRoom(
     ws: WebSocket,
     roomCode: string,
     existingUserId?: string,
     customNickname?: string
   ): { success: boolean; error?: string } {
     const room = this.repository.get(roomCode);
     if (!room) {
       this.sendTo(ws, { type: 'ERROR', message: 'Oda bulunamadı (Geçersiz PIN)' });
       return { success: false, error: 'Oda bulunamadı' };
     }
     // ...
     return { success: true };
   }
   ```

2. **WebSocket Error Transmission:**
   The server transmits `{ type: 'ERROR', message: string }` messages in Turkish so clients can display meaningful alerts directly to the user:
   ```typescript
   this.sendTo(ws, {
     type: 'ERROR',
     message: 'Oylamayı başlatmak için partnerinizin odaya katılması gerekir.',
   });
   ```

3. **REST Endpoints with Structured Logging:**
   REST route handlers wrap asynchronous logic in `try/catch`, emit structured error logs via `logger.error`, and return JSON error payloads with appropriate HTTP status codes:
   ```typescript
   // In server/src/index.ts
   app.get('/api/locations/resolve', async (req, res) => {
     try {
       const venueService = roomManager.getVenueService();
       const resolved = await venueService.resolveLocationAndVenues(districtId, coords);
       res.json({ location: resolved.location, venueCount: resolved.venues.length });
     } catch (err) {
       logger.error('Error resolving location', err, { endpoint: '/api/locations/resolve' });
       res.status(500).json({ error: 'Konum çözümlenemedi' });
     }
   });
   ```

4. **Hardware & Browser API Graceful Degradation:**
   Client features accessing vibration, web audio, or clipboard APIs wrap calls in `try/catch` and verify feature availability to ensure non-blocking operation on unsupported devices:
   ```typescript
   // In client/src/utils/soundEffects.ts
   try {
     this.initOnUserGesture();
     if (!this.ctx) return;
     // audio oscillator logic
   } catch {
     // Gracefully ignore audio errors on restricted devices
   }
   ```

## Logging

**Framework:**
- Backend uses a dedicated, centralized `Logger` class implementing `ILogger` defined in `server/src/logger.ts`, exposed as the singleton `export const logger = new Logger();`.
- Browser client minimizes console logging, relying on React error state (`error: string | null`) for UI display.

**Patterns:**
- Always pass structured metadata objects to `logger.info`, `logger.warn`, and `logger.error`:
  ```typescript
  logger.info(`Backend server running on http://localhost:${port}`);
  logger.warn('Unhandled client message', { messageType: (message as any)?.type });
  logger.error('Error proxying Google Places photo', err, { endpoint: '/api/venues/photo' });
  ```
- Formatting output: `[ISO_TIMESTAMP] [LEVEL] message {meta_json}`.
- When logging exceptions with `logger.error(msg, error, meta)`, `Error` instances automatically extract `errorMessage` and `stack`.
- Debug logging (`logger.debug`) executes only when `process.env.DEBUG` is set or `NODE_ENV === 'development'`.
- *Note:* Migrate any remaining direct `console.log` / `console.warn` occurrences in `server/src/roomManager.ts` to `logger`.

## Comments

**When to Comment:**
- **Requirement Traceability:** Include requirement IDs in comments and test names (e.g. `(ACTION-01)`, `(ACTION-02)`, `(VENUE-04)`, `(T-02-01)`, `(MOB-02)`, `(ROOM-04)`).
- **Mathematical & Algorithm Logic:** Add explanatory comments above complex calculations (e.g. Laplace smoothing in `client/src/components/TugOfWarBar.tsx`, Haversine formula in `shared/src/actionLinks.ts`, coordinate snap grid in `server/src/services/venueCache.ts`).
- **Domain & Language Rules:** Explain Turkish locale behavior, such as dotted/dotless I conversions (`toLocaleLowerCase('tr-TR')`) and food term normalization in `shared/src/textUtils.ts`.

**JSDoc/TSDoc:**
- Use JSDoc block comments (`/** ... */`) on all exported utilities, service class methods, interface definitions, and component headers.
- Document edge cases, assumptions, and coordinate systems:
  ```typescript
  /**
   * Calculates Haversine distance in kilometers between two geographic coordinates,
   * rounded to 1 decimal place (ACTION-01).
   */
  export function calculateDistanceKm(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
  ): number
  ```

## Function Design

**Size:**
- Keep functions small and focused on a single concern.
- Extract complex UI components into modular subcomponents (e.g. `CelebrationHeroCTA.tsx`, `CelebrationPillGrid.tsx`, `CelebrationVenueCard.tsx`).
- Pure utility functions should not exceed 30 lines.

**Parameters:**
- Functions with more than 2-3 arguments must use a typed options/parameter object or interface:
  ```typescript
  export function buildGoogleMapsNavigationUrl(
    venue: Pick<Venue, 'id' | 'name' | 'address' | 'location' | 'googleMapsUrl'>,
    _originCoords?: { lat: number; lng: number }
  ): string
  ```
- React components take a single typed props interface (`React.FC<Props>`).

**Return Values:**
- Use explicit return types for library functions, service methods, and repository operations.
- Return early (guard clauses) for input validation:
  ```typescript
  export function sanitizePhoneUri(phone?: string): string | null {
    if (!phone || typeof phone !== 'string') return null;
    const cleaned = phone.replace(/[^0-9+]/g, '');
    const digitCount = cleaned.replace(/\D/g, '').length;
    if (digitCount < 7 || digitCount > 15) return null;
    return `tel:${cleaned}`;
  }
  ```

## Module Design

**Exports:**
- Use **named exports** for components, utilities, classes, and types (e.g. `export const SwipeDeck`, `export class RoomManager`, `export function calculateDistanceKm`).
- Default exports are used only for primary entry points:
  - `export default App;` in `client/src/App.tsx`.
  - `export default defineConfig(...)` in `client/vite.config.ts`.

**Barrel Files:**
- `shared/src/index.ts` is the official barrel file for `@decidetogether/shared`, exporting types, text helpers, action links, and photo utilities.
- `client/src/utils/actionLinks.ts` re-exports shared functions for client convenience:
  ```typescript
  export * from '@decidetogether/shared';
  ```
- Do not create deep nested barrel files inside component folders; import components directly from their file paths.

---

*Convention analysis: 2026-11-12*
