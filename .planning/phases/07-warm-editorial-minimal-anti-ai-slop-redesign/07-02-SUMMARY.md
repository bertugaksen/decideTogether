---
phase: 07-warm-editorial-minimal-anti-ai-slop-redesign
plan: 02
subsystem: ui-editorial-experience
tags: [editorial, climax, physics, duel, match-celebration, swipe-deck, venue-card, confetti]
status: complete
requires:
  - "07-01"
provides:
  - Streamlined MatchCelebration with 1 Hero CTA and 2x2 secondary pills
  - Single warm celebratory confetti burst (Terracotta, Gold, Basil, Linen)
  - Calibrated card drag rotation (x * 0.05) and spring recoil (300/20)
  - Tactile tap action buttons (active:scale-[0.98]) and 1.05 match climax scale-up
  - Editorial Warm Linen and Crisp White duel surfaces with calm microcopy (Başla, Hızlı dokun, Dokun)
affects:
  - client/src/components/MatchCelebration.tsx
  - client/src/components/SwipeDeck.tsx
  - client/src/components/VenueCard.tsx
  - client/src/components/DuelCountdown.tsx
  - client/src/components/OnlineDuelView.tsx
  - client/src/components/SplitScreenDuelView.tsx
  - client/src/components/TugOfWarBar.tsx
decisions:
  - D-04: Drag tilt calibrated to rotate = x * 0.05 with bounceStiffness 300 and bounceDamping 20 spring recoil.
  - D-05: MatchCelebration streamlined to 1 Hero CTA (Google Haritalar) + 2x2 secondary pill row with 1px #E7E2D9 borders, purging neon hues and button fatigue.
  - D-06: Match climax choreographed with 1.05 scale-up spring animation and single warm confetti burst (Terracotta, Gold, Basil, Linen).
  - D-07: Duel views neutralized with Warm Linen and Crisp White card surfaces, Fraunces serif numerals, calm microcopy, and maintained touch-action: none.
key-files:
  created: []
  modified:
    - client/src/components/MatchCelebration.tsx
    - client/src/components/SwipeDeck.tsx
    - client/src/components/VenueCard.tsx
    - client/src/components/DuelCountdown.tsx
    - client/src/components/OnlineDuelView.tsx
    - client/src/components/SplitScreenDuelView.tsx
    - client/src/components/TugOfWarBar.tsx
actuals:
  tokens: 6950
  tasks: 3
  commits: 3
  plan_head_before: 4586f937fe90f3d7e18b45b46290d89b041117aa
  plan_head_after: d4bbdeea756d9c6c578a1e358841e12367cb992b
---

# Phase 07 Plan 02: Warm Editorial Climax, Calibrated Physics & Neutralized Duel Surfaces Summary

**Substantive One-liner:** Streamlined MatchCelebration with 1 Hero CTA, 2x2 pills & warm confetti; calibrated 0.05 drag tilt with 300/20 spring recoil & 1.05 match climax; and neutralized duel surfaces to Warm Linen & Crisp White with calm microcopy.

## Overview

Plan 07-02 completed the kinetic and climax overhaul of the DecideTogether client, resolving the remaining UI Review failures for Pillars 1, 2, 4, 5, and 6. It purged all button fatigue in the post-match modal by consolidating actions into 1 Basil Green Hero CTA and a 2x2 grid of crisp white secondary pills; replaced neon brand buttons and arcade double cannons with a single warm celebratory confetti burst; calibrated card drag physics to an exact 0.05 tilt ratio with analog spring recoil; added a 1.05 spring match climax; and transformed all duel views from aggressive Paprika red floods and dark cyber backdrops into refined, calm Warm Linen and Crisp White editorial surfaces.

## Key Changes Completed

### 1. Streamline MatchCelebration Climax (`client/src/components/MatchCelebration.tsx`)
- **Emoji & Shouting Purge:** Purged all 8 emojis (`🎉`, `🏆`, `🧭`, `🛵`, `🍔`, `📞`, `💬`, `🍕`). Replaced shouting headers with calm editorial strings: `"Ortak karar"`, `"Düello kazananı: {winner}"`, and `"Kura sonucu: {winner}"`. Replaced party badge with clean Lucide `<Check className="w-6 h-6 text-[#2D6A4F]" />`.
- **Time Assumption Neutralization:** Changed `"Bu akşam buradayız!"` to Fraunces serif `"Karar verildi: Buradayız."`.
- **Button Hierarchy Redesign:** Eliminated button fatigue and neon gradients (`#EA004B` Yemeksepeti, `#06C167` Uber Eats):
  - **Hero CTA:** Full-width `#2D6A4F` Basil Green button `Yol Tarifi Al (Google Haritalar)` with Lucide `<Navigation />`.
  - **2x2 Secondary Pill Grid:** Crisp white pills with 1px `#E7E2D9` border (`Yemeksepeti`, `Uber Eats`, `Hemen Ara / Numara Bul`, `WhatsApp Paylaş`).
  - **WhatsApp Share:** Timeless copy with zero emojis: `Ortak kararımız belli oldu: {name} ({address}).\n\nYol tarifi: {navigationUrl}`.
  - **Tertiary Action:** Subtle `Yeni Karar Odası Başlat` text button.
