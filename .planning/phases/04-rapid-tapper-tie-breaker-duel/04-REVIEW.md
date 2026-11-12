---
phase: 04-rapid-tapper-tie-breaker-duel
reviewed: 2026-11-12T20:35:00Z
depth: standard
files_reviewed: 18
files_reviewed_list:
  - server/src/types.ts
  - server/src/roomManager.ts
  - server/src/index.ts
  - server/src/tests/duel.test.ts
  - server/test-duel-probe.js
  - client/src/types.ts
  - client/src/hooks/useRoomSocket.ts
  - client/src/utils/soundEffects.ts
  - client/src/components/TugOfWarBar.tsx
  - client/src/components/DuelCountdown.tsx
  - client/src/components/OnlineDuelView.tsx
  - client/src/components/SplitScreenDuelView.tsx
  - client/src/components/RapidTapperDuel.tsx
  - client/src/components/DeckExhausted.tsx
  - client/src/components/MatchCelebration.tsx
  - client/src/components/SwipeDeck.tsx
  - client/src/components/Lobby.tsx
  - client/src/App.tsx
findings:
  critical: 3
  warning: 4
  info: 3
  total: 10
  necessity: 1
status: issues_found
---

# Phase 4: Code Review Report — Rapid Tapper Tie-Breaker Duel

**Reviewed:** 2026-11-12T20:35:00Z  
**Depth:** standard  
**Files Reviewed:** 18  
**Status:** issues_found  

## Summary

The Phase 4 implementation adds a Rapid Tapper 5-second tie-breaker duel in both online and split-screen (single device) modes, complete with Web Audio synthesized sound effects, haptic vibrations, Tug-of-War tension bars, and hierarchical restaurant winner resolution.

An adversarial examination of the 18 submitted source files revealed **3 Critical (Blocker)** issues, **4 Warnings**, and **3 Info** items (including 1 necessity finding). The most severe issues involve a timing race condition in split-screen mode where the server's hardcoded 8350ms timer expires before local split-screen results arrive (wiping out real scores and forcing a 0-0 random coin toss), a multi-device split duel conflict where both connected phones mount split duels allowing an idle device to finish with 0 taps, and an authorization/status check omission allowing clients to prematurely resolve and hijack online duels using `RESOLVE_SPLIT_DUEL`.

---

## Critical Issues

### CR-01: Split-Screen Duel Race Condition: Premature Server Timeout Wipes Out Real Scores and Replaces Them with 0-0 Tie Coin Toss

**File:** `server/src/roomManager.ts:620-624` (cross-ref: `server/src/services/duelEngine.ts:45`, `client/src/components/DuelCountdown.tsx:18-25`, `client/src/components/SplitScreenDuelView.tsx:63-79`)  
**Issue:**  
In `roomManager.ts:startDuel`, the server starts an authoritative timer for `totalWaitMs`:
```ts
const { duelState, startTime, durationMs, totalWaitMs } = duelEngine.initializeDuel(mode, participantIds);
...
room.duelState.timer = setTimeout(() => {
  this.concludeDuel(room.code);
}, totalWaitMs);
```
Where `totalWaitMs = countdownMs (3000) + durationMs (5000) + gracePeriodMs (350) = 8350ms`.

In split-screen mode, no intermediate taps are transmitted over WebSocket; taps are accumulated locally in `p1ScoreRef` and `p2ScoreRef` until the battle finishes, at which point the client sends `RESOLVE_SPLIT_DUEL`.

However, on the client:
1. `DuelCountdown` runs 3 interval ticks (3000ms) plus a 300ms "Başla" display timeout before invoking `onComplete()` at ~3300ms.
2. Only then does `SplitScreenDuelView` mount and begin its 5000ms interval (`Date.now() - startTime`), running until at least 8300ms.
3. At 8300ms, the client calculates the final scores and dispatches `RESOLVE_SPLIT_DUEL` over WebSocket.
4. If network latency, event loop scheduling, or frame delays take more than **50ms**, the server's 8350ms timer fires first!
5. When the server timer fires, `concludeDuel(room.code)` runs with `scores: { [hostId]: 0, [peerId]: 0 }`. It treats the duel as a 0-0 tie, picks a winner at random via coin toss, sets `room.duelState.status = 'finished'`, and broadcasts `MATCH` with score 0-0.
6. When `RESOLVE_SPLIT_DUEL` arrives milliseconds later, `concludeDuel` exits immediately (`if (room.duelState.status === 'finished') return;`). The players' real scores and legitimate winner are discarded.

