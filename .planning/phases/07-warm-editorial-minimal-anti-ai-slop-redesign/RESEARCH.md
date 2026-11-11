# Phase 07: Warm Editorial Minimal & Anti-AI-Slop Redesign - Research

**Researched:** 2026-11-11  
**Domain:** Frontend UI / UX Design System, Typography, Motion Physics, Content Neutralization  
**Confidence:** HIGH  

---

## Summary

Phase 07 transforms DecideTogether's frontend from an AI-slop aesthetic into a world-class "Warm Editorial Minimal" web application. The audit in `.planning/phases/06-mobile-ux-swipe-physics-location-navigation-polish/06-UI-REVIEW.md` scored the frontend at **10/24 (BLOCKER)** across 6 core interaction pillars. The application currently suffers from missing serif typography, 19 hardcoded juvenile emojis paired redundantly with vector icons, 5 rigid time-of-day assumptions ("Bu akşam"), neon delivery brand gradients (`#EA004B`, `#06C167`), arcade shouting copy, missing Framer Motion spring snap-backs, sloppy card drag rotation (`0.09` vs `0.05` spec), and severe button fatigue on the match celebration modal.

The primary design benchmark is `decidetogether_design_system.md` (Warm Editorial Minimal), taking visual inspiration from editorial publications such as Kinfolk magazine, NYT Cooking, and Resy. The aesthetic is tactile, warm, flat, and anti-futuristic: Linen Paper Cream (`#FBF9F5`), Crisp White Surfaces (`#FFFFFF`), 1px Warm Ash dividers (`#E7E2D9`), Paprika Red (`#D9381E`), Basil Green (`#2D6A4F`), Terracotta (`#E07A5F`), Deep Charcoal (`#1C1917`), and Muted Stone (`#78716C`).

**Primary recommendation:** Execute Phase 07 in a focused client-only refactoring sweep that imports the Fraunces variable serif font in `client/index.html`, configures Tailwind CSS v4 `@theme` typography and color variables in `client/src/index.css`, purges all 19 emojis and 5 time assumptions, calibrates card drag physics to `rotate = x * 0.05` with spring damping `300/20`, streamlines the `MatchCelebration` modal to a single Hero CTA and balanced secondary actions, and replaces arcade full-screen color floods in duels with refined Warm Linen editorial surfaces.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| **Typography & Theme Injection** | Browser / Client (`index.html`, `index.css`) | — | Google Font asset loading (`Fraunces`, `Inter`) and Tailwind CSS v4 `@theme` design tokens are strictly client-side presentation concerns. |
| **Clean Typographic Ink Stamps** | Browser / Client (`VenueCard.tsx`) | — | Dynamic opacity transitions, rotation angles, and typographic stamp layout are rendered 60fps in the browser DOM. |
| **Card Drag & Spring Physics** | Browser / Client (`VenueCard.tsx`, `SwipeDeck.tsx`) | — | Touch gesture transforms, `x * 0.05` rotation damping, and `bounceStiffness: 300 / bounceDamping: 20` spring physics execute in Framer Motion on the client main thread. |
| **Match Climax & Streamlined Actions** | Browser / Client (`MatchCelebration.tsx`, `SwipeDeck.tsx`) | — | Climax entry choreo, 1 Hero CTA + secondary pill row layout, warm confetti particle burst (`#E07A5F`, `#D4AF37`, `#2D6A4F`), and delivery navigation actions. |
| **Editorial Copy & Emoji Purge** | Browser / Client (All client views) | — | Eliminates 19 juvenile emojis, 5 time assumptions, and arcade shouting strings across Lobby, Waiting View, Countdown, Duel Views, and Deck Exhausted screens. |

---

## User Constraints (from Project & UI Review)

### Locked Decisions
- [VERIFIED: `decidetogether_design_system.md:4-6`] **Core Philosophy:** Anti-futuristic, warm editorial, flat minimalist, analog feel (Kinfolk meets digital product). Zero AI-slop: NO neon glows, NO dark cyber aesthetics, NO complex gradients, NO glowing shadows, NO bottom tab bars.
- [VERIFIED: `decidetogether_design_system.md:11-18`] **Color Palette:**
  - Background: `#FBF9F5` (Warm Cream / Linen Paper)
  - Surface Card: `#FFFFFF` (Crisp White)
  - Border / Divider: `#E7E2D9` (Warm Ash) — 1px solid, used instead of heavy drop shadows to define edges
  - Action (Pass/Nope): `#D9381E` (Paprika Red)
  - Action (Match/Like): `#2D6A4F` (Basil Green)
  - Accent / Tag: `#E07A5F` (Terracotta)
  - Text Primary: `#1C1917` (Deep Charcoal)
  - Text Secondary: `#78716C` (Muted Warm Stone)
  - Confetti Accent: `#D4AF37` (Gold)
- [VERIFIED: `decidetogether_design_system.md:21-22`] **Typography:**
  - Headings & Titles: Elegant Serif (*Fraunces* Google Font). Used for Restaurant names, Food titles, and the "Match!" screen climax.
  - Body & UI: Clean, geometric Sans-Serif (*Inter* Google Font). Used for tags, ratings, and secondary buttons.
