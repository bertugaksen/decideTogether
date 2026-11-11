# Phase 02: Live Venue Discovery & Hybrid Location - Pattern Map

**Mapped:** 2026-11-08  
**Files analyzed:** 14  
**Analogs found:** 14 / 14 (100% codebase coverage)  

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `server/src/types.ts` | model | request-response | `server/src/types.ts` | exact |
| `server/src/roomManager.ts` | service | event-driven | `server/src/roomManager.ts` | exact |
| `server/src/index.ts` | controller | request-response / streaming | `server/src/index.ts` | exact |
| `server/src/services/venueService.ts` | service | transform / request-response | `server/src/roomManager.ts` | role-match |
| `server/src/services/mockVenues.ts` | model / data | batch / transform | `server/src/roomManager.ts` | role-match |
| `server/src/tests/venueService.test.ts` | test | request-response | `server/test-probe.js` | role-match |
| `server/src/tests/venueCache.test.ts` | test | batch / transform | `server/test-probe.js` | role-match |
| `server/src/tests/sponsoredInsertion.test.ts` | test | transform | `server/test-probe.js` | role-match |
| `server/test-location-probe.js` | test (probe) | event-driven | `server/test-probe.js` | exact |
| `client/src/types.ts` | model | request-response | `client/src/types.ts` | exact |
| `client/src/hooks/useGeolocation.ts` | hook | event-driven / request-response | `client/src/hooks/useRoomSocket.ts` | role-match |
| `client/src/hooks/useRoomSocket.ts` | hook | event-driven / streaming | `client/src/hooks/useRoomSocket.ts` | exact |
| `client/src/components/DistrictSelector.tsx` | component | request-response / event-driven | `client/src/components/Lobby.tsx` | role-match |
| `client/src/components/Lobby.tsx` | component | event-driven / request-response | `client/src/components/Lobby.tsx` | exact |

---

## Pattern Assignments

### `server/src/types.ts` (model, request-response)

**Analog:** `server/src/types.ts`  
**Match Quality:** exact

**Imports pattern:**
No imports needed (pure TypeScript interface declarations).

**Core Type Definitions pattern** (`server/src/types.ts:1-20`):
```typescript
export interface Participant {
  id: string;
  nickname: string;
  role: 'host' | 'peer';
  connected: boolean;
  disconnectedAt?: number;
}

export type RoomStatus = 'waiting' | 'ready' | 'swiping' | 'matched' | 'duel';

export interface Room {
  code: string; // 4-digit numeric PIN
  hostId: string;
  peerId?: string;
  status: RoomStatus;
  participants: Record<string, Participant>;
  createdAt: number;
  lastActiveAt: number;
  // Phase 2 extension:
  location?: RoomLocation;
  venues?: Venue[];
}
```

**Discriminated Union pattern for WebSocket Messages** (`server/src/types.ts:21-40`):
```typescript
// Client -> Server Message Types
export type ClientMessage =
  | { type: 'CREATE_ROOM'; nickname?: string }
  | { type: 'JOIN_ROOM'; roomCode: string; userId?: string; nickname?: string }
  | { type: 'UPDATE_NICKNAME'; nickname: string }
  | { type: 'SET_LOCATION'; districtId?: string; coords?: { lat: number; lng: number } }
  | { type: 'LEAVE_ROOM' }
  | { type: 'START_SWIPING' }
  | { type: 'PING' };

// Server -> Client Message Types
export type ServerMessage =
  | { type: 'ROOM_CREATED'; roomCode: string; user: Participant }
  | { type: 'ROOM_JOINED'; room: Room; user: Participant }
  | { type: 'ROOM_STATE'; room: Room }
  | { type: 'LOCATION_UPDATED'; location: RoomLocation; venues: Venue[] }
  | { type: 'PEER_JOINED'; participant: Participant }
  | { type: 'PEER_DISCONNECTED'; userId: string; reconnectDeadlineMs: number }
  | { type: 'PEER_RECONNECTED'; participant: Participant }
  | { type: 'ROOM_READY'; roomCode: string }
  | { type: 'PONG' }
  | { type: 'ERROR'; message: string };
```

---

### `server/src/services/venueService.ts` (service, transform / request-response)

**Analog:** `server/src/roomManager.ts`  
**Match Quality:** role-match

