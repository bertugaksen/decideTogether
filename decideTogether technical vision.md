# 🚀 DECIDETOGETHER — TECHNICAL & VISION DOCUMENT

**Project Name:** DecideTogether (Formerly Match&Eat)  
**Document Version:** 2.0.0 (Python Ecosystem Edition)  
**Target Architecture:** FastAPI WebSockets Backend + React / Vite Responsive Frontend  
**Primary Language Stack:** Python 3.12+ & TypeScript / React  
**Execution Engine:** Antigravity AI Agent

---

## 1. Product Vision & Executive Summary

### 1.1 The Core Problem
Couples, housemates, and friend groups face severe "choice paralysis" and decision fatigue when choosing what to eat, watch, or do. Standard delivery or streaming apps offer thousands of options, leading to endless debates (*"I don't care, you choose"*) and wasted time.

### 1.2 The Solution
**DecideTogether** is a frictionless, gesture-driven real-time app that turns decision-making into a 10-second game.
1. Host opens a room and gets a 4-digit PIN.
2. Peer joins via PIN.
3. Both swipe through candidate cards independently (Tinder-style gesture deck).
4. As soon as both swipe **RIGHT** on the same card, a confetti overlay triggers a **MATCH** on both screens simultaneously (<100ms latency).

### 1.3 Key Value Proposition
* **Zero Friction:** No mandatory logins, passwords, or profile setup for MVP.
* **Viral Loop Engine:** Inherently viral; a user *must* invite a friend to use the core functionality.
* **Instant Value:** Directly connects users to action links (Google Maps, Food Delivery, Streaming Services).

---

## 2. Technology Stack (Python Ecosystem)

| Layer | Selected Technology | Technical Justification |
| :--- | :--- | :--- |
| **Backend Framework** | **Python 3.12+ (FastAPI)** | Async-native, ultra-fast Python web framework with auto-generated OpenAPI/Swagger docs and built-in type validation via Pydantic. |
| **Real-time Gateway** | **FastAPI WebSockets + `ConnectionManager`** | Low-latency, bidirectional WebSocket connections for room synchronization and instant event broadcasting. |
| **In-Memory State** | **Python `asyncio` Dict / `dataclasses`** | Ephemeral, thread-safe in-memory room management using Python's native async primitives (expandable to Redis if scaled). |
| **Frontend Framework** | **React 19 (Vite + TypeScript)** | Lightweight, fast client render engine ideal for mobile-first web applications. |
| **UI & Animations** | **Tailwind CSS v4 + Framer Motion 12** | Framer Motion handles physics-based card drag gestures, throwing thresholds ($120\text{px} / 800\text{px/s}$ velocity), and spring snap-backs. |

---

## 3. Real-time WebSocket Protocol & Data Flow

```
[ Client A (Host) ] <--- WS Connection ---> [ FastAPI WebSocket Endpoint ] <--- WS Connection ---> [ Client B (Peer) ]
                                                        |
                                            [ In-Memory Room Manager ]
```

### 3.1 WebSocket Event Specifications (`/ws/{room_code}/{user_id}`)

| Event Payload (`type`) | Direction | Payload Structure | Description |
| :--- | :--- | :--- | :--- |
| `CREATE_ROOM` | Client -> Server | `{ "categories": ["Food"] }` | Host initializes session; server yields a unique 4-digit PIN code. |
| `JOIN_ROOM` | Client -> Server | `{ "room_code": "8421" }` | Peer validates connection to an active session. |
| `ROOM_READY` | Server -> Clients | `{ "room_code": "8421", "cards": [...] }` | Broadcast to both clients once 2 participants are connected. |
| `SUBMIT_SWIPE` | Client -> Server | `{ "card_id": "food_001", "direction": "RIGHT" }` | Sends swipe choice (`LEFT` or `RIGHT`). |
| `MATCH_FOUND` | Server -> Clients | `{ "matched_card": CardSchema }` | Triggered instantly to both clients when mutual 'RIGHT' swipe is registered. |
| `PEER_SWIPED` | Server -> Clients | `{ "card_id": "food_001" }` | Updates peer status indicator (*"Partner is swiping..."*). |
| `PEER_DISCONNECTED`| Server -> Clients | `{ "reason": "socket_closed" }` | Alerts the active user if their partner leaves. |

