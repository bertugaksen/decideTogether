# Requirements: DecideTogether

**Defined:** 2026-11-07  
**Core Value:** İki insanın sıfır sürtünmeyle (uygulama indirmeden / kayıt olmadan) 10 saniye içinde ortak bir yemek kararına varması veya beraberlikte tek telefondan/online eğlenceli bir düelloyla kazananı belirlemesi.

## v1 Requirements

### Room & Session Management (ROOM)

- [x] **ROOM-01**: Host tek tıkla oda oluşturup 4 haneli PIN ve tek dokunuş WhatsApp paylaşım linki alır.
- [x] **ROOM-02**: Katılımcı PIN veya doğrudan link ile şifre/kayıt olmadan anında odaya bağlanır.
- [x] **ROOM-03**: Kullanıcılara otomatik eğlenceli anonim takma adlar atanır ("Aç Panda", "Kararsız Koala" vb.).
- [x] **ROOM-04**: Oturum `localStorage` içinde saklanır; 30 saniyelik bağlantı kopması toleransı ve sayfa yenileme kurtarması sağlanır.

### Location & Venue Engine (VENUE)

- [x] **VENUE-01**: Kullanıcı GPS ile otomatik konum paylaşabilir veya açılır kutudan ilçe/semt seçebilir (Hibrit).
- [x] **VENUE-02**: Google Places API üzerinden civardaki açık ve popüler 12-15 mekanın verisi çekilir (ad, puan, fotoğraf, adres).
- [x] **VENUE-03**: API kotasını korumak için semt bazlı mekan sorguları sunucu tarafında önbelleğe (cache) alınır.
- [x] **VENUE-04**: Yerel restoranlar için ilk 3 kart slotunda sponsorlu kart gösterme altyapısı sağlanır.

### Gesture Swiping & Real-Time Sync (SWIPE)

- [x] **SWIPE-01**: Framer Motion tabanlı fizik motoruyla akıcı kart kaydırma (Sağa Beğen, Sola Pas, butonlarla fırlatma).
- [x] **SWIPE-02**: Node.js WebSockets ile <100ms gecikmeli iki yönlü durum senkronizasyonu ve partner durum bildirimi.
- [x] **SWIPE-03**: İki taraf da aynı karta SAĞ kaydırdığında her iki ekranda anında konfetili Eşleşme (Match) kutlaması patlar.

### Tie-Breaker Duel (DUEL)

- [x] **DUEL-01**: Deste ortak eşleşme olmadan biterse 5 saniyelik "Rapid Tapper" (Parmak Güreşi) düellosu tetiklenir.
- [x] **DUEL-02**: Uzaktaki kullanıcılar için yerel anındalık (client-side optimism) ve 100ms paket birleştirme ile adil online düello çalışır.
- [x] **DUEL-03**: Yan yana olan kullanıcılar için tek telefondan split-screen (ekranı ikiye bölen) parmak güreşi moduna geçiş butonu sunulur.
- [x] **DUEL-04**: Düelloyu kazanan tarafın en çok istediği mekan günün kazananı ilan edilir.

### Post-Match Action (ACTION)

- [x] **ACTION-01**: Eşleşme ekranında kazanılan mekanın fotoğrafı, Google puanı, açık adresi ve fiyat seviyesi gösterilir.
- [x] **ACTION-02**: `🧭 Yol Tarifi Al` butonu doğrudan Google Maps navigasyon rotasını başlatır.
- [x] **ACTION-03**: `🛵 Sipariş Ver / 📞 Ara` butonu yemek sipariş aramasını veya telefon aramasını açar.

### Mobile UX & Location Polish (MOB)

- [x] **MOB-01**: Sola ve sağa kart kaydırma yönü kullanıcının sürükleme yönüne (`like` -> sağ, `pass` -> sol) kilitlenmeli, bırakma anında `x` yaylanmasından bağımsız olarak doğru yöne uçmalıdır.
- [x] **MOB-02**: Sponsorlu mekan mantığı tamamen kaldırıldı; destedeki tüm mekanlar %100 kullanıcının konumundaki gerçek yerel mekanlardır.
- [x] **MOB-03**: Google Haritalar `Yol Tarifi Al` butonu sabit sunucu koordinatı yerine dinamik olarak telefonun canlı konumunu (`Konumunuz`) başlangıç noktası olarak almalıdır.
- [x] **MOB-04**: `Yemeksepeti` ve `Uber Eats` doğrudan uygulama linkleri olarak çalışır; sekmeler veya uygulamalar arası geçişte oda kapanmaz.