**Imports pattern** (`server/src/roomManager.ts:1-3`):
```typescript
import { LRUCache } from 'lru-cache';
import { Venue, District, RoomLocation } from '../types.js';
import { MOCK_DISTRICTS, MOCK_VENUES, SPONSORED_CANDIDATES } from './mockVenues.js';
```
*(Notice `.js` extension for local relative imports required by `NodeNext`)*

**Class & Cache state pattern** (`server/src/roomManager.ts:20-24`):
```typescript
export class VenueService {
  private cache: LRUCache<string, Venue[]>;
  private apiKey?: string;

  constructor(apiKey = process.env.GOOGLE_PLACES_API_KEY) {
    this.apiKey = apiKey;
    this.cache = new LRUCache<string, Venue[]>({
      max: 500,
      ttl: 2 * 60 * 60 * 1000, // 2-hour TTL (VENUE-03)
    });
  }
}
```

**Coordinate Snapping & Cache Key helper** (`02-RESEARCH.md:404-410`):
```typescript
export function getCoordinateCacheKey(lat: number, lng: number): string {
  const step = 0.005;
  const snappedLat = (Math.round(lat / step) * step).toFixed(3);
  const snappedLng = (Math.round(lng / step) * step).toFixed(3);
  return `geo:${snappedLat},${snappedLng}`;
}
```

**Places API (New) Field-Masked Fetcher & Error Handling** (`02-RESEARCH.md:297-382`):
```typescript
const GOOGLE_PLACES_NEARBY_URL = 'https://places.googleapis.com/v1/places:searchNearby';

export async function fetchGooglePlacesNearby(
  lat: number,
  lng: number,
  apiKey: string,
  radiusMeters = 1500
): Promise<Venue[]> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000); // 6s timeout

  try {
    const response = await fetch(GOOGLE_PLACES_NEARBY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': [
          'places.id',
          'places.displayName',
          'places.formattedAddress',
          'places.location',
          'places.rating',
          'places.userRatingCount',
          'places.priceLevel',
          'places.photos',
          'places.primaryTypeDisplayName',
          'places.currentOpeningHours.openNow',
        ].join(','),
      },
      body: JSON.stringify({
        includedTypes: ['restaurant', 'cafe', 'fast_food_restaurant', 'bakery'],
        maxResultCount: 15,
        rankPreference: 'POPULARITY',
        locationRestriction: {
          circle: {
            center: { latitude: lat, longitude: lng },
            radius: radiusMeters,
          },
        },
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    if (!response.ok) {
      console.warn(`[VenueService] Google Places API HTTP ${response.status}`);
      return [];
    }

    const data = await response.json();
    if (!data.places || !Array.isArray(data.places)) return [];

    return data.places.map((p: any): Venue => ({
      id: `gplace_${p.id}`,
      name: p.displayName?.text || 'Bilinmeyen Restoran',
      category: p.primaryTypeDisplayName?.text || 'Restoran & Cafe',
      rating: p.rating || 4.5,
      reviewCount: p.userRatingCount || 100,
      priceLevel: mapPriceLevel(p.priceLevel),
      address: p.formattedAddress || 'İstanbul',
      location: {
        lat: p.location?.latitude || lat,
        lng: p.location?.longitude || lng,
      },
      photoUrl: p.photos?.[0]?.name
        ? `/api/venues/photo?name=${encodeURIComponent(p.photos[0].name)}`
        : 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80',
      isOpenNow: p.currentOpeningHours?.openNow ?? true,
    }));
  } catch (err) {
    clearTimeout(timeoutId);
    console.error('[VenueService] Failed to fetch Places API, falling back to mock:', err);
    return [];
  }
}
```

**Deterministic Top-3 Sponsored Card Insertion** (`02-RESEARCH.md:422-451`):
```typescript
export function injectSponsoredVenues(organicVenues: Venue[], sponsoredCandidates: Venue[]): Venue[] {
  if (!sponsoredCandidates || sponsoredCandidates.length === 0) {
    return organicVenues;
  }
  const result = [...organicVenues];
  const primary = sponsoredCandidates[0];
  const secondary = sponsoredCandidates[1];

  if (primary) {
    result.splice(1, 0, primary); // Slot 2 (index 1)
  }
  if (secondary && result.length >= 3) {
    result.splice(2, 0, secondary); // Slot 3 (index 2)
  }
  return result.slice(0, 15);
}
```

