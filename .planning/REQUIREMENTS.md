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

**Coverage:**
- v1 requirements: 18 total
- Completed: 18 / 18 (100%) ✓
