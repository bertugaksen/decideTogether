---
phase: "02"
slug: "live-venue-discovery-hybrid-location"
status: draft
nyquist_compliant: false
wave_0_complete: false
created: "2026-11-08"
---

# Phase 02 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Node.js built-in `node:test` + `node:assert` (via `node --test` / `npx tsx --test`) |
| **Config file** | none — Node 24 native runner |
| **Quick run command** | `node --test server/test-location-probe.js` |
| **Full suite command** | `npm run build && node server/test-location-probe.js` |
| **Estimated runtime** | ~3 seconds |

---

## Sampling Rate

- **After every task commit:** Run quick run command or unit test script
- **After every plan wave:** Run `npm run build && node server/test-location-probe.js`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 5 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 02-01-01 | 01 | 1 | VENUE-01 | — | Whitelist district validation | unit | `node --test server/dist/tests/venueService.test.js` | ❌ W0 | ⬜ pending |
| 02-01-02 | 01 | 1 | VENUE-02 | T-02-01 | Server-side Places API + Mock Fallback | unit | `node --test server/dist/tests/venueService.test.js` | ❌ W0 | ⬜ pending |
| 02-01-03 | 01 | 1 | VENUE-03 | T-02-02 | 2h TTL cache + 500m coordinate snapping | unit | `node --test server/dist/tests/venueCache.test.js` | ❌ W0 | ⬜ pending |
| 02-01-04 | 01 | 1 | VENUE-04 | — | Deterministic sponsored slot 2 insertion | unit | `node --test server/dist/tests/sponsored.test.js` | ❌ W0 | ⬜ pending |
| 02-02-01 | 02 | 2 | VENUE-01 | — | GPS geolocation + district selector UI | integration | `node server/test-location-probe.js` | ❌ W0 | ⬜ pending |
| 02-02-02 | 02 | 2 | VENUE-01..04 | — | Synchronized deck state in room | e2e probe | `node server/test-location-probe.js` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `server/test-location-probe.js` — WebSocket location sync & venue distribution probe
- [ ] `server/src/tests/venueService.test.ts` — venue service and fallback unit tests
- [ ] `server/src/tests/venueCache.test.ts` — in-memory cache and coordinate rounding tests

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Browser GPS Permission Dialog | VENUE-01 | OS/browser permission prompt cannot be automated via Node unit tests | Open `http://localhost:5173` on mobile/desktop browser, click "Mevcut Konumumu Kullan", verify prompt appears and Moda fallback activates if denied |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 5s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending 2026-11-08