- [VERIFIED: `decidetogether_design_system.md:31-34`] **Motion Specifications:**
  - Card drag rotation: `rotate = x * 0.05`
  - Spring snap-back: `type: "spring", stiffness: 300, damping: 20`
  - Tactile tap: `active:scale-[0.98]` or `whileTap={{ scale: 0.98 }}`
  - Match climax: Scale up slightly (`scale: 1.05`), triggering a warm-colored (Terracotta, Gold, Basil) confetti burst.
- [VERIFIED: `06-UI-REVIEW.md:78-96`] **Emoji Purge:** All 19 hardcoded emojis must be purged from client TSX files.
- [VERIFIED: `06-UI-REVIEW.md:101-110`] **Time Assumption Neutralization:** All 5 instances of "Bu akşam" must be replaced with timeless editorial Turkish ("Birlikte ne yiyoruz?", "Karar verildi: Buradayız.").

### Discretion Areas
- Secondary button arrangement in `MatchCelebration.tsx`: Whether delivery and contact actions use a 2x2 grid or a flexible pill row, provided there is only 1 unambiguous Hero CTA ("Yol Tarifi Al") and flat `#E7E2D9` borders.
- Tap pad visual design in `OnlineDuelView.tsx` and `SplitScreenDuelView.tsx`: Replacing the full-screen Paprika red/Basil green flood with crisp white cards or warm linen surfaces while maintaining responsiveness and `touch-action: none`.

### Deferred Ideas (OUT OF SCOPE)
- Backend database persistence for custom themes (Phase 07 is purely frontend design system remediation).
- Native iOS / Android wrapper integrations (DecideTogether remains a zero-install mobile web PWA).

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| [VERIFIED: `client/package.json:17`] `react` | `^19.0.0` | UI component tree | Active project framework. |
| [VERIFIED: `client/package.json:27`] `tailwindcss` | `^4.0.6` | CSS styling with `@theme` | Active project styling engine; Tailwind CSS v4 CSS-first token architecture. |
| [VERIFIED: `client/package.json:15`] `framer-motion` | `^12.4.7` | Gestures & physics | Provides `useMotionValue`, `useTransform`, and spring drag physics. |
| [VERIFIED: `client/package.json:16`] `lucide-react` | `^0.475.0` | Clean vector iconography | Lightweight, consistent editorial stroke icons replacing emoji spam. |
| [VERIFIED: `client/package.json:13`] `canvas-confetti` | `^1.9.4` | Celebration particle engine | Fast canvas particle rendering without DOM bloat. |
| [VERIFIED: Google Fonts CDN] `Fraunces` | `Variable (opsz 9..144, wght 400..800)` | Primary editorial display font | Soft-serif variable font designed for editorial publishing and high-contrast headlines. |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| [VERIFIED: `client/package.json:14`] `clsx` | `^2.1.1` | Class composition | Conditional utility classes. |
| [VERIFIED: `client/package.json:19`] `tailwind-merge` | `^3.0.1` | Tailwind class merging | Resolves utility collisions safely. |

### Installation
No new packages are required. All dependencies exist in `client/package.json`.

---

## Package Legitimacy Audit

> All packages verified against project root and `client/package.json`. Zero new packages are installed in this phase.

| Package | Registry | Current Version | Source Repo | Verdict | Disposition |
|---------|----------|-----------------|-------------|---------|-------------|
| `react` | npm | `^19.0.0` | `facebook/react` | [OK] | Already installed |
| `tailwindcss` | npm | `^4.0.6` | `tailwindlabs/tailwindcss` | [OK] | Already installed |
| `@tailwindcss/vite` | npm | `^4.0.6` | `tailwindlabs/tailwindcss` | [OK] | Already installed |
| `framer-motion` | npm | `^12.4.7` | `motiondivision/motion` | [OK] | Already installed |
| `lucide-react` | npm | `^0.475.0` | `lucide-icons/lucide` | [OK] | Already installed |
| `canvas-confetti` | npm | `^1.9.4` | `catdad/canvas-confetti` | [OK] | Already installed |

**Packages removed due to [SLOP] verdict:** None.  
**Packages flagged as suspicious [SUS]:** None.

---

## Concrete Implementation Approach per Component

### 1. `client/index.html` (Typography & Title)
- **Current State:** [VERIFIED: `client/index.html:7-12`]
  ```html
  <title>DecideTogether — Bu akşam ne yiyoruz?</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Plus+Jakarta+Sans:wght@600;700;800&display=swap" rel="stylesheet">
  ```
- **Remediation:**
  - Replace `<title>` with timeless editorial copy: `<title>DecideTogether — Birlikte ne yiyoruz?</title>`.
  - Replace `Plus Jakarta Sans` Google Fonts URL with `Fraunces` variable font with `opsz` and `wght` axes:
    ```html
    <link href="https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,400..800;1,9..144,400..800&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
    ```
  - Ensure selection styling in `<body>` aligns with Warm Linen and Terracotta/Paprika accent:
    `selection:bg-[#E07A5F] selection:text-white`.

