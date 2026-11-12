# Roadmap: DecideTogether

## Overview

DecideTogether, çiftlerin "Ne yesek?" kararsızlığını 10 saniyelik eğlenceli bir mobil-web oyununa dönüştürür. Bu yol haritası Dikey MVP (Vertical MVP) yaklaşımıyla 5 odaklı fazda sıfırdan canlıya çalışan, sıfır gecikmeli ve para kazanmaya hazır bir ürün sunar.

## Phases

- [x] **Phase 1: Room & Real-Time Connection** - PIN/WhatsApp linkiyle sıfır login katılım ve WebSocket senkronizasyonu.
- [x] **Phase 2: Live Venue Discovery & Hybrid Location** - GPS/ilçe seçimi, Google Places API ve sponsorlu kart desteği.
- [x] **Phase 3: Gesture Deck & Instant Match Celebration** - Framer Motion kart sürükleme fiziği ve anlık eşleşme kutlaması.
- [x] **Phase 4: Rapid Tapper Tie-Breaker Duel** - Beraberlikte 5 saniyelik adil online/tek-telefon parmak güreşi düellosu.
- [x] **Phase 5: Post-Match Navigation & Delivery Actions** - Google Maps navigasyon başlatma ve sipariş arama entegrasyonu.
- [x] **Phase 6: Mobile UX, Swipe Physics & Location Navigation Polish**
- [x] **Phase 7: Warm Editorial Minimal & Anti-AI-Slop Redesign**
- [ ] **Phase 8: Engineering Architecture Hardening: Storage Repository, Atomic UI & CI/CD**

## Phase Details

### Phase 1: Room & Real-Time Connection
**Goal**: Kullanıcıların üyeliksiz 4 haneli PIN veya WhatsApp linkiyle odaya bağlanması ve WebSocket üzerinden senkronize olması.
**Mode:** mvp
**Depends on**: Nothing (first phase)
**Requirements**: ROOM-01, ROOM-02, ROOM-03, ROOM-04
**Plans**: 2/2 plans executed

### Phase 2: Live Venue Discovery & Hybrid Location
**Goal**: GPS veya semt seçimi ile Google Places API üzerinden civardaki gerçek 12-15 mekanın çekilmesi ve sponsorlu kart altyapısı.
**Mode:** mvp
**Depends on**: Phase 1
**Requirements**: VENUE-01, VENUE-02, VENUE-03, VENUE-04
**Plans:** 2/2 plans executed

### Phase 3: Gesture Deck & Instant Match Celebration
**Goal**: Framer Motion tabanlı akıcı kart kaydırma deneyimi ve ilk ortak sağ kaydırmada anında konfetili eşleşme.
**Mode:** mvp
**Depends on**: Phase 2
**Requirements**: SWIPE-01, SWIPE-02, SWIPE-03
**Plans:** 2/2 plans executed

### Phase 4: Rapid Tapper Tie-Breaker Duel
**Goal**: Eşleşme olmadan deste bittiğinde kararsızlığı 5 saniyelik adil Parmak Güreşi düellosuyla çözmek.
**Mode:** mvp
**Depends on**: Phase 3
**Requirements**: DUEL-01, DUEL-02, DUEL-03, DUEL-04
**Plans**: 2/2 plans executed

### Phase 5: Post-Match Navigation & Delivery Actions
**Goal**: Eşleşen veya düelloda kazanılan mekana Google Maps navigasyonu başlatmak veya sipariş linkine yönlendirmek.
**Mode:** mvp
**Depends on**: Phase 4
**Requirements**: ACTION-01, ACTION-02, ACTION-03
**Success Criteria** (what must be TRUE):
  1. Eşleşme ekranında kazanılan mekanın fotoğrafı, Google puanı, açık adresi ve fiyat seviyesi gösterilir.
  2. `🧭 Yol Tarifi Al` butonu doğrudan Google Maps navigasyon rotasını başlatır.
  3. `🛵 Sipariş Ver / 📞 Ara` butonu sipariş platformunda mekan aramasını veya telefon aramasını açar.
**Plans**: 2/2 plans executed