**Fix:**  
For `mode === 'split'`, do not use the short 8350ms countdown buzzer to decide the winner. Either extend `totalWaitMs` to a safety abandon timeout (e.g., 20,000ms) or allow `RESOLVE_SPLIT_DUEL` to conclude the duel. Also, pass the synchronized `startTime` to `SplitScreenDuelView` instead of resetting `startTime = Date.now()` upon mounting:

```typescript
// server/src/services/duelEngine.ts
const totalWaitMs = mode === 'split' 
  ? countdownMs + durationMs + 15000 // 15s grace for split mode client submission
  : countdownMs + durationMs + gracePeriodMs;
```

---

### CR-02: Multi-Device Split-Screen Duel Conflict: Non-Host / Idle Phone Finalizes Duel with 0 Taps

**File:** `server/src/roomManager.ts:613-619`, `client/src/components/SwipeDeck.tsx:91-108`, `server/src/index.ts:173-197`  
**Issue:**  
When two players are in a room across two phones (Phone A and Phone B) and deck exhaustion occurs, either player can select "Yan Yana Oyna (Tek Telefon)" (Split Screen Duel).
1. Phone A sends `{ type: 'START_DUEL', mode: 'split' }`.
2. The server sets `room.duelState.mode = 'split'` and broadcasts `DUEL_STARTING (mode: 'split')` to **both** phones.
3. Phone B receives `DUEL_STARTING` and `SwipeDeck.tsx` mounts `RapidTapperDuel` with `mode: 'split'`.
4. Both phones now render a split-screen duel. If the two players are playing on Phone A, Phone B sits idle on the table.
5. When Phone B's 5-second timer completes, Phone B dispatches `{ type: 'RESOLVE_SPLIT_DUEL', winnerRole: 'p1', scores: { p1: 0, p2: 0 } }`.
6. Whichever phone's message reaches the server first (often the idle phone) resolves the match. Phone B concludes the room with 0-0 scores before Phone A (where the players actually tapped) can submit its scores.

**Fix:**  
Record `splitInitiatorId: client.userId` in `duelState` on the server. If `mode === 'split'`, only accept `RESOLVE_SPLIT_DUEL` from the socket belonging to `splitInitiatorId`. On the client, if `mode === 'split'` and the current user is not the initiator, display a waiting screen ("Partneriniz tek telefondan düello başlattı — lütfen o telefondan oynayın") rather than mounting a second split screen.

```typescript
// server/src/roomManager.ts
room.duelState = {
  ...duelState,
  initiatorId: client.userId,
};

// server/src/index.ts
if (room.duelState?.mode === 'split' && room.duelState.initiatorId !== clientInfo.userId) {
  logger.warn('Ignoring RESOLVE_SPLIT_DUEL from non-initiator client', { userId: clientInfo.userId });
  break;
}
```

---

### CR-03: Security Authorization Bypass: Clients Can Send `RESOLVE_SPLIT_DUEL` to Forcibly Hijack and Conclude Online Duels