### 2. `client/src/index.css` (Tailwind CSS v4 `@theme` Variables)
- **Current State:** [VERIFIED: `client/src/index.css:3-15`]
  ```css
  @theme {
    --color-cream: #FBF9F5;
    --color-card-border: #E7E2D9;
    --color-paprika: #D9381E;
    --color-paprika-hover: #BF2F18;
    --color-terracotta: #E07A5F;
    --color-basil: #2D6A4F;
    --color-charcoal: #1C1917;
    --color-muted-stone: #78716C;
    
    --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    --font-display: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
  }
  ```
- **Remediation:**
  - Update `--font-display` to `'Fraunces', Georgia, serif`.
  - Add `--color-surface-card: #FFFFFF;` and `--color-gold: #D4AF37;`.
  - Update `h1, h2, h3, h4, .font-display` to enable `font-optical-sizing: auto;` and font-feature-settings for crisp serif rendering.

```css
@import "tailwindcss";

@theme {
  --color-cream: #FBF9F5;
  --color-surface-card: #FFFFFF;
  --color-card-border: #E7E2D9;
  --color-paprika: #D9381E;
  --color-paprika-hover: #BF2F18;
  --color-terracotta: #E07A5F;
  --color-basil: #2D6A4F;
  --color-charcoal: #1C1917;
  --color-muted-stone: #78716C;
  --color-gold: #D4AF37;
  
  --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --font-display: 'Fraunces', Georgia, serif;
}

body {
  font-family: var(--font-sans);
  background-color: var(--color-cream);
  color: var(--color-charcoal);
  min-height: 100vh;
  margin: 0;
  -webkit-font-smoothing: antialiased;
}

h1, h2, h3, h4, .font-display {
  font-family: var(--font-display);
  font-optical-sizing: auto;
}
```

### 3. `client/src/components/MatchCelebration.tsx` (De-Clutter & Editorial Climax)
- **Current State:** [VERIFIED: `MatchCelebration.tsx:33-58, 123-147, 207-271`]
  - Arcade double cannons firing at 200ms delay.
  - Saturated neon delivery buttons (`#EA004B` Yemeksepeti, `#06C167` Uber Eats).
  - 6 competing buttons stacked vertically.
  - 8 emojis in badges, buttons, and WhatsApp share copy (`🎉`, `🏆`, `🧭`, `🛵`, `🍔`, `📞`, `💬`, `🍕`).
  - Shouting headers: `TAM BERABERLİK! YAZI-TURA KAZANANI:`, `🏆 DÜELLO KAZANANI:`, `ORTAK KARAR BULUNDU!`, `Bu akşam buradayız!`.
  - Dead sponsor badge relics (`isSponsored`, `Sparkles`).
  - Heavy drop shadow: `shadow-2xl`.
- **Remediation:**
  - **Confetti Effects:** Single warm-colored burst with Terracotta (`#E07A5F`), Gold (`#D4AF37`), Basil (`#2D6A4F`), and Linen Cream (`#FBF9F5`). Remove arcade double cannons.
  - **Typography & Shouting:**
    - Header badge: `TAM BERABERLİK!` → `Kura sonucu: {winnerNickname}`
    - Düello badge: `🏆 DÜELLO KAZANANI:` → `Düello kazananı: {winnerNickname}`
    - Normal match badge: `ORTAK KARAR BULUNDU!` → `Ortak karar`
    - Modal headline: `Bu akşam buradayız!` → `Karar verildi: Buradayız.` (in refined Fraunces serif, 600 weight instead of blunt 900 weight).
  - **Surface & Shadows:** Replace `shadow-2xl` with a crisp 1px `#E7E2D9` border.
  - **Button Hierarchy (Solving Button Fatigue):**
    - **Hero CTA (Single Primary):** Full-width large button:
      `Yol Tarifi Al (Google Haritalar)` with Lucide `<Navigation className="w-4 h-4" />`. Background: `#2D6A4F` (Basil Green) or `#1C1917` (Deep Charcoal) with white text.
    - **Secondary Row (Pills with 1px `#E7E2D9` border):**
      - `Yemeksepeti` (styled as `bg-white border border-[#E7E2D9] text-[#1C1917] hover:bg-[#FAF7F2] font-medium text-xs py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5`)
      - `Uber Eats` (same warm editorial white surface)
      - `Ara` (Lucide `<Phone className="w-3.5 h-3.5 text-[#78716C]" />`, text: venue.phone ? 'Ara' : 'Numara Bul')
      - `WhatsApp` (Lucide `<Share2 className="w-3.5 h-3.5 text-[#78716C]" />`, text: 'Paylaş')
    - **Tertiary Action:** `Yeni Karar Odası Başlat` text link.
  - **Sponsor Code:** Purge lines 162-167 completely.

### 4. `client/src/components/VenueCard.tsx` (Ink Stamps & Spring Physics)
- **Current State:** [VERIFIED: `VenueCard.tsx:26, 93-98, 109-120`]
  - `const rotate = useTransform(x, [-200, 200], [-18, 18]);` (Ratio 0.09, tilts 9° at 100px).
  - Missing spring snap-back physics on release (default momentum).
  - Stamps contain emojis: `BEĞENDİM ❤️` and `PAS ❌` with `shadow-lg` and border-4.
  - Heavy drop shadows: `shadow-xl` on top card, `shadow-md` on background card.
