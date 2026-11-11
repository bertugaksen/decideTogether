# Walking Skeleton — DecideTogether

**Phase:** 1  
**Generated:** 2026-11-08

## Capability Proven End-to-End

İki kullanıcı farklı tarayıcılardan (veya pencerelerden) şifre/üye olmadan 4 haneli PIN veya WhatsApp linkiyle aynı odaya bağlanır; birbirlerinin bağlandığını anlık görür ve sayfa yenilendiğinde 30 saniye içinde oturumu kaybetmeden odaya geri döner.

## Architectural Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Runtime | Node.js (v20+) | Hızlı I/O, hafif çalışma ortamı ve tek dilli Full-Stack TypeScript desteği. |
| Backend Framework | Express + `ws` | Minimalist HTTP ve yüksek performanslı sıfır gecikmeli WebSocket protokolü. |
| Frontend Framework | Vite + React 19 + TypeScript | Işık hızında hot-reload, modern mobil web render motoru. |
| Styling & Theme | Tailwind CSS + Warm Editorial Design Tokens | Stitch'te doğruladığımız fildişi zemin (`#FBF9F5`) ve paprika kırmızısı (`#D9381E`) paleti. |
| In-Memory State | TypeScript `Map<string, Room>` | MVP aşamasında sıfır veritabanı maliyeti ve milisaniyelik oda yönetimi. |
| Session Persistence | Browser `localStorage` | Çerez/şifre olmadan sayfa yenileme ve 30 saniyelik kopma kurtarması. |

## Stack Touched in Phase 1

- [ ] Project scaffold (Node.js backend + Vite/React frontend + paylaşılan `types.ts`)
- [ ] Routing — Lobi (`/`) ve Odaya Doğrudan Katılım (`/room/:code`) rotaları
- [ ] WebSocket sunucusu — 4 haneli PIN üretimi, iki istemcinin oda senkronizasyonu
- [ ] UI — Warm Editorial Lobi ekranı (PIN kutusu, WhatsApp davet butonu, anonim avatar kartları)
- [ ] Yerel çalıştırma — Tek komutla hem backend hem frontend'in ayağa kalkması (`npm run dev`)

## Out of Scope (Deferred to Later Slices)

- Google Places API mekan listesi çekme (Faz 2)
- Kart kaydırma ve Tinder benzeri jestler (Faz 3)
- Rapid Tapper parmak güreşi düellosu (Faz 4)
- Google Maps navigasyon yönlendirmesi (Faz 5)

## Subsequent Slice Plan

- Phase 2: Live Venue Discovery & Hybrid Location
- Phase 3: Gesture Deck & Instant Match Celebration
- Phase 4: Rapid Tapper Tie-Breaker Duel
- Phase 5: Post-Match Navigation & Delivery Actions