---

### `server/src/services/mockVenues.ts` (model / data, batch / transform)

**Analog:** `server/src/roomManager.ts:4-12`  
**Match Quality:** role-match

**Imports pattern:**
```typescript
import { District, Venue } from '../types.js';
```

**Constant Data Export pattern** (`server/src/roomManager.ts:4-12`):
```typescript
export const MOCK_DISTRICTS: District[] = [
  {
    id: 'kadikoy-moda',
    name: 'Kadıköy, Moda',
    city: 'İstanbul',
    center: { lat: 40.9856, lng: 29.0270 },
    sampleCuisines: ['Pizza & Şarap', 'Sokak Lezzetleri', 'Burger & Bira'],
  },
  {
    id: 'besiktas-carsi',
    name: 'Beşiktaş, Çarşı',
    city: 'İstanbul',
    center: { lat: 41.0428, lng: 29.0077 },
    sampleCuisines: ['Sokak Lezzetleri', 'Meyhane & Balık', 'Döner & Kebap'],
  },
  {
    id: 'kadikoy-caddebostan',
    name: 'Kadıköy, Caddebostan',
    city: 'İstanbul',
    center: { lat: 40.9634, lng: 29.0617 },
    sampleCuisines: ['Dünya Mutfağı', 'Sushi & Asya', 'İtalyan'],
  },
  {
    id: 'sisli-nisantasi',
    name: 'Şişli, Nişantaşı',
    city: 'İstanbul',
    center: { lat: 41.0526, lng: 28.9945 },
    sampleCuisines: ['Brunch & Kahve', 'Fine Dining', 'İtalyan Makarnası'],
  },
];

export const MOCK_VENUES: Record<string, Venue[]> = {
  'kadikoy-moda': [ /* 15 curated high-res food venues */ ],
  'besiktas-carsi': [ /* 15 curated venues */ ],
  'kadikoy-caddebostan': [ /* 15 curated venues */ ],
  'sisli-nisantasi': [ /* 15 curated venues */ ],
};

export const SPONSORED_CANDIDATES: Venue[] = [
  {
    id: 'spon_moda_01',
    name: 'Moda Bostanı Pizzeria',
    category: 'Odun Ateşinde Pizza',
    rating: 4.9,
    reviewCount: 420,
    priceLevel: 2,
    address: 'Caferağa Mah. Moda Cad. No:44, Kadıköy',
    location: { lat: 40.9842, lng: 29.0285 },
    photoUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80',
    isSponsored: true,
    sponsorBadge: 'Öne Çıkan Lezzet',
    sponsorPromoText: 'DecideTogether misafirlerine özel tatlı ikramı 🍰',
    isOpenNow: true,
  },
];
```

---

### `server/src/roomManager.ts` (service, event-driven)

**Analog:** `server/src/roomManager.ts`  
**Match Quality:** exact

**Imports pattern** (`server/src/roomManager.ts:1-3`):
```typescript
import { WebSocket } from 'ws';
import { Room, Participant, ServerMessage, RoomLocation } from './types.js';
import { VenueService } from './services/venueService.js';
```

**Service Dependency Injection & Room Default Initialization** (`server/src/roomManager.ts:20-24, 40-73`):
```typescript
export class RoomManager {
  private rooms: Map<string, Room> = new Map();
  private clients: Map<WebSocket, ConnectedClient> = new Map();
  private disconnectTimeouts: Map<string, NodeJS.Timeout> = new Map();
  private venueService: VenueService = new VenueService();

  // In createRoom:
  const defaultDistrict = 'kadikoy-moda';
  const initialDeck = await this.venueService.getVenuesForDistrict(defaultDistrict);
  room.location = { districtId: defaultDistrict, label: 'Kadıköy, Moda' };
  room.venues = initialDeck;
```

**State Update & Broadcast Pattern** (`server/src/roomManager.ts:222-251`):
```typescript
public async setLocation(
  ws: WebSocket,
  districtId?: string,
  coords?: { lat: number; lng: number }
): Promise<void> {
  const client = this.clients.get(ws);
  if (!client) return;
  const room = this.rooms.get(client.roomCode);
  if (!room) return;

  const resolved = await this.venueService.resolveLocationAndVenues(districtId, coords);
  room.location = resolved.location;
  room.venues = resolved.venues;
  room.lastActiveAt = Date.now();

  // Broadcast to all clients in room
  this.broadcastToRoom(client.roomCode, {
    type: 'ROOM_STATE',
    room,
  });
}
```

