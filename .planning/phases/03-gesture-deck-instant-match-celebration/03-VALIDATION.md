---
phase: "03"
slug: "gesture-deck-instant-match-celebration"
status: draft
nyquist_compliant: false
wave_0_complete: false
created: "2026-11-08"
---

# Phase 03 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Node.js native test runner (`node:test` + `node:assert/strict`) via `tsx --test` |
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
| 03-01-01 | 01 | 1 | SWIPE-02 | T-03-01 | Client identity resolved strictly from internal socket mapping | unit | `npm.cmd --prefix server test` | ❌ W0 | ⬜ pending |
| 03-01-02 | 01 | 1 | SWIPE-03 | T-03-02 | Discard votes when room.status !== 'swiping' or duplicate venueId | unit | `npm.cmd --prefix server test` | ❌ W0 | ⬜ pending |
| 03-01-03 | 01 | 1 | SWIPE-03 | T-03-03 | Mutual match broadcasts MATCH in <100ms; exhaustion triggers DECK_EXHAUSTED | integration | `node server/test-swipe-probe.js` | ❌ W0 | ⬜ pending |
| 03-02-01 | 02 | 2 | SWIPE-01 | — | N/A (Client gesture physics) | build | `npm.cmd --prefix client run build` | ❌ W0 | ⬜ pending |
| 03-02-02 | 02 | 2 | SWIPE-02, SWIPE-03 | — | N/A (Confetti celebration overlay & partner progress) | build | `npm.cmd --prefix client run build` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `server/src/tests/swipeDeck.test.ts` — covers `recordSwipe`, instant mutual match, partner progress relay, and deck exhaustion transition to `'duel'`.
- [ ] `client/package.json` — install `canvas-confetti` and `@types/canvas-confetti`.
- [ ] `server/test-swipe-probe.js` — multi-peer WebSocket integration probe testing end-to-end match detection and deck exhaustion.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Touch drag fluidity & tilt rotation | SWIPE-01 | Touch gesture inertia, stamp opacity transitions, and 60fps responsiveness on physical mobile device | Open on mobile Safari/Chrome, swipe card left and right, verify card tilts smoothly and does not trigger browser navigation |
| Confetti fireworks visual celebration | SWIPE-03 | Canvas animation rendering, visual confetti explosion, and winning restaurant modal presentation | Complete a mutual like on two connected clients, verify full-screen celebration explodes and shows winning restaurant card |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
