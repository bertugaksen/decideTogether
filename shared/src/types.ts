export interface Participant {
  id: string;
  nickname: string;
  role: 'host' | 'peer';
  connected: boolean;
  disconnectedAt?: number;
}

export type RoomStatus = 'waiting' | 'ready' | 'swiping' | 'matched' | 'duel';

export interface Venue {
  id: string; // e.g. "gplace_ChIJ..." or "mock_moda_01"
  name: string; // "Aida - Vino e Cucina"
  category: string; // "İtalyan & Şarap Evi"
  rating: number; // 4.8
  reviewCount: number; // 940
  priceLevel: 1 | 2 | 3 | 4; // 1 = ₺, 2 = ₺₺, 3 = ₺₺₺, 4 = ₺₺₺₺
  address: string; // "Moda Cad. Ressam Şeref Akdik Sok. No:10, Kadıköy"
  location: {
    lat: number;
    lng: number;
  };
  photoUrl: string; // High-res image URL (proxied or CDN)
  photos?: string[]; // Optional secondary images
  isSponsored?: boolean; // VENUE-04
  sponsorBadge?: string; // "Öne Çıkan Lezzet" | "Sponsorlu"
  sponsorPromoText?: string; // e.g. "DecideTogether masalarına özel tatlı ikramı"
  phone?: string; // ACTION-03: Phone number for direct calling
  googleMapsUrl?: string; // ACTION-02: Direct Google Maps turn-by-turn navigation URL
  deliveryUrl?: string; // ACTION-03: Direct or search-based food delivery URL
  distanceKm?: number; // ACTION-01: Distance in km from room reference point
  isOpenNow?: boolean;
}

export interface District {
  id: string; // "kadikoy-moda", "besiktas-carsi", "kadikoy-caddebostan", "sisli-nisantasi"
  name: string; // "Kadıköy, Moda"
  city: string; // "İstanbul"
  center: {
    lat: number;
    lng: number;
  };
  sampleCuisines?: string[];
}

export interface RoomLocation {
  districtId: string;
  label: string; // "Kadıköy, Moda"
  coords?: {
    lat: number;
    lng: number;
  };
  isGps?: boolean;
}

export interface Room {
  code: string; // 4-digit numeric PIN
  hostId: string;
  peerId?: string;
  status: RoomStatus;
  participants: Record<string, Participant>;
  createdAt: number;
  lastActiveAt: number;
  location?: RoomLocation;
  venues?: Venue[];
  // Phase 3 extensions:
  votes?: Record<string, Record<string, 'like' | 'pass'>>; // userId -> venueId -> 'like' | 'pass'
  progress?: Record<string, { cardIndex: number; totalCards: number }>; // userId -> swipe progress
  matchedVenue?: Venue; // The mutual winner
  // Phase 4 extensions:
  duelState?: DuelState;
}

export interface DuelState {
  status: 'countdown' | 'battling' | 'finished';
  mode: 'online' | 'split';
  startTime: number;
  durationMs: number;
  scores: Record<string, number>;
  timer?: NodeJS.Timeout;
  winnerId?: string;
  tieBroken?: boolean;
  initiatorId?: string;
}

// Client -> Server Message Types
export type ClientMessage =
  | {
      type: 'CREATE_ROOM';
      nickname?: string;
      location?: {
        districtId?: string;
        coords?: { lat: number; lng: number };
      };
    }
  | { type: 'JOIN_ROOM'; roomCode: string; userId?: string; nickname?: string }
  | { type: 'UPDATE_NICKNAME'; nickname: string }
  | { type: 'SET_LOCATION'; districtId?: string; coords?: { lat: number; lng: number } }
  | { type: 'LEAVE_ROOM' }
  | { type: 'START_SWIPING' }
  | {
      type: 'SWIPE';
      venueId: string;
      vote: 'like' | 'pass';
      cardIndex: number;
      totalCards: number;
    }
  | { type: 'PING' }
  | { type: 'START_DUEL'; mode?: 'online' | 'split' }
  | { type: 'DUEL_TAP'; taps: number }
  | { type: 'RESOLVE_SPLIT_DUEL'; winnerRole: 'p1' | 'p2'; scores: { p1: number; p2: number } };

// Server -> Client Message Types
export type ServerMessage =
  | { type: 'ROOM_CREATED'; roomCode: string; user: Participant; room?: Room }
  | { type: 'ROOM_JOINED'; room: Room; user: Participant }
  | { type: 'ROOM_STATE'; room: Room }
  | { type: 'LOCATION_UPDATED'; location: RoomLocation; venues: Venue[] }
  | { type: 'PEER_JOINED'; participant: Participant }
  | { type: 'PEER_DISCONNECTED'; userId: string; reconnectDeadlineMs: number }
  | { type: 'PEER_RECONNECTED'; participant: Participant }
  | { type: 'ROOM_READY'; roomCode: string }
  | { type: 'SWIPING_STARTED' }
  | {
      type: 'PARTNER_PROGRESS';
      userId: string;
      cardIndex: number;
      totalCards: number;
    }
  | {
      type: 'MATCH';
      venue: Venue;
      duelResult?: {
        winnerId: string;
        scores: Record<string, number>;
        tieBroken?: boolean;
      };
    }
  | { type: 'DECK_EXHAUSTED' }
  | {
      type: 'DUEL_STARTING';
      startTime: number;
      durationMs: number;
      mode: 'online' | 'split';
      initiatorId?: string;
    }
  | {
      type: 'DUEL_PROGRESS';
      scores: Record<string, number>;
    }
  | { type: 'PONG' }
  | { type: 'ERROR'; message: string };

export interface SavedSession {
  roomCode: string;
  userId: string;
  nickname: string;
  role: 'host' | 'peer';
}