- **Warm Confetti:** Replaced 2-cannon arcade burst with a single warm celebratory burst (`#E07A5F`, `#D4AF37`, `#2D6A4F`, `#FBF9F5`, `disableForReducedMotion: true`).
- **Clean Border:** Replaced `shadow-2xl` with a crisp 1px `#E7E2D9` border and removed dead `isSponsored` / `Sparkles` relics.

### 2. Calibrate Card Drag Physics & Climax (`VenueCard.tsx`, `SwipeDeck.tsx`)
- **Drag Tilt Ratio:** Calibrated `rotate = useTransform(x, (val) => val * 0.05)` in `VenueCard.tsx` (tilts exactly 5 deg at 100px drag).
- **Spring Recoil:** Added `dragTransition={{ bounceStiffness: 300, bounceDamping: 20 }}` to `VenueCard.tsx` for natural kinetic recoil on release.
- **Tactile Tap Buttons:** Replaced `active:scale-90` with `active:scale-[0.98] transition-transform duration-100` and replaced `shadow-lg` with 1px `#E7E2D9` border on both Pass (`X`) and Like (`Heart`) buttons in `SwipeDeck.tsx`.
- **Match Climax Choreography:** Added mutual match climax: card snaps to center and scales up to `1.05` with spring physics (`type: "spring", stiffness: 300, damping: 25`) before `MatchCelebration` modal displays.

### 3. Neutralize Duel Surfaces (`DuelCountdown.tsx`, `OnlineDuelView.tsx`, `SplitScreenDuelView.tsx`, `TugOfWarBar.tsx`)
- **DuelCountdown:** Replaced dark cyber backdrop with Warm Linen backdrop (`bg-[#FBF9F5]/90 backdrop-blur-sm`). Numerals rendered in Fraunces serif (`font-display font-bold text-8xl text-[#1C1917]`). Replaced screaming `"BAŞLA! 🔥"` with calm Terracotta `"Başla"` without pulse or heavy drop-shadows.
- **OnlineDuelView:** Eliminated full-screen Paprika red flood (`bg-[#D9381E]`). Replaced with Warm Linen background and Crisp White card pad with 1px `#E7E2D9` border. Rendered tap tally in Fraunces serif (`font-display font-bold text-6xl text-[#1C1917]`). Replaced `"SERİ DOKUN! 🔥"` with calm `"Hızlı dokun"`. Maintained `touchAction: 'none'`.
- **SplitScreenDuelView:** Replaced dark cyber backdrop with Warm Linen and Crisp White player tap zones with 1px `#E7E2D9` dividing seam. Replaced `"DOKUN! 🔥"` and `"DOKUN! ⚡"` with calm editorial `"Dokun"`. Maintained `touchAction: 'none'`.
- **TugOfWarBar:** Replaced dark cyber track with warm divider tone `bg-[#E7E2D9] border-[#D5CEC5]`.

## Commits

1. `fd6431c`: `feat(07-02): streamline MatchCelebration with 1 Hero CTA, 2x2 pills & warm confetti`
2. `671b2a3`: `feat(07-02): calibrate card drag physics to 0.05 tilt, spring recoil & match scale-up`
3. `d4bbdee`: `feat(07-02): neutralize duel surfaces, replace red floods & purge screaming microcopy`

## Deviations from Plan

None - plan executed exactly as written.

## Self-Check: PASSED

- `client/src/components/MatchCelebration.tsx` exists and renders 1 Hero CTA + 2x2 pills: FOUND
- `client/src/components/SwipeDeck.tsx` exists with 1.05 match climax & active:scale-[0.98]: FOUND
- `client/src/components/VenueCard.tsx` exists with val * 0.05 and bounceStiffness: 300: FOUND
- `client/src/components/DuelCountdown.tsx` exists with Warm Linen and 'Başla': FOUND
- `client/src/components/OnlineDuelView.tsx` exists with crisp white card & 'Hızlı dokun': FOUND
- `client/src/components/SplitScreenDuelView.tsx` exists with crisp white surfaces & 'Dokun': FOUND
- `client/src/components/TugOfWarBar.tsx` exists with warm track tone: FOUND
- All 3 commits verified in git tree: FOUND (`fd6431c`, `671b2a3`, `d4bbdee`)
- Zero emojis verified across all client TSX files: PASSED
- Zero 'akşam' time assumptions verified across all client files: PASSED
- Full client build passes cleanly: PASSED
- Full server test suite (37/37) passes: PASSED
