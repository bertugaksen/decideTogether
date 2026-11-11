---
name: Warm Editorial Minimal
colors:
  surface: '#fff8f5'
  surface-dim: '#e0d8d5'
  surface-bright: '#fff8f5'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#faf2ee'
  surface-container: '#f4ece8'
  surface-container-high: '#eee7e3'
  surface-container-highest: '#e9e1dd'
  on-surface: '#1e1b19'
  on-surface-variant: '#5b403b'
  inverse-surface: '#33302d'
  inverse-on-surface: '#f7efeb'
  outline: '#907069'
  outline-variant: '#e4beb6'
  surface-tint: '#b82007'
  primary: '#b51d04'
  on-primary: '#ffffff'
  primary-container: '#d9381e'
  on-primary-container: '#fffcff'
  inverse-primary: '#ffb4a6'
  secondary: '#9a442d'
  on-secondary: '#ffffff'
  secondary-container: '#fc9174'
  on-secondary-container: '#742814'
  tertiary: '#29674c'
  on-tertiary: '#ffffff'
  tertiary-container: '#448064'
  on-tertiary-container: '#f5fff6'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdad3'
  primary-fixed-dim: '#ffb4a6'
  on-primary-fixed: '#3f0300'
  on-primary-fixed-variant: '#8f1100'
  secondary-fixed: '#ffdbd2'
  secondary-fixed-dim: '#ffb4a1'
  on-secondary-fixed: '#3c0800'
  on-secondary-fixed-variant: '#7c2e19'
  tertiary-fixed: '#b1f0ce'
  tertiary-fixed-dim: '#95d4b3'
  on-tertiary-fixed: '#002114'
  on-tertiary-fixed-variant: '#0e5138'
  background: '#fff8f5'
  on-background: '#1e1b19'
  surface-variant: '#e9e1dd'
  cream-bg: '#FBF9F5'
  card-border: '#E7E2D9'
  text-muted: '#78716C'
  surface-white: '#FFFFFF'
typography:
  display-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 40px
    fontWeight: '700'
    lineHeight: 48px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 36px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 17px
    fontWeight: '400'
    lineHeight: 26px
  body-md:
    fontFamily: Inter
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 22px
  label-lg:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.01em
---

# Design System: DecideTogether (Warm Editorial Minimal)

## Brand & Style

This design system embodies an analog, tactile, and editorial atmosphere grounded in the warmth of physical print and culinary curation. Drawing direct inspiration from slow-living magazines like *Kinfolk* and classic menu craft, it rejects synthetic gloss, neon glows, and cybernetic trends in favor of warm linen tones, authentic physical cards, and deliberate typography.

The emotional signature is calming, appetizing, and decisively social. By stripping away transient bottom navigation docks and complex gradients, the interface maintains an uninterrupted linear rhythm. Everyday decisions feel grounded, tactile, and relaxed, replacing digital decision fatigue with the intimacy of passing a printed card across a dining table.

## Colors

The palette operates on organic, culinary-inspired tonal values anchored by a papery linen canvas. 

- **Primary (`#D9381E` - Paprika Red):** Used with precise restraint for primary commit actions, decisive highlights, and vital state transitions. Its energetic yet grounded warmth stimulates focus and appetite.
- **Secondary (`#E07A5F` - Warm Terracotta):** Accompanies the primary shade across secondary badges, interactive chips, and warm resting surfaces.
- **Tertiary (`#2D6A4F` - Basil Green):** Serves strictly as the positive match, resolution, and confirmation tone—representing harmony, consensus, and freshness.
- **Neutral (`#1C1917` - Deep Charcoal):** Delivers editorial legibility across all typography without the harshness of pure digital black.
- **Surface & Canvas:** The background (`#FBF9F5`) sets an analog linen-sheet warmth. Surface cards are crisp white (`#FFFFFF`) held together by quiet, tactile 1px border lines (`#E7E2D9`).

## Typography

Typography establishes an editorial magazine balance. Headline treatments employ **Plus Jakarta Sans**, offering warm, geometric humanism with sculpted terminals that echo architectural and culinary print. Running text and functional labels use **Inter**, chosen for its systematic neutrality, effortless micro-readability, and balanced numbers.

## Layout & Components

- **Mobile (<640px):** Single-column layout. Cards occupy full width of readable viewport with generous whitespace.
- **Buttons:** Flat, tactile, 48px height. Primary is Paprika Red (`#D9381E`), Match button is Basil Green (`#2D6A4F`).
- **Cards:** Crisp white (`#FFFFFF`) with 1px border (`#E7E2D9`) and 8px corner radius (`rounded-lg`). High-res food photography with 4:3 ratio.
- **No Bottom Nav Bar:** Pure linear game flow (Lobby -> Swipe Deck -> Match / Duel).