---

## 4. UI/UX Architecture & Screen Specs

### Screen 1: Lobby Screen (`/`)
* Primary CTA: `Create Session` (Generates 4-digit PIN via FastAPI REST/WS).
* PIN Input: Auto-focused 4-digit numeric box with auto-paste support.

### Screen 2: Waiting Room Screen (`/room/{code}`)
* Large PIN Display with single-tap copy and share link.
* Pulse-animated status badge (*"Waiting for partner..."* -> *"Partner Connected!"*).
* Automatically pushes both clients to `/deck` upon `ROOM_READY` WS message.

### Screen 3: Swipe Deck Screen (`/deck`)
* Stacked Framer Motion card deck with `drag="x"` physics.
* Dynamic **LIKE** (Green) and **NOPE** (Red) stamp overlays on drag.
* Action buttons (Red X / Green Heart) with programmatic throw animation.
* Live partner indicator showing real-time peer activity.

### Screen 4: Match Overlay Screen (`/match`)
* Full-screen celebration with `canvas-confetti`.
* Matched Item details (Image, Title, Rating, Price Level, Tags).
* Outbound CTAs: `Get Directions` (Google Maps URL), `Keep Swiping`, and `Share`.

---

## 5. Modular Implementation Guide for Antigravity

> **Instruction for Antigravity AI:** Build the application sequentially. Verify each module's execution before moving to the next.

```
[ Phase 1: Python FastAPI WebSocket Backend ] ➔ [ Phase 2: React UI & Gesture Deck ] ➔ [ Phase 3: Integration ]
```

### 🧩 Module 1: Python FastAPI WebSocket Backend
* **Task:** Build a FastAPI backend (`src/backend`) utilizing Python 3.12.
* **Core Components:**
  * `schemas.py`: Pydantic models for Rooms, Cards, Swipes, and Event Payloads.
  * `room_manager.py`: Async Python class storing active room state using a `dict[str, Room]` with thread-safe lock management.
  * `main.py`: FastAPI application exposing CORS, `/health` endpoint, and `/ws/match` WebSocket route.
  * **Match Logic:** When `len(room.swipes[card_id].right_swipes) == 2`, broadcast `MATCH_FOUND` event to all room sockets.

### 🧩 Module 2: React Frontend + Gesture Engine
* **Task:** Build the frontend (`src/frontend`) using React 19, Vite, Tailwind v4, and Framer Motion 12.
* **Core Components:**
  * Component deck: `CardStack`, `SwipeCard`, `ActionButtons`, `PinInput`, `MatchOverlay`.
  * Multi-language support (TR/EN) via lightweight locale context.
  * `cards.json`: Structured mock dataset with food/lifestyle cards containing imagery, ratings, tags, and map query parameters.

### 🧩 Module 3: End-to-End WebSocket Wiring
* **Task:** Connect the React frontend to the FastAPI WebSocket server using native browser `WebSocket` or a custom `useWebSocket` React hook.
* **Deliverable:** Demonstrate real-time synchronization between 2 client windows with sub-100ms match notification latency.

---

## 6. Antigravity Start Prompt

When starting the task with Antigravity, pass the following instruction:

> "Please review `PROJECT_TRD_PYTHON.md` in the root directory. Start execution with **Module 1: Python FastAPI WebSocket Backend**. Create `src/backend`, implement `schemas.py`, `room_manager.py`, and `main.py` using Python 3.12, FastAPI, and WebSockets. Verify server launch with `uvicorn main:app --reload` before moving to Module 2."