**File:** `server/src/index.ts:173-197`  
**Issue:**  
The `RESOLVE_SPLIT_DUEL` handler in `index.ts` does not check whether `room.duelState?.mode === 'split'`:
```typescript
case 'RESOLVE_SPLIT_DUEL': {
  const clientInfo = roomManager.getClientInfo(ws);
  if (clientInfo) {
    const room = roomManager.getRoom(clientInfo.roomCode);
    if (room) {
      const p1Score = Math.max(0, Math.min(300, Number(message.scores?.p1) || 0));
      const p2Score = Math.max(0, Math.min(300, Number(message.scores?.p2) || 0));
      if (room.duelState) {
        room.duelState.scores = {
          [room.hostId]: p1Score,
          [room.peerId || 'peer']: p2Score,
        };
      }
      const winnerId =
        p1Score === p2Score
          ? undefined
          : message.winnerRole === 'p1'
          ? room.hostId
          : room.peerId || room.hostId;
      roomManager.concludeDuel(room.code, winnerId);
    }
  }
  break;
}
```
During an active **online** duel, a malicious or buggy client can send `{ type: 'RESOLVE_SPLIT_DUEL', winnerRole: 'p2', scores: { p1: 0, p2: 100 } }`.
Because `room.duelState` is active and `room.duelState.status !== 'finished'`, the server immediately overwrites the online scores, cancels the authoritative timer, designates the sender's chosen role as winner, and concludes the duel. This completely bypasses the anti-cheat tap limits and timing checks in `recordDuelTap`.

**Fix:**  
Require that `room.status === 'duel'` and `room.duelState?.mode === 'split'` before executing split resolution:

```typescript
case 'RESOLVE_SPLIT_DUEL': {
  const clientInfo = roomManager.getClientInfo(ws);
  if (clientInfo) {
    const room = roomManager.getRoom(clientInfo.roomCode);
    if (room && room.status === 'duel' && room.duelState && room.duelState.mode === 'split') {
      // Proceed with split duel conclusion
...
```

---

## Warnings

### WR-01: `OnlineDuelView` Countdown and Sync Interval Timers Re-execute on Every Opponent Tap Due to Unmemoized Inline Callbacks

**File:** `client/src/components/SwipeDeck.tsx:103-105`, `client/src/components/OnlineDuelView.tsx:53-84`  
**Issue:**  
In `OnlineDuelView.tsx`, both the 80ms `batchTimer` and the 30ms countdown animation timer depend on `onSendTapBatch` and `onDuelFinish`:
```typescript
useEffect(() => {
  const batchTimer = setInterval(() => { ... }, 80);
  return () => clearInterval(batchTimer);
}, [onSendTapBatch]);

useEffect(() => {
  const duelStart = ...;
  const timer = setInterval(() => { ... }, 30);
  return () => clearInterval(timer);
}, [durationMs, startTime, onDuelFinish, onSendTapBatch]);
```
In `SwipeDeck.tsx`, inline arrow functions are passed directly:
```typescript
onSendTapBatch={(taps) => onSendDuelTap?.(taps)}
onOnlineFinish={() => {}}
```
Every time the opponent taps, the server sends `DUEL_PROGRESS`, triggering a state update in `useRoomSocket` (`setDuelState`). This causes `SwipeDeck` to re-render, creating brand new function references for `onSendTapBatch` and `onOnlineFinish`. As a result, both intervals are cleared and restarted every 50-80ms throughout the duel, resulting in interval jitter, UI stutter in the timer bar, and delayed outgoing tap batches.

**Fix:**  
Pass `onSendDuelTap` directly into `RapidTapperDuel` without an inline wrapper, memoize `onOnlineFinish` with `useCallback`, and store `onSendTapBatch` in a `useRef` inside `OnlineDuelView` so interval timers do not teardown and recreate when props update:

```typescript
// client/src/components/OnlineDuelView.tsx
const onSendTapBatchRef = useRef(onSendTapBatch);
useEffect(() => {
  onSendTapBatchRef.current = onSendTapBatch;
}, [onSendTapBatch]);

useEffect(() => {
  const batchTimer = setInterval(() => {
    if (localTapsRef.current > lastSentTapsRef.current) {
      lastSentTapsRef.current = localTapsRef.current;
      onSendTapBatchRef.current(localTapsRef.current);
    }
  }, 80);
  return () => clearInterval(batchTimer);
}, []);
```

---

### WR-02: Missing Hydration of `duelState` on Reconnection / Reload Wipes Out Active Duel and Erases Winner Badge in Celebration View

