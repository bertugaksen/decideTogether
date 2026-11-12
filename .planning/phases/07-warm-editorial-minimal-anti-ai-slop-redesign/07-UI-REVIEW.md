# Phase 07 — Adversarial UI & Interaction Review: DecideTogether

**Audited:** 2026-11-11  
**Baseline:** `decidetogether_design_system.md` (Warm Editorial Minimal) & Phase 06 UI Review Baseline (10/24)  
**Screenshots:** Captured (`desktop.png`, `mobile.png`, `tablet.png`, `room-waiting-mobile.png`, `room-waiting-desktop.png`, `swipe-deck-mobile.png`, `swipe-deck-desktop.png`, `match-celebration-mobile.png`, `match-celebration-desktop.png` in `.planning/ui-reviews/07-review/`)

---

## Pillar Scores

| Pillar | Score | Key Finding |
|--------|-------|-------------|
| 1. Copywriting | 4/4 | 100% of "Bu akşam" time assumptions and shouty duel copy purged; timeless editorial Turkish throughout. |
| 2. Visuals | 3/4 | Kinfolk hierarchy restored; MatchCelebration streamlined to 1 Hero CTA + 2x2 pills; residual `shadow-xl` remains in secondary modals. |
| 3. Color | 4/4 | 60/30/10 palette strictly enforced; neon gradients (`#EA004B`, `#06C167`) and red/cyber floods completely eradicated. |
| 4. Typography | 4/4 | Fraunces variable serif active with optical sizing for all headings, restaurant titles, and celebration climax; startup sans eliminated. |
| 5. Spacing | 3/4 | Consistent Tailwind spacing scale throughout; card max-width (340px) leaves narrow side margins on 375px viewports. |
| 6. Experience Design | 3/4 | 0.05 tilt rotation and 300/20 spring recoil feel authentic; duplicate `useRoomSocket()` hook call creates ghost socket in Lobby. |

**Overall: 21/24** (Substantial Upgrade from Phase 06 Baseline: +11 points)

---

## Top 3 Priority Fixes

1. **Eliminate Duplicate `useRoomSocket()` Hook Call in `Lobby.tsx` (Pillar 6 - Warning)**  
   - *User Impact:* `Lobby.tsx` (line 16) calls `const localSocket = useRoomSocket();` unconditionally even when `socket` is passed via props from `App.tsx`. This instantiates a ghost WebSocket connection that is immediately abandoned, generating WebSocket closure errors in browser console logs and causing the connection badge to intermittently show "Bağlanıyor...".  
   - *Concrete Fix:* In `client/src/components/Lobby.tsx`, make `socket: ReturnType<typeof useRoomSocket>` a required prop (or provide it via a `RoomSocketContext`), and remove `const localSocket = useRoomSocket();`.

2. **Purge Residual `shadow-xl` from Secondary Modals (Pillar 2 - Warning)**  
   - *User Impact:* While `MatchCelebration`, `VenueCard`, `SwipeDeck`, and `DeckExhausted` were successfully migrated to flat 1px `#E7E2D9` Warm Ash borders, `DistrictSelector.tsx` (line 97) and `VenueListModal.tsx` (line 29) still render diffuse `shadow-xl`, clashing with the paper-like minimalist surface contract.  
   - *Concrete Fix:* In `DistrictSelector.tsx` line 97 and `VenueListModal.tsx` line 29, replace `shadow-xl` with crisp 1px borders (`border border-[#E7E2D9] shadow-xs`).

3. **Provide Generous Side Whitespace on Compact Mobile Viewports (Pillar 5 - Minor)**  
   - *User Impact:* On 375px viewports (iPhone SE / mini devices), the card width `w-full max-w-[340px]` inside `px-4` leaves only ~1.5px side margin between the card edge and viewport bounds, compressing the editorial negative space.  
   - *Concrete Fix:* In `client/src/components/SwipeDeck.tsx` line 201, change the container to `w-[calc(100vw-36px)] max-w-[340px]` to guarantee at least 18px of Warm Linen border whitespace on compact screens.

---

## Detailed Findings

### Pillar 1: Copywriting (4/4)
- **Time-of-Day Assumption Purged (100%):** Zero occurrences of "akşam" remain across all source files and HTML titles.
  - Page title and Lobby hero now read: `"Birlikte ne yiyoruz?"` (timeless for lunch, coffee, or dinner).
  - Match celebration dialog header reads: `"Karar verildi: Buradayız."`
  - WhatsApp share text: `"Ortak kararımız belli oldu: {venue.name} ({venue.address}). Yol tarifi: {navigationUrl}"`.
