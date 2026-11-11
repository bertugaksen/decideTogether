---
phase: "04"
slug: "rapid-tapper-tie-breaker-duel"
status: draft
nyquist_compliant: false
wave_0_complete: false
created: "2026-11-09"
---

# Phase 04 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Node.js 24 native test runner (`node:test` + `node:assert/strict`) via `tsx --test` |
| **Config file** | `server/package.json` (`npm test`) |
| **Quick run command** | `npm.cmd --prefix server test` |
| **Full suite command** | `npm.cmd --prefix server test && npm.cmd --prefix client run build` |
| **Estimated runtime** | ~3 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npm.cmd --prefix server test`
- **After every plan wave:** Run `npm.cmd --prefix server test && npm.cmd --prefix client run build`
- **Before `/gsd-verify-work`:** Full suite must be green + client build passes with 0 type errors
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 04-01-01 | 01 | 1 | DUEL-01, DUEL-02 | T-04-01 | Client identity resolved strictly via internal socket handle `this.clients.get(ws)`; reject unauthorized sockets | unit | `npm.cmd --prefix server test` | ❌ W0 | ⬜ pending |
| 04-01-02 | 01 | 1 | DUEL-02, DUEL-03, DUEL-04 | T-04-02, T-04-03 | Cumulative tap delta clamped (max 30 taps per batch); reject taps outside 5.0s window; authoritative winner resolution | unit | `npm.cmd --prefix server test` | ❌ W0 | ⬜ pending |
| 04-01-03 | 01 | 1 | DUEL-01, DUEL-04 | — | End-to-end WebSocket duel lifecycle: START_DUEL -> DUEL_STARTING -> DUEL_TAP -> MATCH broadcast | integration | `node --check server/test-duel-probe.js && npm.cmd --prefix server test` | ❌ W0 | ⬜ pending |
| 04-02-01 | 02 | 2 | DUEL-01, DUEL-03 | T-04-06 | Native Web Audio API oscillator synthesis (3-2-1 countdown beeps + fanfare) and 0ms audio unlock on user gesture | build | `npm.cmd --prefix client run build` | ❌ W0 | ⬜ pending |
| 04-02-02 | 02 | 2 | DUEL-02, DUEL-03 | T-04-04, T-04-05 | Mode A (Online 80ms batched duel) & Mode B (Split-Screen single-phone multi-touch with 180° inversion) | build | `npm.cmd --prefix client run build` | ❌ W0 | ⬜ pending |
| 04-02-03 | 02 | 2 | DUEL-01, DUEL-04 | — | Wire triggers into DeckExhausted, MatchCelebration victory badge, SwipeDeck and Lobby | build | `npm.cmd --prefix client run build && npm.cmd --prefix server test` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `server/src/tests/duel.test.ts` — unit tests covering `startDuel`, `recordDuelTap`, tap rate clamping, 5.0s boundary enforcement, tie-breaking coin toss, and winner restaurant extraction.
- [ ] `server/src/types.ts` — TypeScript protocol types for `START_DUEL`, `DUEL_STARTING`, `DUEL_TAP`, `DUEL_PROGRESS`, `DuelState`.
- [ ] `server/test-duel-probe.js` — multi-client integration test probe verifying real-time WebSocket duel exchange and final `MATCH` broadcast.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Multi-touch responsiveness & 0ms tap latency | DUEL-02 | Physical multi-finger touch streams on capacitive mobile screens, verifying `touch-action: none` prevents double-tap zoom | Open duel screen on iPhone Safari or Android Chrome, rapidly tap with multiple fingers on the tap pad, verify counter increments instantly with zero lag and zero browser zooming |
| Split-screen single-phone 180° rotation | DUEL-02 | Physical two-player ergonomics across opposite sides of a single smartphone | Start Mode B on a single phone placed flat on a table, test Player 1 (top 180° flipped) and Player 2 (bottom) simultaneous tapping |
| Web Audio countdown tones on mobile | DUEL-01 | Mobile browser autoplay restrictions and synthetic oscillator tone playback | Verify "3-2-1" countdown produces 523Hz beeps and 1046Hz battle start sound without audio stutter or permission errors |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