### Warm Editorial Minimal & Anti-AI-Slop (EDIT)

- [x] **EDIT-01**: Fraunces serif Google Font loaded and integrated into Tailwind CSS v4 `@theme` (`--font-display`), replacing generic startup sans for headings and venue cards.
- [x] **EDIT-02**: All 5 "Bu akşam" time-of-day assumptions neutralized into timeless editorial Turkish across Lobby, title, and celebration surfaces.
- [x] **EDIT-03**: All 19 juvenile emojis and redundant icon+emoji pairings purged; like/pass stamps replaced with clean typographic uppercase ink stamps (`BEĞENDİM` / `PAS`) and dead sponsor relics removed.
- [x] **EDIT-04**: `MatchCelebration` modal streamlined to 1 primary Hero CTA ("Yol Tarifi Al") + 2x2 secondary pill row with 1px `#E7E2D9` borders, purging neon buttons (`#EA004B`, `#06C167`) and double confetti cannons in favor of a warm single-burst palette.
- [x] **EDIT-05**: Framer Motion physics calibrated to `rotate = x * 0.05`, spring snap-back `stiffness: 300, damping: 20`, tactile tap `active:scale-[0.98]`, and match climax scale-up `1.05`.
- [x] **EDIT-06**: Duel views and countdown surfaces neutralized: dark cyber backdrops and Paprika red floods replaced with Warm Linen and Crisp White surfaces, and screaming arcade microcopy replaced with calm labels.

### Engineering Architecture Hardening (ENG)

- [x] **ENG-01**: Pluggable storage repository (`IRoomRepository`) decoupling in-memory state from business logic, with native `node:sqlite` persistence for zero-data-loss server reboots.
- [x] **ENG-02**: Atomic UI component refactoring: decompose monolithic `Lobby.tsx` and `MatchCelebration.tsx` into clean, testable sub-components in `components/lobby/` and `components/celebration/`.
- [x] **ENG-03**: Automated GitHub Actions CI workflow (`.github/workflows/ci.yml`) enforcing TypeScript builds and server test verification on push/PR.
- [x] **ENG-04**: Structured logging utility (`logger.ts`) with severity levels and correlation IDs, plus `GET /health` endpoint for production uptime monitors.

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| ROOM-01 | Phase 1 | Complete |
| ROOM-02 | Phase 1 | Complete |
| ROOM-03 | Phase 1 | Complete |
| ROOM-04 | Phase 1 | Complete |
| VENUE-01 | Phase 2 | Complete |
| VENUE-02 | Phase 2 | Complete |
| VENUE-03 | Phase 2 | Complete |
| VENUE-04 | Phase 2 | Complete |
| SWIPE-01 | Phase 3 | Complete |
| SWIPE-02 | Phase 3 | Complete |
| SWIPE-03 | Phase 3 | Complete |
| DUEL-01 | Phase 4 | Complete |
| DUEL-02 | Phase 4 | Complete |
| DUEL-03 | Phase 4 | Complete |
| DUEL-04 | Phase 4 | Complete |
| ACTION-01 | Phase 5 | Complete |
| ACTION-02 | Phase 5 | Complete |
| ACTION-03 | Phase 5 | Complete |
| MOB-01 | Phase 6 | Complete |
| MOB-02 | Phase 6 | Complete |
| MOB-03 | Phase 6 | Complete |
| MOB-04 | Phase 6 | Complete |
| EDIT-01 | Phase 7 | Complete |
| EDIT-02 | Phase 7 | Complete |
| EDIT-03 | Phase 7 | Complete |
| EDIT-04 | Phase 7 | Complete |
| EDIT-05 | Phase 7 | Complete |
| EDIT-06 | Phase 7 | Complete |
| ENG-01 | Phase 8 | Complete |
| ENG-02 | Phase 8 | Complete |
| ENG-03 | Phase 8 | Complete |
| ENG-04 | Phase 8 | Complete |

**Coverage:**
- v1 requirements: 22 total (22/22 complete)
- Phase 7 requirements: 6 total (6/6 complete)
- Phase 8 requirements: 4 total (4/4 complete)