- **Arcade Screaming Eliminated (100%):** All loud, all-caps strings have been replaced with calm editorial phrasing:
  - `BAŞLA! 🔥` replaced with clean `Başla` in Terracotta `#E07A5F` (`DuelCountdown.tsx:61`).
  - `SERİ DOKUN! 🔥` replaced with `Hızlı dokun` in Muted Stone `#78716C` (`OnlineDuelView.tsx:119`).
  - `DOKUN! 🔥` / `DOKUN! ⚡` replaced with calm `Dokun` (`SplitScreenDuelView.tsx:100, 129`).
  - `TAM BERABERLİK! YAZI-TURA KAZANANI:` replaced with `Kura sonucu: {winner}` (`MatchCelebration.tsx:112`).
  - `🏆 DÜELLO KAZANANI:` replaced with `Düello kazananı: {winner}` (`MatchCelebration.tsx:116`).
  - `ORTAK KARAR BULUNDU!` replaced with `Ortak karar` badge (`MatchCelebration.tsx:120`).
  - `ORTAK KARAR BULUNAMADI` replaced with `Ortak karar bulunamadı` badge (`DeckExhausted.tsx:40`).
- **Standardized Microcopy:** Action labels are descriptive and respectful: `"Oylamayı Başlat"`, `"Yol Tarifi Al (Google Haritalar)"`, `"Parmak Güreşini Başlat"`, `"Yan Yana Oyna (Tek Telefon)"`, `"Odadan Ayrıl"`.

### Pillar 2: Visuals (3/4)
- **Kinfolk Editorial Focal Point:** Only one card occupies focus on the swipe screen against negative Warm Linen (`#FBF9F5`) space, perfectly fulfilling design system Section 4.
- **MatchCelebration Clutter Resolved:** The previous 6-button fatigue trap in `MatchCelebration.tsx` has been restructured into a refined 2-tier hierarchy:
  1. **Single Hero CTA:** Full-width `#2D6A4F` Basil Green button for `"Yol Tarifi Al (Google Haritalar)"` with Lucide `<Navigation />`.
  2. **2x2 Secondary Pill Grid:** Crisp white pills with 1px `#E7E2D9` borders for Yemeksepeti, Uber Eats, Hemen Ara, and WhatsApp Paylaş.
  3. **Tertiary Subdued Link:** `"Yeni Karar Odası Başlat"` centered at the bottom.
- **Typographic Ink Stamps:** In `VenueCard.tsx` (lines 110-121), juvenile emojis (`❤️`, `❌`) were replaced by clean uppercase ink stamps:
  - `BEĞENDİM`: 2px `#2D6A4F` border, `-rotate-12`, uppercase tracking-widest, `bg-white/95`.
  - `PAS`: 2px `#D9381E` border, `rotate-12`, uppercase tracking-widest, `bg-white/95`.
- **Warning / Residual Shadow Issue:** While primary components use flat 1px borders, `DistrictSelector.tsx` (line 97) and `VenueListModal.tsx` (line 29) still specify `shadow-xl`.

### Pillar 3: Color (4/4)
- **60/30/10 Ratio Compliant:**
  - **60% Primary Surfaces:** Warm Linen `#FBF9F5` background, Crisp White `#FFFFFF` card surfaces.
  - **30% Structural Secondary:** Deep Charcoal `#1C1917` editorial text and 1px Warm Ash `#E7E2D9` divider borders.
  - **10% Action Accents:** Basil Green `#2D6A4F` for Match actions and Google Maps hero CTA; Paprika Red `#D9381E` reserved strictly for Pass stamp and duel initiation; Terracotta `#E07A5F` for cuisine categories and countdown highlights.
- **Neon Brand Hues Purged:** Saturated brand colors `#EA004B` (Yemeksepeti pink) and `#06C167` (Uber Eats green) are completely gone (0 matches across repo). Delivery options render as white editorial pills with subtle neutral Lucide icons.
- **Aggressive Floods Removed:** The full-screen Paprika red flood in `OnlineDuelView` and the dark cyber `bg-[#1C1917]` / `border-[#3E3835]` styling in `SplitScreenDuelView` were completely replaced with warm linen paper and white card surfaces.