**File:** `client/src/hooks/useRoomSocket.ts:133-159`, `client/src/components/SwipeDeck.tsx:127-147`  
**Issue:**  
When a client reconnects or reloads the page, the server responds with `ROOM_JOINED` or `ROOM_STATE`. In `useRoomSocket.ts`:
- `setMatchedVenue(message.room.matchedVenue)` is called.
- `setIsDeckExhausted(true)` is called if `room.status === 'duel'`.
- But `setDuelState` is **never** called with `message.room.duelState`!

Consequences:
1. If a user reloads mid-duel, `duelState` remains `null`. `SwipeDeck` renders the `DeckExhausted` modal again instead of the active duel.
2. If a user reloads on the `MatchCelebration` screen after winning a duel, `room.duelState` exists in the database with the winner and scores, but `useRoomSocket` leaves `duelState = null`. In `SwipeDeck.tsx`, `duelResultProp` becomes `undefined`, causing `MatchCelebration` to downgrade from `"Düello kazananı: Aç Panda"` to generic `"Ortak karar"`.

**Fix:**  
Hydrate `duelState` in both `ROOM_JOINED` and `ROOM_STATE` handlers in `useRoomSocket.ts`:

```typescript
// client/src/hooks/useRoomSocket.ts
case 'ROOM_JOINED':
  setRoom(message.room);
  setCurrentUser(message.user);
  if (message.room.matchedVenue) {
    setMatchedVenue(message.room.matchedVenue);
  }
  if (message.room.duelState) {
    setDuelState(message.room.duelState);
  }
  if (message.room.status === 'duel') {
    setIsDeckExhausted(true);
  }
  saveSession(message.room.code, message.user);
  break;
```

---

### WR-03: Missing Finite Number and NaN Sanitization on `DUEL_TAP` Taps Allows Duel State and Score Corruption

**File:** `server/src/index.ts:169-171`, `server/src/services/duelEngine.ts:52-72`  
**Issue:**  
In `index.ts:169`:
```typescript
case 'DUEL_TAP':
  roomManager.recordDuelTap(ws, message.taps);
  break;
```
Unlike `RESOLVE_SPLIT_DUEL` which validates numbers via `Math.max(0, Math.min(300, Number(...) || 0))`, `DUEL_TAP` passes `message.taps` directly to `duelEngine.validateTap`.
If a client sends `{ type: 'DUEL_TAP', taps: NaN }` (or `null`, `undefined`, or a negative number):
- `let validatedTaps = cumulativeTaps;`
- `validatedTaps - currentScore > 30` evaluates to `false` for `NaN`.
- `const newScore = Math.max(currentScore, validatedTaps);` evaluates to `NaN`.
- `room.duelState.scores[client.userId]` is set to `NaN` and broadcast in `DUEL_PROGRESS`.
- On the client, `TugOfWarBar` computes `Math.round(((NaN + 4) / ...) * 100) = NaN`, applying `style={{ width: 'NaN%' }}`, which breaks rendering.
- At duel conclusion, comparisons `s1 > s2` and `s2 > s1` both fail when one value is `NaN`, causing an unintended tie coin toss.

**Fix:**  
Validate and clamp `message.taps` in `index.ts` and `recordDuelTap`:

```typescript
case 'DUEL_TAP': {
  const taps = Number(message.taps);
  if (Number.isFinite(taps) && taps >= 0) {
    roomManager.recordDuelTap(ws, Math.floor(taps));
  }
  break;
}
```

---

### WR-04: Impure React State Updater in `DuelCountdown` Causes Double Audio Playback and Leaked Timeout References

**File:** `client/src/components/DuelCountdown.tsx:18-35`  
**Issue:**  
In `DuelCountdown.tsx`:
```typescript
const interval = setInterval(() => {
  setStep((prev) => {
    if (prev === 1) {
      soundEffects.playStartFanfare();
      completeTimeout = setTimeout(() => {
        onComplete();
      }, 300);
      return 0; // "Başla"
    }
    if (prev <= 0) {
      clearInterval(interval);
      return -1;
    }
    soundEffects.playCountdownTick();
    return prev - 1;
  });
}, 1000);
```
In React, state updater callbacks must remain pure without side effects. In development mode (StrictMode) or under concurrent re-renders, React executes state updaters twice to detect side effects.
Having `soundEffects.playCountdownTick()`, `soundEffects.playStartFanfare()`, `setTimeout()`, and `clearInterval(interval)` inside the `setStep` updater causes:
1. Audio ticks and fanfare to trigger twice per second.
2. The `completeTimeout` reference to be assigned twice; the first timeout ID is lost and cannot be cleared by the cleanup function on unmount.