---

### `server/src/index.ts` (controller, request-response / streaming)

**Analog:** `server/src/index.ts`  
**Match Quality:** exact

**REST Controller pattern** (`server/src/index.ts:16-32`):
```typescript
// REST Health Check & Districts
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'decidetogether-backend', timestamp: Date.now() });
});

app.get('/api/districts', (req, res) => {
  res.json({ districts: MOCK_DISTRICTS });
});

// Photo Proxy Endpoint (VENUE-02 - protects GOOGLE_PLACES_API_KEY)
app.get('/api/venues/photo', async (req, res) => {
  const photoName = req.query.name as string;
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;

  if (!photoName || !apiKey) {
    return res.redirect('https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80');
  }

  const googlePhotoUrl = `https://places.googleapis.com/v1/${photoName}/media?maxHeightPx=600&maxWidthPx=800&key=${apiKey}`;
  try {
    const photoRes = await fetch(googlePhotoUrl);
    if (!photoRes.ok) {
      return res.redirect('https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80');
    }
    res.setHeader('Cache-Control', 'public, max-age=86400');
    res.setHeader('Content-Type', photoRes.headers.get('content-type') || 'image/jpeg');
    const arrayBuffer = await photoRes.arrayBuffer();
    return res.send(Buffer.from(arrayBuffer));
  } catch (err) {
    console.error('Error proxying photo:', err);
    return res.redirect('https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80');
  }
});
```

**WebSocket Dispatch Switch-Case pattern** (`server/src/index.ts:43-73`):
```typescript
switch (message.type) {
  case 'CREATE_ROOM':
    await roomManager.createRoom(ws, message.nickname);
    break;

  case 'JOIN_ROOM':
    roomManager.joinRoom(ws, message.roomCode, message.userId, message.nickname);
    break;

  case 'SET_LOCATION':
    await roomManager.setLocation(ws, message.districtId, message.coords);
    break;

  case 'UPDATE_NICKNAME':
    roomManager.updateNickname(ws, message.nickname);
    break;

  case 'PING':
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'PONG' }));
    }
    break;
```

---

### `server/test-location-probe.js` (test/probe, event-driven)

**Analog:** `server/test-probe.js`  
**Match Quality:** exact

**Imports & Runner pattern** (`server/test-probe.js:1-15`):
```javascript
import { WebSocket } from 'ws';
import assert from 'node:assert';

