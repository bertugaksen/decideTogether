---
phase: 07-warm-editorial-minimal-anti-ai-slop-redesign
plan: 01
subsystem: ui-design-system
tags: [typography, fraunces, tailwindcss-v4, editorial, emoji-purge, venue-card, ink-stamps]
status: complete
requires: []
provides:
  - Fraunces variable serif typography in index.html & index.css
  - Tailwind CSS v4 design tokens (--font-display, --color-surface-card, --color-accent-tag, --color-action-match, --color-action-pass, --color-gold)
  - Timeless editorial Turkish copy across Lobby and Waiting views
  - Typographic uppercase ink stamps (BEĞENDİM / PAS) in VenueCard
  - Clean vector iconography (Utensils, ArrowRight, Swords) replacing emojis
affects:
  - client/index.html
  - client/src/index.css
  - client/src/components/Lobby.tsx
  - client/src/components/RoomWaitingView.tsx
  - client/src/components/DeckExhausted.tsx
  - client/src/components/VenueListModal.tsx
  - client/src/components/VenueCard.tsx
decisions:
  - D-01: Fraunces variable font (opsz 9..144, wght 400..800) wired as --font-display with font-optical-sizing auto.
  - D-02: Purged all emojis from Lobby, RoomWaitingView, DeckExhausted, and VenueCard in favor of Lucide vector icons and typographic ink stamps.
  - D-03: Neutralized 'Bu akşam' time-of-day assumptions to 'Birlikte ne yiyoruz?' and removed dead isSponsored relics from VenueListModal.
key-files:
  created: []
  modified:
    - client/index.html
    - client/src/index.css
    - client/src/components/Lobby.tsx
    - client/src/components/RoomWaitingView.tsx
    - client/src/components/DeckExhausted.tsx
    - client/src/components/VenueListModal.tsx
    - client/src/components/VenueCard.tsx
actuals:
  tokens: 45000
  tasks: 3
  commits: 3
  plan_head_before: 90fb24adb1eac5d5876882b45522b338bdf41780
  plan_head_after: c7551aa7463f84857b6f72dc6a9db362ebfa7fd0
---

# Phase 07 Plan 01: Warm Editorial Minimal Typographic Foundation & Anti-AI-Slop Redesign Summary

**Substantive One-liner:** Fraunces variable serif typography integration, Tailwind CSS v4 editorial tokens, typographic ink stamps (BEĞENDİM / PAS), and thorough elimination of emojis and time-of-day assumptions.

## Overview

Plan 07-01 delivered the core visual and textual foundation of DecideTogether's Warm Editorial Minimal design system benchmark (inspired by Kinfolk and Resy). It established variable serif typography, neutralized mealtime assumptions, eradicated juvenile emojis across four major screens, replaced emoji swipe badges with authentic typographic ink stamps, and purged legacy sponsored-venue markup.

## Key Changes Completed

### 1. Typography & Theme Tokens (`client/index.html`, `client/src/index.css`)
- Linked Google Font `Fraunces` variable font with optical sizing (`opsz 9..144`) and weight axes (`wght 400..800`) alongside `Inter`.
- Updated HTML document title to timeless editorial Turkish: `DecideTogether — Birlikte ne yiyoruz?`.
- Set warm terracotta selection colors (`selection:bg-[#E07A5F] selection:text-white`).
- Wired `--font-display: 'Fraunces', Georgia, serif;`, `--color-surface-card: #FFFFFF;`, `--color-accent-tag: #E07A5F;`, `--color-action-match: #2D6A4F;`, `--color-action-pass: #D9381E;`, and `--color-gold: #D4AF37;` inside Tailwind CSS v4 `@theme`.
- Enabled `font-optical-sizing: auto` on `h1, h2, h3, h4, .font-display`.

### 2. Time Assumption Neutralization & Emoji Purge (`Lobby.tsx`, `RoomWaitingView.tsx`, `DeckExhausted.tsx`, `VenueListModal.tsx`)
- **Lobby**: Neutralized hero heading from `"Bu akşam ne yiyoruz?"` to `"Birlikte ne yiyoruz?"`. Purged pizza `🍕` and finger `👉` emojis from WhatsApp share text.
- **RoomWaitingView**: Replaced game controller `🎮` with clean vector `<ArrowRight />` icon on the start button, changing label to `"Oylamayı Başlat"`. Replaced pizza emoji `🍕` in the Seçki Havuzu preview with Lucide `<Utensils />` in terracotta.
- **DeckExhausted**: Replaced swords emoji `⚔️` with Lucide `<Swords className="w-6 h-6 text-[#E07A5F]" />` on a warm `#FAF7F2` surface. Replaced shouting `ORTAK KARAR BULUNAMADI` banner with calm editorial pill `Ortak karar bulunamadı`. Removed heavy `shadow-xl` in favor of a crisp 1px `#E7E2D9` border.
- **VenueListModal**: Removed dead conditional `venue.isSponsored` card styling and `Sparkles` badge remnants, ensuring clean 100% organic listing presentation.

### 3. Typographic Ink Stamps in VenueCard (`client/src/components/VenueCard.tsx`)
- Replaced emoji badges (`BEĞENDİM ❤️` and `PAS ❌`) with clean uppercase typographic ink stamps: `BEĞENDİM` (2px `#2D6A4F`, 12deg tilt, `bg-white/95`) and `PAS` (2px `#D9381E`, 12deg tilt, `bg-white/95`).
- Removed heavy drop shadows (`shadow-xl` and `shadow-md`), replacing them with subtle `shadow-xs` / `shadow-2xs` and 1px `#E7E2D9` borders.
- Preserved `venue.isOpenNow` status indicators intact.
- Enforced Fraunces `font-display` serif for restaurant title hierarchy.

## Commits

1. `74f46a3`: `feat(07-01): load Fraunces variable serif font and wire Tailwind CSS v4 theme tokens`
2. `3e55847`: `refactor(07-01): neutralize time assumptions, purge lobby emojis & clean waiting and exhausted views`
3. `c7551aa`: `feat(07-01): implement typographic ink stamps & purge emojis in VenueCard`

## Deviations from Plan

None - plan executed exactly as written.

## Self-Check: PASSED

- `client/index.html` exists and loads Fraunces Google Font: FOUND
- `client/src/index.css` exists and binds Fraunces to `--font-display`: FOUND
- `client/src/components/Lobby.tsx` exists and contains 0 instances of 'akşam' or emojis: FOUND
- `client/src/components/RoomWaitingView.tsx` exists and uses Lucide icons: FOUND
- `client/src/components/DeckExhausted.tsx` exists and uses vector Swords: FOUND
- `client/src/components/VenueListModal.tsx` exists and has dead isSponsored relics removed: FOUND
- `client/src/components/VenueCard.tsx` exists with typographic BEĞENDİM / PAS ink stamps: FOUND
- All 3 commits verified in git tree: FOUND (`74f46a3`, `3e55847`, `c7551aa`)
- Full client build (`tsc -b && vite build`) passes cleanly: PASSED
- Server tests (37/37 passing): PASSED