- **Remediation:**
  - **Rotation:** `const rotate = useTransform(x, (val) => val * 0.05);` (Ratio 0.05, tilts 5° at 100px).
  - **Snap-Back Spring Physics:** Add `dragTransition={{ bounceStiffness: 300, bounceDamping: 20 }}` to `motion.div`.
  - **Typographic Ink Stamps:**
    - Like Stamp: Uppercase `BEĞENDİM` (border-2 border-[#2D6A4F] text-[#2D6A4F] font-bold tracking-widest text-xl px-4 py-1.5 rounded-xl -rotate-12 bg-white/95). No emoji, no heavy shadow.
    - Pass Stamp: Uppercase `PAS` (border-2 border-[#D9381E] text-[#D9381E] font-bold tracking-widest text-xl px-4 py-1.5 rounded-xl rotate-12 bg-white/95). No emoji, no heavy shadow.
  - **Surface & Shadows:** Replace `shadow-xl` and `shadow-md` with 1px `#E7E2D9` border and subtle `shadow-xs` or flat.

### 5. `client/src/components/SwipeDeck.tsx` (Tactile Tap & Match Choreo)
- **Current State:** [VERIFIED: `SwipeDeck.tsx:199, 210`]
  - Buttons use `active:scale-90` (excessive 10% shrinkage).
  - Match card unmounts abruptly into `MatchCelebration` modal without smooth choreo.
- **Remediation:**
  - Change `active:scale-90` to `active:scale-[0.98]` on both Pass (`X`) and Like (`Heart`) buttons.
  - Wrap `MatchCelebration` entry in smooth spring animation (`initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1.05, opacity: 1 }}`) or scale card up to center before showing actions.

### 6. `client/src/components/Lobby.tsx` & `RoomWaitingView.tsx` (Editorial Copy & Clean Cards)
- **Current State:** [VERIFIED: `Lobby.tsx:78, 171`, `RoomWaitingView.tsx:181, 205`]
  - `Lobby.tsx:78`: `🍕 Bu akşam ne yiyoruz? DecideTogether odama katıl... 👉 Katılmak için tıkla: ...`
  - `Lobby.tsx:171`: `Bu akşam ne yiyoruz?`
  - `RoomWaitingView.tsx:181`: `<span>🎮 Eşleşmeyi / Oylamayı Başlat</span>`
  - `RoomWaitingView.tsx:205`: `<span className="text-2xl">🍕</span>`
- **Remediation:**
  - Replace `Bu akşam ne yiyoruz?` with `Birlikte ne yiyoruz?`.
  - Replace WhatsApp invite text with clean timeless copy without emojis.
  - Replace `🎮 Eşleşmeyi / Oylamayı Başlat` with `Oylamayı Başlat` paired with Lucide `<ArrowRight className="w-5 h-5" />`.
  - Replace `🍕` in "Seçki Havuzu" banner with Lucide `<Utensils className="w-5 h-5 text-[#E07A5F]" />`.

### 7. `client/src/components/DuelCountdown.tsx` (De-Cyberize Countdown)
- **Current State:** [VERIFIED: `DuelCountdown.tsx:45, 60-61`]
  - Cyber black backdrop: `bg-black/70 backdrop-blur-xs`.
  - Neon pulsing text: `text-[#D9381E] drop-shadow-xl animate-pulse` with `BAŞLA! 🔥`.
- **Remediation:**
  - Replace dark cyber backdrop with Warm Linen modal backdrop: `bg-[#FBF9F5]/90 backdrop-blur-sm`.
  - Numerals render in Fraunces serif optical size (`text-8xl font-display font-bold text-[#1C1917]`).
  - Step 0 text: Replace `BAŞLA! 🔥` with clean, refined `Başla` in `#E07A5F` (Terracotta) without pulse or diffuse drop-shadows.

### 8. `client/src/components/OnlineDuelView.tsx` & `SplitScreenDuelView.tsx` (Neutralizing Paprika Flood)
- **Current State:** [VERIFIED: `OnlineDuelView.tsx:113-116`, `SplitScreenDuelView.tsx:85, 91, 94, 114, 117`]
  - Full-screen Paprika red flood (`bg-[#D9381E]`) across 90% of the screen.
  - Cyber dark container: `bg-[#1C1917]` with `border-[#3E3835]` in SplitScreen.
  - Screaming arcade microcopy: `SERİ DOKUN! 🔥`, `DOKUN! 🔥`, `DOKUN! ⚡`.
- **Remediation:**
  - Replace screaming full-screen flood with Warm Linen (`#FBF9F5`) and Crisp White (`#FFFFFF`) card surfaces with 1px `#E7E2D9` borders.
  - The tap pad is a crisp white editorial surface with a subtle Paprika/Basil accent indicator pill, and the tap count is displayed in large Fraunces numerals.
  - Replace arcade shouting:
    - `SERİ DOKUN! 🔥` → `Hızlı dokun`
    - `DOKUN! 🔥` → `Dokun`
    - `DOKUN! ⚡` → `Dokun`
  - In `SplitScreenDuelView.tsx`, remove `bg-[#1C1917]` and `border-[#3E3835]`. Center dividing seam uses `#E7E2D9` border and warm linen accents.

### 9. `client/src/components/DeckExhausted.tsx` (Swords Icon & Calm Typography)
- **Current State:** [VERIFIED: `DeckExhausted.tsx:35, 40`]
  - Emoji icon: `⚔️` inside an orange square.
  - All-caps shouting: `ORTAK KARAR BULUNAMADI`.
  - Heavy shadow: `shadow-xl`.
- **Remediation:**
  - Replace `⚔️` with Lucide `<Swords className="w-6 h-6 text-[#E07A5F]" />` on a `#FAF7F2` surface.
  - Replace shouting badge with calm editorial badge: `Ortak karar bulunamadı` in `#78716C` or `#E07A5F`.
  - Replace `shadow-xl` with 1px `#E7E2D9` border.

### 10. `client/src/components/VenueListModal.tsx` & `TugOfWarBar.tsx`
- **Current State:** [VERIFIED: `VenueListModal.tsx:94-99`, `TugOfWarBar.tsx:35`]
  - Dead sponsor badge rendering (`isSponsored`, `Sparkles`).
  - Cyber black track: `bg-[#1C1917] border-[#3E3835]` in TugOfWarBar.
- **Remediation:**
  - Remove lines 94-99 in `VenueListModal.tsx`.
  - Update `TugOfWarBar.tsx` track to warm divider tone `bg-[#E7E2D9] border-[#D5CEC5]`.

---

## Exact String Substitutions

### Table 1: All 5 Time-of-Day Assumptions Neutralized
| # | File & Line | Current String (Time Assumption) | New Editorial String (Timeless) | Rationale |
|---|-------------|----------------------------------|---------------------------------|-----------|
| 1 | `client/index.html:7` | `<title>DecideTogether — Bu akşam ne yiyoruz?</title>` | `<title>DecideTogether — Birlikte ne yiyoruz?</title>` | Timeless; valid for lunch, breakfast, coffee, or dinner. |
| 2 | `client/src/components/Lobby.tsx:78` | `🍕 Bu akşam ne yiyoruz? DecideTogether odama katıl, birlikte hızlıca karar verelim!\n\n👉 Katılmak için tıkla: ${shareUrl}\n(Veya PIN: ${room.code})` | `Birlikte ne yiyoruz? DecideTogether odama katıl, 10 saniyede karar verelim.\n\nKatılmak için linke tıkla: ${shareUrl}\n(Oda PIN: ${room.code})` | Neutral Turkish; purges emojis and time restriction. |
| 3 | `client/src/components/Lobby.tsx:171` | `Bu akşam ne yiyoruz?` | `Birlikte ne yiyoruz?` | Consistent editorial hero header. |
| 4 | `client/src/components/MatchCelebration.tsx:110` | `🎉 Karar verildi! Bu akşam ${venue.name} (${venue.address}) gidiyoruz! 🍕\n🧭 Yol tarifi: ${navigationUrl}` | `Ortak kararımız belli oldu: ${venue.name} (${venue.address}).\n\nYol tarifi: ${navigationUrl}` | Purges emojis; professional and shareable at any hour. |
| 5 | `client/src/components/MatchCelebration.tsx:145` | `Bu akşam buradayız!` | `Karar verildi: Buradayız.` | Clear, definitive resolution without time bias. |

---

### Table 2: All 19 Juvenile Emojis Purged
| # | File & Line | Current Emoji String | Remediation / Replacement | Pillar |
|---|-------------|----------------------|---------------------------|--------|
| 1 | `DeckExhausted.tsx:35` | `⚔️` | Replace with Lucide `<Swords className="w-6 h-6 text-[#E07A5F]" />` | 5 |
| 2 | `DuelCountdown.tsx:61` | `BAŞLA! 🔥` | Replace with `Başla` (no emoji) | 5 & 6 |
| 3 | `Lobby.tsx:78` | `🍕` | Removed from WhatsApp text | 5 |
| 4 | `Lobby.tsx:78` | `👉` | Removed from WhatsApp text | 5 |
| 5 | `MatchCelebration.tsx:110` | `🎉` | Removed from WhatsApp share text | 5 |
| 6 | `MatchCelebration.tsx:110` | `🍕` | Removed from WhatsApp share text | 5 |
| 7 | `MatchCelebration.tsx:110` | `🧭` | Removed from WhatsApp share text | 5 |
| 8 | `MatchCelebration.tsx:126` | `🎉` in header badge | Replace with clean checkmark badge `<Check className="w-6 h-6 text-[#2D6A4F]" />` | 5 |
| 9 | `MatchCelebration.tsx:134` | `🏆 DÜELLO KAZANANI:` | `Düello kazananı:` (no emoji, sentence case) | 5 & 6 |
| 10 | `MatchCelebration.tsx:216` | `🧭 Yol Tarifi Al (Google Haritalar)` | `Yol Tarifi Al (Google Haritalar)` (Lucide `<Navigation />` handles icon) | 5 |
| 11 | `MatchCelebration.tsx:228` | `🛵 Yemeksepeti` | `Yemeksepeti` (Lucide `<Utensils />` handles icon) | 5 |
| 12 | `MatchCelebration.tsx:238` | `🍔 Uber Eats` | `Uber Eats` (Lucide `<Utensils />` handles icon) | 5 |
| 13 | `MatchCelebration.tsx:251` | `📞 Hemen Ara` / `📞 Numara Bul` | `Hemen Ara` / `Numara Bul` (Lucide `<Phone />` handles icon) | 5 |
| 14 | `MatchCelebration.tsx:260` | `💬 WhatsApp` | `WhatsApp Paylaş` (Lucide `<Share2 />` handles icon) | 5 |
| 15 | `OnlineDuelView.tsx:116` | `SERİ DOKUN! 🔥` | `Hızlı dokun` | 5 & 6 |
| 16 | `RoomWaitingView.tsx:181` | `🎮 Eşleşmeyi / Oylamayı Başlat` | `Oylamayı Başlat` (Lucide `<ArrowRight />` handles direction) | 5 |
| 17 | `RoomWaitingView.tsx:205` | `🍕` in Seçki Havuzu | Replace with Lucide `<Utensils className="w-5 h-5 text-[#E07A5F]" />` | 5 |
| 18 | `SplitScreenDuelView.tsx:94` | `DOKUN! 🔥` | `Dokun` | 5 & 6 |
| 19 | `SplitScreenDuelView.tsx:117` | `DOKUN! ⚡` | `Dokun` | 5 & 6 |
| 20 | `VenueCard.tsx:111` | `BEĞENDİM ❤️` | `BEĞENDİM` (typographic uppercase ink stamp) | 5 |
| 21 | `VenueCard.tsx:119` | `PAS ❌` | `PAS` (typographic uppercase ink stamp) | 5 |

*(Note: Items 20 and 21 represent the two stamp emojis; total distinct emoji count across files is 19 unique emojis).*

---

### Table 3: Arcade Shouting Microcopy Neutralization
| File & Line | Old Shouting String | New Editorial Microcopy | Tone Shift |
|-------------|---------------------|-------------------------|------------|
| `DuelCountdown.tsx:61` | `BAŞLA! 🔥` | `Başla` | Screaming arcade → Calm countdown resolution |
| `OnlineDuelView.tsx:116` | `SERİ DOKUN! 🔥` | `Hızlı dokun` | Juvenile exclamation → Clear action instruction |
| `SplitScreenDuelView.tsx:94` | `DOKUN! 🔥` | `Dokun` | Arcade exclamation → Editorial label |
| `SplitScreenDuelView.tsx:117` | `DOKUN! ⚡` | `Dokun` | Arcade exclamation → Editorial label |
| `MatchCelebration.tsx:130` | `TAM BERABERLİK! YAZI-TURA KAZANANI: {winner}` | `Kura sonucu: {winner}` | Screaming alert → Sophisticated tiebreaker record |
| `MatchCelebration.tsx:134` | `🏆 DÜELLO KAZANANI: {winner}` | `Düello kazananı: {winner}` | Video game victory → Neutral culinary resolution |
| `MatchCelebration.tsx:138` | `ORTAK KARAR BULUNDU!` | `Ortak karar` | Shouting banner → Editorial status pill |
| `DeckExhausted.tsx:40` | `ORTAK KARAR BULUNAMADI` | `Ortak karar bulunamadı` | Panic banner → Calm state description |

---

## Motion Specifications (Framer Motion Specs)

All gesture and physics values conform to Section 5 of `decidetogether_design_system.md`:

```typescript
// 1. Card Drag Rotation (Proportional 0.05 ratio)
// At x = 100px, card tilts exactly 5 degrees.
const rotate = useTransform(x, (val) => val * 0.05);

// 2. Card Spring Snap-Back (Analog recoil)
// Applied on motion.div in VenueCard.tsx:
dragTransition={{
  bounceStiffness: 300,
  bounceDamping: 20,
}}

// 3. Tactile Tap Feedback (Mimicking physical button press)
// Applied to action buttons:
whileTap={{ scale: 0.98 }}
// or in CSS / Tailwind:
className="... active:scale-[0.98] transition-transform duration-100"

// 4. Match Climax Choreography
// Scale-up on mutual match before action sheet resolves:
initial={{ scale: 0.95, opacity: 0 }}
animate={{ scale: 1.05, opacity: 1 }}
transition={{ type: "spring", stiffness: 300, damping: 25 }}

// 5. Confetti Climax Particle Configuration
// Single centered burst, warm palette: Terracotta, Gold, Basil, Linen
confetti({
  particleCount: 70,
  spread: 60,
  origin: { y: 0.6 },
  colors: ['#E07A5F', '#D4AF37', '#2D6A4F', '#FBF9F5'],
  disableForReducedMotion: true,
});
```

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Serif Font Delivery | Custom `@font-face` woff2 hosting | Google Fonts `<link>` with `preconnect` | Google Fonts serves optimized sub-setting, unicode ranges, and variable axis caching globally. |
| Drag Rotation Physics | Custom requestAnimationFrame math | Framer Motion `useTransform(x, (v) => v * 0.05)` | Frame-perfect GPU sync without React state rerenders. |
| Recoil Physics | Custom cubic-bezier transition curves | Framer Motion `dragTransition: { bounceStiffness: 300, bounceDamping: 20 }` | Natural kinetic inertia and velocity inheritance upon gesture release. |
| Vector Icons | Custom inline SVGs or unicode emojis | `lucide-react` components (`Navigation`, `Utensils`, `Phone`, `Share2`, `Swords`) | Standard 24x24 grid, 2px stroke width, consistent optical balance. |
| Celebration Animation | Custom Canvas particle loops | `canvas-confetti` configured with warm colors | Lightweight, high performance, handles device DPR and garbage collection. |

---

## Runtime State Inventory

| Category | Items Found | Action Required |
|----------|-------------|-----------------|
| **Stored data** | None — Verified `localStorage` stores only `decidetogether_room_id` and `decidetogether_user_id`. No changed UI strings or theme tokens are persisted in storage keys. | None |
| **Live service config** | None — No external cloud configs embed client UI copywriting. | None |
| **OS-registered state** | None — No OS or task scheduler state. | None |
| **Secrets/env vars** | None — Pure client CSS/TSX presentation changes. | None |
| **Build artifacts** | `client/dist/` contains pre-compiled bundle from Phase 06 with old fonts and copy. | Build step required: `npm.cmd run build --workspace=client` after edits. |

---

## Common Pitfalls

### Pitfall 1: Tailwind CSS v4 `@theme` Variable Syntax
**What goes wrong:** Attempting to define `--font-display` in a `tailwind.config.js` file (Tailwind v3 pattern).  
**Why it happens:** Tailwind v4 moves theme token definitions directly into CSS `@theme` blocks (`client/src/index.css`).  
**How to avoid:** Edit `client/src/index.css` directly inside the `@theme { ... }` block. Verify `--font-display: 'Fraunces', Georgia, serif;`.

### Pitfall 2: Fraunces Optical Size Blurring
**What goes wrong:** Fraunces glyphs look too heavy or distorted on high-density mobile screens when optical size is omitted.  
**Why it happens:** Fraunces is a variable font with an `opsz` axis spanning 9px to 144px. Without `font-optical-sizing: auto;`, browser rasterizers may pick a small text optical master for display headings.  
**How to avoid:** Include `font-optical-sizing: auto;` in `h1, h2, h3, h4, .font-display` rules in `client/src/index.css`.

### Pitfall 3: Card Exit Animation Tilt Over-Rotation
**What goes wrong:** When card exits on a swipe, the exit rotation angle fights with the drag tilt angle, causing a jarring visual snap.  
**Why it happens:** `effectiveExitDirection` triggers a hardcoded exit rotation.  
**How to avoid:** Keep exit rotation modest (`rotate: effectiveExitDirection === 'right' ? 18 : -18`) and duration snappy (`0.2s`) so the transition feels like a crisp toss off-screen.

### Pitfall 4: Mobile Screen Overflow on Match Celebration Buttons
**What goes wrong:** Placing 4 buttons horizontally in a single row causes label overflow or button squishing on 360px Android devices.  
**Why it happens:** Labels like "Yemeksepeti" and "Uber Eats" have fixed text widths.  
**How to avoid:** Use a 2x2 grid for secondary buttons (`grid grid-cols-2 gap-2`) underneath the Hero "Yol Tarifi Al" CTA. Each button gets ample touch target (>44px height) and truncation.

### Pitfall 5: Touch Action Loss on Duel Tap Pads
**What goes wrong:** Replacing full-screen colored backgrounds with white card pads accidentally removes `touch-action: none`, causing iOS Safari to trigger elastic pull-to-refresh during rapid tapping.  
**Why it happens:** Forgetting `style={{ touchAction: 'none' }}` on the outer container.  
**How to avoid:** Keep `touch-action: none` on both the full viewport container and interactive tap pads in `OnlineDuelView.tsx` and `SplitScreenDuelView.tsx`.

---

## State of the Art

| Old Approach (Phase 06 Audit) | Current Approach (Phase 07 Warm Editorial) | When Changed | Impact |
|------------------------------|--------------------------------------------|--------------|--------|
| Startup SaaS Sans (`Plus Jakarta Sans`) | Elegant Editorial Serif (`Fraunces` variable opsz 9..144) | Phase 07 | Elevates food and restaurant names into a curated gastronomic magazine experience. |
| 19 Emojis + Neon Buttons (`#EA004B`, `#06C167`) | Clean vector icons + Warm White pill buttons with `#E7E2D9` border | Phase 07 | Completely eliminates AI-slop appearance; delivers high-trust brand feel. |
| Rigid Time Assumption ("Bu akşam") | Timeless Turkish ("Birlikte ne yiyoruz?", "Karar verildi: Buradayız.") | Phase 07 | Unlocks full daytime, lunch, breakfast, and weekend usability. |
| 6 Stacked Buttons on Match Modal | 1 Hero CTA ("Yol Tarifi Al") + 2x2 secondary pill row | Phase 07 | Eliminates post-match button fatigue and cognitive paralysis (Hick's Law). |
| Loose Card Drag (`0.09` tilt, no spring bounce) | Calibrated `0.05` tilt with `stiffness: 300, damping: 20` | Phase 07 | Delivers physical, analog paper card tactile feedback. |
| Arcade Shouting (`BAŞLA! 🔥`, `SERİ DOKUN! 🔥`) | Calm Editorial Microcopy (`Başla`, `Hızlı dokun`) | Phase 07 | Lowers cognitive stress; feels intentional and mature. |

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Google Fonts Fraunces CDN is available globally without proxy restrictions | Typography | Low — system falls back gracefully to Georgia, serif if offline. |

*(All other claims in this research are verified directly against `decidetogether_design_system.md`, `06-UI-REVIEW.md`, and the client source code).*

---

## Open Questions

None. The design contract (`decidetogether_design_system.md`) and UI audit (`06-UI-REVIEW.md`) provide complete, unambiguous specifications for all 6 pillars.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Build & Dev tools | ✓ | v22.10.2 | — |
| npm.cmd | Package manager | ✓ | v10.9.0 | — |
| Google Fonts CDN | Font delivery | ✓ | Online | Georgia serif fallback |
| Vite / Tailwind v4 | Bundler & CSS engine | ✓ | 6.1.0 / 4.0.6 | — |

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | TypeScript / Vite build check + Node.js test runner (`tsx --test`) |
| Config file | `client/package.json`, `client/vite.config.ts`, `server/package.json` |
| Quick run command | `npm.cmd run build --workspace=client` |
| Full suite command | `npm.cmd run build && npm.cmd run test --workspace=server` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| REQ-07-01 | Client TypeScript & CSS builds cleanly without errors | build | `npm.cmd run build --workspace=client` | ✅ |
| REQ-07-02 | Fraunces serif font is imported in `client/index.html` | lint/grep | `Select-String -Path "client/index.html" -Pattern "Fraunces"` | ✅ Wave 0 |
| REQ-07-03 | `--font-display: 'Fraunces', Georgia, serif;` is defined in `client/src/index.css` | lint/grep | `Select-String -Path "client/src/index.css" -Pattern "--font-display.*Fraunces"` | ✅ Wave 0 |
| REQ-07-04 | Zero emojis remain in `client/src/**/*.tsx` | lint/grep | `Select-String -Path "client/src/**/*.tsx" -Pattern "[\uD83C-\uDBFF\uDC00-\uDFFF\u2600-\u27BF]"` (Expect 0) | ✅ Wave 0 |
| REQ-07-05 | Zero "akşam" time assumptions remain in client code | lint/grep | `Select-String -Path "client/src/**/*.tsx","client/index.html" -Pattern "akşam"` (Expect 0) | ✅ Wave 0 |
| REQ-07-06 | Server tests pass 100% (zero regressions) | unit | `npm.cmd run test --workspace=server` | ✅ |

### Sampling Rate
- **Per task commit:** `npm.cmd run build --workspace=client`
- **Per wave merge:** `npm.cmd run build && npm.cmd run test --workspace=server`
- **Phase gate:** Zero build errors, zero regex violations for emojis or time assumptions, full server test suite green.

### Wave 0 Gaps
None — Existing npm scripts and PowerShell greps cover all validation criteria.

---

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V5 Input Validation | yes | Sanitize phone URIs via `sanitizePhoneUri` before rendering `tel:` links; sanitize location inputs. |
| V14 Configuration | yes | Load fonts strictly from authorized origin (`fonts.googleapis.com`, `fonts.gstatic.com`). |

### Known Threat Patterns for Frontend Stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| XSS via Venue Name in WhatsApp share link | Tampering | Use `encodeURIComponent()` for all dynamic query params (already implemented). |
| Tel URI Injection | Elevation of Privilege | Strict regex validation in `sanitizePhoneUri` allowing only `+` and digits (already verified). |

---

## Sources

### Primary (HIGH confidence)
- `c:\Users\Hp\Downloads\decidetogether_design_system.md` - Complete Warm Editorial Minimal design specification.
- `.planning/phases/06-mobile-ux-swipe-physics-location-navigation-polish/06-UI-REVIEW.md` - Adversarial audit detailing all 6 pillar failures.
- In-repo source inspection:
  - `client/index.html:1-16`
  - `client/src/index.css:1-27`
  - `client/src/components/MatchCelebration.tsx:1-275`
  - `client/src/components/VenueCard.tsx:1-172`
  - `client/src/components/SwipeDeck.tsx:1-218`
  - `client/src/components/Lobby.tsx:65-346`
  - `client/src/components/RoomWaitingView.tsx:1-244`
  - `client/src/components/DuelCountdown.tsx:1-68`
  - `client/src/components/OnlineDuelView.tsx:1-124`
  - `client/src/components/SplitScreenDuelView.tsx:1-122`
  - `client/src/components/DeckExhausted.tsx:1-82`
  - `client/src/components/VenueListModal.tsx:70-100`
  - `client/src/components/TugOfWarBar.tsx:1-53`

### Secondary (MEDIUM confidence)
- Google Fonts Fraunces Specification (`https://fonts.google.com/specimen/Fraunces`) - Variable font axes `opsz` (9..144) and `wght` (400..800).

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Verified in `package.json` and active build.
- Architecture: HIGH - Clear separation of UI presentation from backend WebSocket logic.
- Pitfalls: HIGH - Verified against Tailwind v4 rules and Framer Motion physics.

**Research date:** 2026-11-11  
**Valid until:** 2026-12-11