async function runTest() {
  console.log('--- Starting Location & Deck Synchronization Probe ---');

  const wsA = new WebSocket('ws://localhost:3001/ws');
  await new Promise((resolve) => wsA.on('open', resolve));
```

**WebSocket Multi-peer Synchronized Event Assertion** (`server/test-probe.js:36-69`):
```javascript
  // Host changes location to Beşiktaş
  const peerStatePromise = new Promise((resolve) => {
    wsB.on('message', (data) => {
      const msg = JSON.parse(data.toString());
      if (msg.type === 'ROOM_STATE' && msg.room.location?.districtId === 'besiktas-carsi') {
        resolve(msg);
      }
    });
  });

  wsA.send(JSON.stringify({
    type: 'SET_LOCATION',
    districtId: 'besiktas-carsi',
  }));

  const updatedMsg = await peerStatePromise;
  assert.strictEqual(updatedMsg.room.location.districtId, 'besiktas-carsi');
  assert.ok(Array.isArray(updatedMsg.room.venues));
  assert.ok(updatedMsg.room.venues.length >= 10);
  console.log('✓ Host SET_LOCATION broadcasted identical venue deck to Peer');

  // Verify deterministic sponsored badge
  const sponsored = updatedMsg.room.venues.find(v => v.isSponsored);
  assert.ok(sponsored, 'Should have at least 1 sponsored venue');
  console.log(`✓ Sponsored venue detected: ${sponsored.name} (${sponsored.sponsorBadge})`);
```

---

### `server/src/tests/venueService.test.ts` & `venueCache.test.ts` & `sponsoredInsertion.test.ts` (test, unit)

**Analog:** `server/test-probe.js`  
**Match Quality:** role-match

**Test runner structure** (`server/test-probe.js:103-111`):
```typescript
import test from 'node:test';
import assert from 'node:assert/strict';
import { VenueService, getCoordinateCacheKey, injectSponsoredVenues } from '../services/venueService.js';
import { MOCK_DISTRICTS } from '../services/mockVenues.js';

test('getCoordinateCacheKey rounds coordinates to ~500m grid', () => {
  const key1 = getCoordinateCacheKey(40.98561, 29.02704);
  const key2 = getCoordinateCacheKey(40.98580, 29.02720); // ~20m drift
  assert.strictEqual(key1, key2);
  assert.strictEqual(key1, 'geo:40.985,29.025');
});

test('injectSponsoredVenues inserts sponsored card at slot 2', () => {
  const organic = Array.from({ length: 14 }, (_, i) => ({ id: `org_${i}`, name: `Venue ${i}` } as any));
  const sponsored = [{ id: 'spon_1', name: 'Sponsored Pizza', isSponsored: true } as any];

  const deck = injectSponsoredVenues(organic, sponsored);
  assert.strictEqual(deck[1].id, 'spon_1');
  assert.strictEqual(deck[1].isSponsored, true);
  assert.strictEqual(deck.length, 15);
});
```

---

### `client/src/types.ts` (model, request-response)

**Analog:** `client/src/types.ts`  
**Match Quality:** exact

**Imports & Sync pattern** (`client/src/types.ts:1-46`):
```typescript
export interface Venue {
  id: string;
  name: string;
  category: string;
  rating: number;
  reviewCount: number;
  priceLevel: 1 | 2 | 3 | 4;
  address: string;
  location: { lat: number; lng: number };
  photoUrl: string;
  photos?: string[];
  isSponsored?: boolean;
  sponsorBadge?: string;
  sponsorPromoText?: string;
  isOpenNow?: boolean;
}

export interface District {
  id: string;
  name: string;
  city: string;
  center: { lat: number; lng: number };
  sampleCuisines: string[];
}

export interface RoomLocation {
  districtId: string;
  label: string;
  coords?: { lat: number; lng: number };
  isGps?: boolean;
}

// Extends Room:
export interface Room {
  code: string;
  hostId: string;
  peerId?: string;
  status: RoomStatus;
  participants: Record<string, Participant>;
  createdAt: number;
  lastActiveAt: number;
  location?: RoomLocation;
  venues?: Venue[];
}
```

---

### `client/src/hooks/useGeolocation.ts` (hook, event-driven / request-response)

**Analog:** `client/src/hooks/useRoomSocket.ts`  
**Match Quality:** role-match

**Hook signature & State pattern** (`client/src/hooks/useRoomSocket.ts:6-18`):
```typescript
import { useState, useCallback } from 'react';
import { RoomLocation } from '../types.js';

export function useGeolocation(onLocationResolved: (loc: RoomLocation) => void) {
  const [isLoading, setIsLoading] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  const requestGps = useCallback(() => {
    if (!navigator.geolocation) {
      setGeoError('Tarayıcınız konum servisini desteklemiyor.');
      return;
    }

    setIsLoading(true);
    setGeoError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLoading(false);
        const { latitude, longitude } = pos.coords;
        onLocationResolved({
          districtId: 'gps',
          label: 'Mevcut Konumum (GPS)',
          coords: { lat: latitude, lng: longitude },
          isGps: true,
        });
      },
      (err) => {
        setIsLoading(false);
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setGeoError('Konum izni verilmedi. Lütfen listeden semt seçin.');
            break;
          case err.POSITION_UNAVAILABLE:
            setGeoError('Konum bilgisine ulaşılamadı.');
            break;
          case err.TIMEOUT:
            setGeoError('Konum isteği zaman aşımına uğradı.');
            break;
          default:
            setGeoError('Konum alınırken bir hata oluştu.');
        }
      },
      {
        enableHighAccuracy: false, // Prevents battery drain and indoor stalls
        timeout: 8000,              // 8s timeout prevents hang
        maximumAge: 300000,         // Cache up to 5 min
      }
    );
  }, [onLocationResolved]);

  return { requestGps, isLoading, geoError };
}
```

---

### `client/src/hooks/useRoomSocket.ts` (hook, event-driven / streaming)

**Analog:** `client/src/hooks/useRoomSocket.ts`  
**Match Quality:** exact

**Message Dispatcher method pattern** (`client/src/hooks/useRoomSocket.ts:218-242`):
```typescript
// New action in useRoomSocket:
const setLocation = useCallback((districtId?: string, coords?: { lat: number; lng: number }) => {
  send({
    type: 'SET_LOCATION',
    districtId,
    coords,
  });
}, [send]);