**Fix:**  
Move sound effects and timeout scheduling outside of the `setStep` updater callback:

```typescript
// client/src/components/DuelCountdown.tsx
useEffect(() => {
  soundEffects.initOnUserGesture();
  soundEffects.playCountdownTick();

  let currentStep = 3;
  let completeTimeout: ReturnType<typeof setTimeout> | null = null;

  const interval = setInterval(() => {
    currentStep -= 1;
    if (currentStep === 0) {
      setStep(0);
      soundEffects.playStartFanfare();
      completeTimeout = setTimeout(() => {
        onComplete();
      }, 300);
    } else if (currentStep < 0) {
      clearInterval(interval);
      setStep(-1);
    } else {
      setStep(currentStep);
      soundEffects.playCountdownTick();
    }
  }, 1000);

  return () => {
    clearInterval(interval);
    if (completeTimeout) clearTimeout(completeTimeout);
  };
}, [onComplete]);
```

---

## Info

### IN-01: Impossible-State Guard — Unreachable `SwipeDeck` Branch in `Lobby.tsx`

**File:** `client/src/components/Lobby.tsx:98-121`  
**Category:** necessity  
**Issue:**  
The guarded state cannot occur. `App.tsx:10-23` already performs the exact same status check:
```typescript
const isGameActive = Boolean(
  room &&
  currentUser &&
  (room.status === 'swiping' || room.status === 'matched' || room.status === 'duel')
);
```
`App.tsx` directly renders `<SwipeDeck>` when `isGameActive` is `true`, and only renders `<Lobby socket={socket}>` when `isGameActive` is `false`. Therefore, the `if (room && currentUser && (room.status === 'swiping' || ...))` branch on lines 98-121 of `Lobby.tsx` is completely unreachable dead code that duplicates the entire `SwipeDeck` prop mapping.  
**Fix:**  
Remove lines 98-121 from `Lobby.tsx` along with the redundant imports (`SwipeDeck`).

---

### IN-02: Generic Player Labels in `SplitScreenDuelView` Obscure Which Half Represents Host vs Peer Preferences

**File:** `client/src/components/SplitScreenDuelView.tsx:96-134`  
**Issue:**  
In `SplitScreenDuelView`, the top half is hardcoded as "Oyuncu 1" and the bottom half as "Oyuncu 2". In `index.ts:181-193`, "Oyuncu 1" maps to `room.hostId` and "Oyuncu 2" maps to `room.peerId`. However, the players sitting across the table have no indication of which half corresponds to whose profile/restaurant votes.  
**Fix:**  
Pass `currentUser.nickname` and `peer?.nickname` into `SplitScreenDuelView` and display the actual player nicknames (e.g., "Aç Panda" vs "Kararsız Koala") on each half and on the `TugOfWarBar`.

---

### IN-03: Active Duel Timer Not Cancelled When a Participant Disconnects During Grace Period

**File:** `server/src/roomManager.ts:327-378`  
**Issue:**  
When a participant's connection drops during a duel, `handleDisconnect` schedules a 30s disconnect timeout. However, `room.duelState.timer` continues running in the background for 8.35s. When the timer fires, `concludeDuel` concludes the duel against a disconnected player and broadcasts `MATCH` to the single remaining player. While this prevents a zombie duel, pausing or notifying the remaining player that their partner disconnected during the battle would prevent unexpected automatic match conclusions.  
**Fix:**  
Pause or cancel the active duel timer when a participant disconnects during `room.status === 'duel'`, and resume or reset when they reconnect.

---

_Reviewed: 2026-11-12T20:35:00Z_  
_Reviewer: the agent (gsd-code-reviewer)_  
_Depth: standard_  