### Pillar 4: Typography (4/4)
- **Fraunces Serif Active:**
  - `client/index.html` loads Google Font `Fraunces:ital,opsz,wght@0,9..144,400..800;1,9..144,400..800` alongside `Inter:wght@400;500;600`.
  - `client/src/index.css` configures `--font-display: 'Fraunces', Georgia, serif;` with `font-optical-sizing: auto;` applied across `h1, h2, h3, h4, .font-display`.
  - Runtime verification via browser evaluation confirms computed font-family: `"Fraunces, Georgia, serif"` on headers and card titles.
- **Typographic Hierarchy:**
  - Restaurant title: `font-display font-bold text-2xl text-[#1C1917]` (`VenueCard.tsx:151`).
  - Celebration climax: `font-display font-semibold text-2xl text-[#1C1917]` (`MatchCelebration.tsx:145`).
  - Duel countdown numerals: `font-display font-bold text-8xl text-[#1C1917]` (`DuelCountdown.tsx:56`).
  - Duel tally counters: `font-display font-bold text-6xl text-[#1C1917] tabular-nums` (`OnlineDuelView.tsx:121`).
  - Body & UI utility: `font-sans` (Inter) for tags, ratings, addresses, and buttons.
- **Blunt 900 Weight Replaced:** The previous `font-black text-2xl` on MatchCelebration was replaced with refined `font-semibold text-2xl`. (PIN display correctly maintains `font-black text-5xl` for clear readability).

### Pillar 5: Spacing (3/4)
- **Scale Distribution:** Analysis of spacing tokens confirms standard Tailwind spacing scale usage (`gap-2`: 18, `px-4`: 16, `px-3`: 13, `gap-1.5`: 13, `p-6`: 8, `p-5`: 6).
- **Zero Arbitrary Padding/Margin Clutter:** No unconstrained arbitrary paddings (`p-[17px]`, etc.) found. Arbitrary classes are strictly limited to mobile viewport constraints (`h-[100dvh]`, `w-[340px]`, `h-[90vh]`).
- **Whitespace Rhythm:** Cards and modals exhibit generous whitespace resembling magazine layouts.
- **Compact Viewport Observation:** `w-full max-w-[340px]` on a 375px mobile device (iPhone SE) leaves only ~1.5px of outer linen margin when nested inside `px-4` padding.

### Pillar 6: Experience Design (3/4)
- **Framer Motion Kinematics:**
  - Card drag rotation strictly matches design spec: `rotate = useTransform(x, (val) => val * 0.05);` (exactly 5° per 100px drag, down from 0.09).
  - Spring snap-back: `dragTransition={{ bounceStiffness: 300, bounceDamping: 20 }}` provides crisp physical recoil.
  - Tactile tap: `active:scale-[0.98]` implemented on SwipeDeck action buttons (`X` and `Heart`).
  - Match scale-up: Mutual match triggers a smooth `scale: 1.05` spring transition before celebration modal entry.
  - Celebration confetti: Single warm burst (`#E07A5F`, `#D4AF37`, `#2D6A4F`, `#FBF9F5`) with `disableForReducedMotion: true`.
- **Anti-AI-Slop & Zero Emojis:** 100% of emojis were purged across all TSX files (0 occurrences of `❤️`, `❌`, `🍕`, `🎮`, `🔥`, `⚡`, `🧭`, `🛵`, `🍔`, `📞`, `💬`, `⚔️`, `🎉`, `🏆`). All iconography uses clean Lucide SVG vectors. Dead sponsor relics were completely removed.
- **Touch Gesture Safety:** `touchAction: 'none'` applied on duel tap pads and swipe containers prevents mobile Safari pull-to-refresh interception.
- **Warning / Double Hook Call:** `Lobby.tsx` calls `useRoomSocket()` internally even when passed a `socket` prop, creating an orphaned WebSocket connection on load.

---

## Files Audited
- `client/index.html`
- `client/src/index.css`
- `client/src/App.tsx`
- `client/src/components/VenueCard.tsx`
- `client/src/components/SwipeDeck.tsx`
- `client/src/components/MatchCelebration.tsx`
- `client/src/components/DeckExhausted.tsx`
- `client/src/components/RapidTapperDuel.tsx`
- `client/src/components/DuelCountdown.tsx`
- `client/src/components/OnlineDuelView.tsx`
- `client/src/components/SplitScreenDuelView.tsx`
- `client/src/components/TugOfWarBar.tsx`
- `client/src/components/Lobby.tsx`
- `client/src/components/RoomWaitingView.tsx`
- `client/src/components/DistrictSelector.tsx`
- `client/src/components/VenueListModal.tsx`
- `client/src/hooks/useRoomSocket.ts`
- `c:\Users\Hp\Downloads\decidetogether_design_system.md`