return {
  room,
  currentUser,
  peer,
  connectionStatus,
  error,
  peerDisconnectSeconds,
  createRoom,
  joinRoom,
  updateNickname,
  leaveRoom,
  setLocation, // Exposed to Lobby and DistrictSelector
};
```

---

### `client/src/components/DistrictSelector.tsx` (component, request-response / event-driven)

**Analog:** `client/src/components/Lobby.tsx`  
**Match Quality:** role-match

**Imports pattern** (`client/src/components/Lobby.tsx:1-4`):
```typescript
import React, { useState } from 'react';
import { MapPin, Navigation, Check, X, Sparkles, AlertCircle } from 'lucide-react';
import { District, RoomLocation } from '../types.js';
import { useGeolocation } from '../hooks/useGeolocation.js';
```

**Card & Chip styling pattern** (`client/src/components/Lobby.tsx:103-105, 145-177`):
```tsx
// Using Warm Editorial Minimal palette:
// Cream background: #FBF9F5, Border: #E7E2D9, Terracotta: #E07A5F, Paprika Red: #D9381E, Dark Charcoal: #1C1917
<div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4">
  <div className="w-full max-w-md bg-[#FBF9F5] rounded-t-3xl sm:rounded-2xl border border-[#E7E2D9] p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
    {/* Header */}
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        <MapPin className="w-5 h-5 text-[#D9381E]" />
        <h3 className="font-display font-bold text-lg text-[#1C1917]">Bölge / Semt Seç</h3>
      </div>
      <button onClick={onClose} className="p-1 rounded-full text-[#78716C] hover:bg-[#FAF7F2]">
        <X className="w-5 h-5" />
      </button>
    </div>

    {/* GPS Quick Action Button */}
    <button
      onClick={requestGps}
      disabled={isLoading}
      className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-white border border-[#E7E2D9] hover:border-[#D9381E] text-[#1C1917] font-semibold text-sm transition-all shadow-xs"
    >
      <Navigation className={`w-4 h-4 text-[#D9381E] ${isLoading ? 'animate-spin' : ''}`} />
      <span>{isLoading ? 'Konum Alınıyor...' : 'Mevcut Konumumu Kullan (GPS)'}</span>
    </button>

    {/* District Chips */}
    <div className="space-y-2 pt-2">
      <p className="text-xs font-bold uppercase tracking-wider text-[#78716C]">Popüler Yeme-İçme Semtleri</p>
      {districts.map((d) => (
        <button
          key={d.id}
          onClick={() => onSelectDistrict(d.id)}
          className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-center justify-between ${
            selectedDistrictId === d.id
              ? 'bg-[#FDF2F0] border-[#D9381E] text-[#1C1917]'
              : 'bg-white border-[#E7E2D9] hover:bg-[#FAF7F2] text-[#1C1917]'
          }`}
        >
          <div>
            <p className="font-bold text-sm">{d.name}</p>
            <p className="text-xs text-[#78716C]">{d.sampleCuisines.join(' • ')}</p>
          </div>
          {selectedDistrictId === d.id && <Check className="w-4 h-4 text-[#D9381E]" />}
        </button>
      ))}
    </div>
  </div>
</div>
```

---

### `client/src/components/Lobby.tsx` (component, event-driven / request-response)

**Analog:** `client/src/components/Lobby.tsx`  
**Match Quality:** exact

**Location Chip Click handler pattern** (`client/src/components/Lobby.tsx:101-118`):
```tsx
{/* Interactive Location Badge */}
<button
  onClick={() => setIsDistrictSelectorOpen(true)}
  className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-white border border-[#E7E2D9] hover:border-[#D9381E] text-[#1C1917] transition-all shadow-2xs active:scale-95"
>
  <MapPin className="w-3.5 h-3.5 text-[#D9381E]" />
  <span>{room?.location?.label || 'Kadıköy, Moda'}</span>
  <span className="text-[10px] text-[#78716C] ml-0.5">▼ Değiştir</span>
</button>
```

**Selection Pool Preview Banner with dynamic room data** (`client/src/components/Lobby.tsx:270-284`):
```tsx
{/* Dynamic Venue Pool Preview */}
<div className="bg-[#FAF7F2] rounded-xl border border-[#E7E2D9] p-3.5 flex items-center justify-between">
  <div className="flex items-center gap-3">
    <span className="text-2xl">🍕</span>
    <div>
      <p className="text-[10px] font-bold uppercase tracking-wider text-[#D9381E]">
        SEÇKİ HAVUZU
      </p>
      <p className="text-xs font-bold text-[#1C1917]">
        {room?.location?.label || 'Moda & Kadıköy'} Lezzetleri
      </p>
      <p className="text-[11px] text-[#78716C]">
        {room?.venues ? `${room.venues.length} mekan oylamaya hazır` : 'Mekanlar hazırlanıyor...'}
      </p>
    </div>
  </div>
  <Sparkles className="w-4 h-4 text-[#E07A5F]" />
</div>
```

---

## Shared Patterns

### 1. Module Imports & Extension Conventions (ESM in TypeScript)
**Source:** `server/src/index.ts:1-6`, `client/src/App.tsx:1-3`  
**Apply to:** All new `.ts` and `.tsx` files in both server and client  
```typescript
// Rule: Every internal relative import MUST specify the .js extension!
import { Room, Venue, District } from '../types.js';
import { VenueService } from './services/venueService.js';
import { useGeolocation } from '../hooks/useGeolocation.js';
```

### 2. WebSocket Discriminated Union Event Dispatching
**Source:** `server/src/types.ts:21-40`, `server/src/index.ts:43-73`, `client/src/hooks/useRoomSocket.ts:80-169`  
**Apply to:** `SET_LOCATION` and `LOCATION_UPDATED` messaging  
```typescript
// Message typing pattern:
export type ClientMessage =
  | { type: 'SET_LOCATION'; districtId?: string; coords?: { lat: number; lng: number } };

// Dispatcher on client:
send({ type: 'SET_LOCATION', districtId, coords });

// Handler on server:
case 'SET_LOCATION':
  await roomManager.setLocation(ws, message.districtId, message.coords);
  break;
```

### 3. Error Handling and Fallbacks
**Source:** `server/src/roomManager.ts:83-86`, `client/src/hooks/useRoomSocket.ts:160-162`  
**Apply to:** `VenueService`, `useGeolocation`, and API routes  
```typescript
// If Google Places API fails or GOOGLE_PLACES_API_KEY is not defined:
// Never throw or crash the room; silently log a warning and return high-fidelity mock data
try {
  return await fetchGooglePlacesNearby(lat, lng, this.apiKey);
} catch (err) {
  console.warn('[VenueService] Failed to reach Google Places API, falling back to mock dataset', err);
  return MOCK_VENUES[fallbackDistrictId] || MOCK_VENUES['kadikoy-moda'];
}
```

### 4. Warm Editorial Minimal Design Tokens
**Source:** `.planning/DESIGN.md:51-54`, `client/src/components/Lobby.tsx`  
**Apply to:** `DistrictSelector.tsx` and modified `Lobby.tsx`  
- Background Cream: `#FBF9F5`
- Card Border: `#E7E2D9`
- Subtle Fill: `#FAF7F2`
- Text Primary: `#1C1917` (Deep Charcoal)
- Text Muted: `#78716C`
- Accent Primary: `#D9381E` (Paprika Red)
- Accent Secondary: `#E07A5F` (Warm Terracotta - used for badges/chips)
- Success / Ready: `#2D6A4F` (Basil Green)

---

## No Analog Found

Every file has an exact or role-match analog in the codebase:
- `client/src/components/DistrictSelector.tsx` borrows directly from `client/src/components/Lobby.tsx` modal and card styles.
- `server/src/services/venueService.ts` adopts the class-based in-memory repository structure of `server/src/roomManager.ts`.
- `client/src/hooks/useGeolocation.ts` adopts the callback/cleanup hook structure of `client/src/hooks/useRoomSocket.ts`.

---

## Metadata

**Analog search scope:** `server/src`, `server/tests`, `client/src/components`, `client/src/hooks`  
**Files scanned:** 12 tracked repository files  
**Git-tracked check:** verified with `git ls-files`  
**Pattern extraction date:** 2026-11-08  