Plans:
- [x] 05-01-PLAN.md — Server Post-Match Action Link Engine, 7-District Complete Datasets & Room Lifecycle Bug Fixes
- [x] 05-02-PLAN.md — Client MatchCelebration Navigation/Delivery/Call Actions & Touch/Socket Bug Fixes

### Phase 6: Mobile UX, Swipe Physics & Location Navigation Polish
**Goal:** Telefondaki canlı testlerde tespit edilen kart kaydırma fiziği, şehir/sponsor izolasyonu, Google Haritalar canlı GPS rotası ve mobil sipariş yönlendirme dayanıklılığını çözmek.
**Requirements**: MOB-01, MOB-02, MOB-03, MOB-04
**Depends on:** Phase 5
**Success Criteria** (what must be TRUE):
  1. Kart sola kaydırıldığında daima sola (-800), sağa kaydırıldığında daima sağa (+800) akıcı yay fiziğiyle fırlar.
  2. Adana veya başka bir ilçe seçildiğinde listeye farklı bir şehre ait (Kadıköy vb.) sponsorlu mekan asla sızmaz; sponsor katmanı %100 kaldırılmıştır.
  3. `🧭 Yol Tarifi Al` butonu sabit sunucu koordinatını değil, telefonun canlı konumunu (`Konumunuz`) rota başlangıcı olarak açar.
  4. `🛵 Yemeksepeti` ve `🍔 Uber Eats` butonları doğrudan ilgili uygulamaları/sipariş sayfasını açar; sekmeler arası geçişte oda kapanmaz.
**Plans:** 2/2 plans executed

Plans:
- [x] 06-01-PLAN.md — Backend Regional Sponsor Filter, Dynamic GPS Navigation URL & Match State Persistence
- [x] 06-02-PLAN.md — Client Swipe Gesture Direction Locking, Tactile Feedback & Mobile Delivery Modal Flow

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Room & Real-Time Connection | 2/2 | Complete | 2026-11-08 |
| 2. Live Venue Discovery & Hybrid Location | 2/2 | Complete | 2026-11-08 |
| 3. Gesture Deck & Instant Match Celebration | 2/2 | Complete | 2026-11-08 |
| 4. Rapid Tapper Tie-Breaker Duel | 2/2 | Complete | 2026-11-09 |
| 5. Post-Match Navigation & Delivery Actions | 2/2 | Complete | 2026-11-11 |
| 6. Mobile UX, Swipe Physics & Location Navigation Polish | 2/2 | Complete | 2026-11-11 |
| 7. Warm Editorial Minimal & Anti-AI-Slop Redesign | 2/2 | Complete | 2026-11-11 |
| 8. Engineering Architecture Hardening: Storage Repository, Atomic UI & CI/CD | 0/2 | Ready | — |

### Phase 7: Warm Editorial Minimal & Anti-AI-Slop Redesign

**Goal:** Transform DecideTogether frontend into a world-class Warm Editorial Minimal web application (Kinfolk meets digital product) with Fraunces serif typography, zero juvenile emojis, timeless Turkish copy, calibrated Framer Motion physics (0.05 tilt, 300/20 spring), streamlined post-match hero CTAs, and refined duel surfaces.
**Requirements:** EDIT-01, EDIT-02, EDIT-03, EDIT-04, EDIT-05, EDIT-06
**Depends on:** Phase 6
**Plans:** 2 plans

Plans:
- [x] 07-01-PLAN.md — Typography, Content Neutralization & Emoji Purge
- [x] 07-02-PLAN.md — Climax Redesign, Framer Motion Physics & Duel Surface Refinement

### Phase 8: Engineering Architecture Hardening: Storage Repository, Atomic UI & CI/CD

**Goal:** Upgrade codebase from Vibe Coder shortcuts to resilient Software Engineering standards: decouple storage via IRoomRepository with native node:sqlite persistence, decompose monolithic UI components into atomic modules, add GitHub Actions CI automation, and implement structured logging with a /health endpoint.
**Requirements:** ENG-01, ENG-02, ENG-03, ENG-04
**Depends on:** Phase 7
**Plans:** 2 plans

Plans:
- [ ] 08-01-PLAN.md — Storage Repository Pattern, Native SQLite Persistence, Structured Logging & Health Check
- [ ] 08-02-PLAN.md — Atomic UI Component Decomposition & GitHub Actions CI Workflow
