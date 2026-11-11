# Phase 1: Room & Real-Time Connection — Research

**Phase:** 1  
**Domain:** Real-Time Room Management, WebSockets, Mobile Web Session Resilience  
**Date:** 2026-11-08

## 1. Architecture & Technology Decisions

### 1.1 WebSocket Engine: Native `ws` vs `socket.io`
- **Choice:** Native `ws` library on Node.js + Native browser `WebSocket` API on React.
- **Rationale:** 
  - `ws` adds zero runtime client weight (native `new WebSocket()` works in Safari/Chrome without extra client bundles).
  - Extremely low latency (<5ms) and tiny memory footprint (~10MB RAM).
  - Reconnection and heartbeats can be cleanly implemented in ~40 lines of code via a React custom hook (`useRoomSocket`).

### 1.2 4-Digit PIN Generation & Room Indexing
- **Algorithm:**
  - Active rooms stored in-memory in a `Map<string, Room>()`.
  - Room code generated via `Math.floor(1000 + Math.random() * 9000).toString()`.
  - While loop ensures no collision with an active room code.
  - Rooms automatically garbage-collected after 30 minutes of inactivity or 30 seconds of all participants disconnecting.

### 1.3 Nicknames & Anonymous Avatars
- Pre-defined fun Turkish food-themed animal nicknames:
  - `"Aç Panda"`, `"Kararsız Koala"`, `"Gurme Tilki"`, `"Keyifli Kedi"`, `"Obur Rakun"`.
- Assigned automatically upon room creation (Host gets first, Peer gets second).

### 1.4 Connection Loss & Session Recovery (30-second Tolerance)
- Client stores `{ roomCode, userId, nickname, role }` in browser `localStorage`.
- When connection drops:
  1. Client sets status to `reconnecting`, starts local 30s countdown, and attempts exponential backoff WebSocket reconnect.
  2. Server retains participant state for 30 seconds, broadcasting `PARTICIPANT_DISCONNECTED` with a 30s deadline to the remaining user.
  3. If client reconnects within 30s with matching `userId`, server restores connection and broadcasts `PARTICIPANT_RECONNECTED`.
  4. If 30s expires without reconnection, room is closed.

## 2. Shared Protocol Specifications

### Client -> Server Events
- `JOIN_ROOM`: `{ type: "JOIN_ROOM", roomCode: string, userId?: string }`
- `PING`: `{ type: "PING" }`

### Server -> Client Events
- `ROOM_STATE`: `{ type: "ROOM_STATE", room: RoomPayload }`
- `PEER_JOINED`: `{ type: "PEER_JOINED", participant: Participant }`
- `PEER_DISCONNECTED`: `{ type: "PEER_DISCONNECTED", userId: string, reconnectWindowSec: number }`
- `PEER_RECONNECTED`: `{ type: "PEER_RECONNECTED", userId: string }`
- `ROOM_READY`: `{ type: "ROOM_READY", roomCode: string }`
- `ERROR`: `{ type: "ERROR", message: string }`
