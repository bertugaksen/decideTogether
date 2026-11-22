# DecideTogether — Kapsamlı Teknik & Ürün İnceleme Raporu

- **Depo:** https://github.com/bertugaksen/decideTogether
- **İncelenen Dal / Commit:** `main` (`a5f4dde`, 22 Kasım 2026)
- **Rapor Tarihi:** 22 Kasım 2026
- **Temel İstatistikler:** 62 commit · 165 dosya · 8 geliştirme fazı · 54/54 sunucu testi geçiyor

## 1. Yönetici Özeti
DecideTogether, iki kişinin yemek mekanı seçerken yaşadığı kararsızlığı 4 haneli PIN odaları, Tinder benzeri kaydırma destesi ve ortak karar çıkmadığında devreye giren 5 saniyelik Rapid Tapper düellosu ile çözen gerçek zamanlı bir web uygulamasıdır.

## 2. Vizyon Belgesi vs. Gerçekleşen Uygulama
| Boyut | Teknik Vizyon Belgesi | Gerçek Kod Tabanı | Değerlendirme |
| --- | --- | --- | --- |
| Sunucu Çalışma Zamanı | Python 3.12 + FastAPI WebSockets + asyncio bellek sözlüğü | Node.js >=22.5.0 + TypeScript 5.7 + Express 4.21 + ws 8.18 | Tek dilde (TypeScript) uçtan uca tip paylaşımı sağlanarak şema sapması önlendi. |
| Kalıcılık & Durum Yönetimi | Yalnızca RAM içi Python dict (ephemeral) | IRoomRepository + node:sqlite (WAL modu) + write-through bellek önbelleği | Sunucu yeniden başlatmalarında oda durumunu koruyan ve 24 saat TTL temizliği yapan dayanıklı yapı. |
| Konum & Mekan Verisi | Statik mock cards.json veri seti | Hibrit GPS/İlçe çözümleme + Google Places API + LRU Cache + 7 ilçe mock havuzu | API anahtarı olmadığında veya hata durumunda akıllı yemek fotoğrafı ve yerel mock mekanlara kesintisiz düşüyor. |
| Çıkmaz Çözümü (Tie-Breaker) | Deste biterse yalnızca tekrar deneme / devam akışı | İki modlu (Online & Split-Screen) 5 sn Rapid Tapper Düellosu + DuelEngine | Karar çıkmadığında eğlenceli ve deterministik (eşitlikte yazı-tura) çözüm mekanizması eklendi. |
| Eşleşme Sonrası Aksiyonlar | Google Maps bağlantısı + Keep Swiping | Konumsuz canlı GPS Google Maps rotası + Yemeksepeti/Uber Eats/Getir/Trendyol + tel: + WhatsApp | Karardan gerçek aksiyona geçiş sürtünmesi minimuma indirildi. |
| Görsel Dil | Genel mobil kart destesi konsepti | Warm Editorial Minimal (#FBF9F5 tuval, Fraunces + Inter, BEĞENDİM/PAS mühürleri) | Faz 7 yeniden tasarımıyla yüksek kontrastlı, emojisiz ve editoryal bir kimlik kazanıldı. |

## 3. Sistem Mimarisi Katmanları
### İstemci Katmanı (React 19 + Vite 6) (Sunum & Jest Fiziği)
Tek sayfa uygulama; aktif oyun durumuna göre Lobi veya Kaydırma Destesi görünümüne geçer ve tüm gerçek zamanlı akışı tek bir özel WebSocket hook’u üzerinden yönetir.
- **Sorumluluklar:** Oda kurma, 4 haneli PIN ile katılma ve localStorage oturum kurtarma; Framer Motion ile x * 0.05 eğimli kart sürükleme ve 300/20 yay geri tepmesi; Online ve tek cihazlı Split-Screen Rapid Tapper düello arayüzleri; Eşleşme sonrası 1 Hero CTA + 2x2 evrensel aksiyon ızgarası ve sıcak konfeti
- **Dayanıklılık & Güvenlik:** Bağlantı koptuğunda mesajları bellekte kuyrukluyor ve savedSession üzerinden odaya otomatik yeniden bağlanıyor; ancak otomatik istemci test paketi henüz yok.

### HTTP & WebSocket Ağ Geçidi (Express + ws) (Gerçek Zamanlı İletişim)
REST sağlık/konum/fotoğraf proxy uç noktalarıyla birlikte /ws yolu üzerinden çift yönlü WebSocket mesajlarını doğrulayıp RoomManager’a yönlendirir.
- **Sorumluluklar:** GET /health ve GET /api/health ile çalışma süresi, aktif oda ve depolama telemetrisi; GET /api/locations/resolve ile ilçe veya GPS koordinatı çözümleme; GET /api/venues/photo ile Google Places görsellerini sunucu üzerinden proxy’leme; 11 farklı ClientMessage tipini ayrıştırma ve RESOLVE_SPLIT_DUEL yetkilendirme kontrolü
- **Dayanıklılık & Güvenlik:** GOOGLE_PLACES_API_KEY sunucuda saklanır ve tarayıcıya sızdırılmaz. express-rate-limit ile genel API (120 req/dk), konum çözümleme (30 req/dk) ve fotoğraf proxy (120 req/dk) korumaya alınmıştır; wsRateLimiter ile soket başına kayan pencere (50 msg/sn), kötüye kullanım tespiti (100 msg/sn'de bağlantı kapatma) ve IP başına bağlantı sınırı (30 bağlantı/dk) entegre edilmiştir. Kök dizinde tam .env.example şablonu yer alır.

### Oda & Eşleşme Orkestratörü (RoomManager) (Çekirdek İş Mantığı · 708 Satır)
4 haneli benzersiz PIN üretimi, katılımcı yönetimi, yeniden bağlanma süreleri, oy kaydı, karşılıklı beğeni tespiti ve düello zamanlayıcılarını yönetir.
- **Sorumluluklar:** Oda oluşturma, 2 kişilik kapasite sınırı ve 60 saniyelik yeniden bağlanma toleransı; Her iki tarafın aynı mekana "like" vermesi anında MATCH yayını; Tüm deste tükendiğinde eşleşme yoksa DECK_EXHAUSTED tetikleme; Her 30 dakikada bir 24 saatten eski odaları temizleyen unref() zamanlayıcısı
- **Dayanıklılık & Güvenlik:** 708 satırlık hacmiyle projenin en yoğun sınıfıdır; oda yaşam döngüsü, oylama ve düello orkestrasyonunun alt servislere bölünmesi bakımı kolaylaştıracaktır.

### Düello Motoru (DuelEngine) (Adil Çıkmaz Çözücü)
Ortak karar çıkmadığında 3 saniye geri sayım + 5 saniye dokunma penceresi açar, hileye karşı dokunma hızını sınırlar ve hiyerarşik mekan seçimi yapar.
- **Sorumluluklar:** startTime ile bitiş + 400ms tolerans penceresi dışında gelen dokunmaları reddetme; Paket başına maksimum +30 kümülatif artış sınırı (macro/auto-clicker koruması); Eşit skorlarda Math.random() < 0.5 ile adil yazı-tura (tieBroken: true); Kazananın beğenileri -> eşin beğenileri -> en yüksek puanlı mekan sırasıyla seçim
- **Dayanıklılık & Güvenlik:** Faz 4 sonrası CR-01..03 ve WR-03 düzeltmeleriyle sertleştirilmiştir; yalnızca katılımcı koptuğunda aktif düello zamanlayıcısının iptali (IN-03) açık kalmıştır.

### Mekan Keşif & Önbellek Katmanı (VenueService + LRU) (Veri Zenginleştirme)
Google Places Nearby Search API veya 7 Türkiye ilçesi için hazırlanmış kapsamlı mock mekan havuzundan 15 mekanlık dengeli deste üretir.
- **Sorumluluklar:** 500m ızgara yuvarlamalı (~0.005 derece) LRU önbellek (500 kayıt, 2 saat TTL); AVM, süpermarket, otel gibi gıda dışı yerleri filtreleme ve Türkçe yazım düzeltme; Arka arkaya aynı kategori/mutfağın gelmesini engelleyen çeşitlilik algoritması; Haversine mesafe, fiyat katmanı, telefon ve teslimat evrensel bağlantısı ekleme
- **Dayanıklılık & Güvenlik:** Google Places çağrısı başarısız olursa veya anahtar yoksa sessizce mock havuzuna döner; koordinatlar -90..90 / -180..180 aralığında doğrulanır.

### Depolama Soyutlaması (IRoomRepository & SQLite) (Kalıcılık · Faz 8)
Node.js yerleşik node:sqlite (DatabaseSync) motorunu WAL modu ve write-through bellek önbelleği ile birleştirerek sıfır ek bağımlılıkla kalıcılık sağlar.
- **Sorumluluklar:** Parametrik prepared statement’lar ile SQL enjeksiyonuna karşı tam koruma; PRAGMA journal_mode = WAL ve busy_timeout = 5000 ile eşzamanlı erişim güvenliği; JSON serileştirmede döngüsel NodeJS.Timeout (duelState.timer) alanını dışlama; Testler için MemoryRoomRepository ile bağımlılık enjeksiyonu esnekliği
- **Dayanıklılık & Güvenlik:** Tek sunucu örneğinde yeniden başlatmaya dayanıklıdır; çoklu sunucu (yatay ölçekleme) hedeflendiğinde Redis/PostgreSQL adaptörüne kolayca geçirilebilir.

### Ortak Kontratlar (@decidetogether/shared) (Tek Doğruluk Kaynağı)
İstemci ve sunucu arasındaki tüm WebSocket tiplerini, 7 ilçe tanımını, Türkçe metin normalize edicileri ve evrensel aksiyon link üreticilerini paylaşır.
- **Sorumluluklar:** ClientMessage (11 tip) ve ServerMessage (15 tip) ayırt edici birleşim tipleri; Seyhan, Moda, Beşiktaş, Çankaya, Alsancak, Nişantaşı ve Caddebostan tanımları; Canlı GPS bazlı Google Maps URL üretimi (origin parametresi kasıtlı çıkarılmış); tel: URI temizleyici (7–15 rakam sınırı) ve Yemeksepeti/Uber Eats/Getir/Trendyol linkleri
- **Dayanıklılık & Güvenlik:** Derleme zamanı kontrat güvenliği sağlar; npm workspaces yapısında önce shared derlenmeden client/server derlemesi yapılmamalıdır.

## 4. Güvenlik, Veri Modeli & Kod İnceleme Bulguları
- **[CR-01] Split-Screen Düello Erken Zaman Aşımı Yarış Koşulu** (CRITICAL / Çözüldü · Güvenlik): Tek cihaz Split-Screen düellosunda sunucu zamanlayıcısı istemciden gelen RESOLVE_SPLIT_DUEL sonucundan önce tetiklenip gerçek dokunma skorlarını 0-0 eşitlikle ezebiliyordu. *Öneri/Çözüm:* Split modunda sunucu toplam bekleme süresine 15 saniyelik ek istemci gönderim toleransı eklendi.
- **[CR-02] Çoklu Cihaz Split Düello Çatışması** (CRITICAL / Çözüldü · Mimari): Aynı odadaki pasif/ikinci cihaz da Split-Screen düellosunu kendi tarafından 0 dokunma ile sonlandırabiliyordu. *Öneri/Çözüm:* duelState.initiatorId alanı eklendi ve yalnızca başlatıcı istemcinin sonuç göndermesine izin verildi.
- **[CR-03] RESOLVE_SPLIT_DUEL Yetkilendirme Atlama Açığı** (CRITICAL / Çözüldü · Güvenlik): Kötü niyetli veya hatalı bir istemci, Online düello veya normal oylama sırasında RESOLVE_SPLIT_DUEL mesajı göndererek düelloyu zorla bitirebiliyordu. *Öneri/Çözüm:* Sunucu yalnızca room.status === "duel", mode === "split" ve status !== "finished" iken mesajı kabul edecek şekilde kilitlendi.
- **[WR-01] OnlineDuelView Zamanlayıcılarının Her Rakip Dokunuşunda Sıfırlanması** (WARNING / Çözüldü · UX & Tasarım): Memoize edilmemiş callback bağımlılıkları yüzünden rakibin her DUEL_PROGRESS güncellemesinde sayaç ve senkronizasyon aralıkları yeniden kuruluyordu. *Öneri/Çözüm:* Callback referansları useCallback/ref ile sabitlenerek interval kararlı hale getirildi.
- **[WR-02] Yeniden Bağlanmada duelState Hidrasyon Eksikliği** (WARNING / Çözüldü · Mimari): Sayfa yenilendiğinde veya ağ koptuğunda ROOM_JOINED / ROOM_STATE mesajları aktif düello durumunu istemciye aktarmıyordu. *Öneri/Çözüm:* useRoomSocket içinde ROOM_JOINED ve ROOM_STATE olaylarına duelState hidrasyonu eklendi.
- **[WR-03] DUEL_TAP NaN / Sonsuz Sayı Doğrulama Eksikliği** (WARNING / Çözüldü · Güvenlik): taps alanına sayı dışı veya NaN değer gönderilmesi skor sözlüğünü bozabiliyordu. *Öneri/Çözüm:* Sunucu ağ geçidi ve DuelEngine katmanında Number.isFinite ve >= 0 kontrolü + paket başı max +30 sınırı uygulandı.
- **[WR-04] DuelCountdown State Güncelleyici İçinde Yan Etki** (WARNING / Çözüldü · UX & Tasarım): React StrictMode altında state updater içindeki ses çalma ve timeout tetiklemeleri çift çalışıyordu. *Öneri/Çözüm:* Ses ve zamanlayıcı yan etkileri useEffect içine taşınarak state güncelleyici saf hale getirildi.
- **[IN-01] Lobby.tsx İçinde Erişilemeyen SwipeDeck Koşul Dalı** (INFO / Çözüldü · Mimari): App.tsx oyun durumunu üst seviyede SwipeDeck’e yönlendirdiği için Lobby bileşeni içinde kalan swiping/matched dalı ölü kod niteliğindeydi. *Öneri/Çözüm:* Lobby içindeki erişilemeyen dal ve gereksiz bağımlılıklar kaldırılarak bileşen yalnızca lobi ve bekleme durumlarından sorumlu tutuldu.
- **[IN-02] Split-Screen Düelloda Jenerik Oyuncu Etiketleri** (INFO / Çözüldü · UX & Tasarım): SplitScreenDuelView alanında katılımcıların gerçek takma adları yerine jenerik P1 / P2 etiketleri gösteriliyordu. *Öneri/Çözüm:* Host ve Peer takma adları prop olarak iletilerek üst, alt yarıya ve orta Tug-of-War barına yazıldı.
- **[IN-03] Bağlantı Kopmasında Aktif Düello Zamanlayıcısının İptal Edilmemesi** (INFO / Çözüldü · Mimari): Katılımcılardan biri düello sırasında bağlantıyı terk ettiğinde aktif setTimeout referansı arkada çalışmaya devam edebiliyordu. *Öneri/Çözüm:* handleDisconnect ve kalıcı kopma temizliğinde room.duelState?.timer için clearTimeout çağrılarak zombi düello sonlanması önlendi.
- **[NEW-01] İstemci Tarafında Otomasyon Testi Eksikliği** (GAP / Açık · Test & Altyapı): Sunucu 54 testle iyi korunurken client/ workspace’inde Vitest, React Testing Library veya Playwright E2E testi bulunmuyor; CI yalnızca derleme kontrolü yapıyor. *Öneri/Çözüm:* useRoomSocket ve temel akışlar için Vitest + Playwright duman testi CI hattına eklenmeli.
- **[NEW-02] WebSocket & Proxy Uç Noktalarında Hız Sınırlama (Rate Limit) Yok** (GAP / Çözüldü · Güvenlik): /api/locations/resolve, /api/venues/photo ve CREATE_ROOM mesajları IP bazlı hız sınırlamasına tabi değildi. *Öneri/Çözüm:* express-rate-limit ile genel API (120 req/dk), /api/locations/resolve (30 req/dk) ve /api/venues/photo (120 req/dk) korumaya alındı; wsRateLimiter servisi ile kayan pencere (50 msg/sn), 100 msg/sn kötüye kullanım tespiti ve IP başı 30 bağlantı/dk limiti uygulandı. Kök dizine .env.example şablonu eklendi.
- **[NEW-03] RoomManager Monolitik Koordinatör Boyutu (708 Satır)** (GAP / Açık · Mimari): Faz 8’de SQLite ve DuelEngine ayrıştırılmış olsa da RoomManager hâlâ oda yaşam döngüsü, yeniden bağlanma, oylama ve düello köprülemesini tek dosyada topluyor. *Öneri/Çözüm:* RoomManager; SessionCoordinator, VotingService ve ReconnectScheduler modüllerine ayrıştırılmalı.
- **[NEW-04] RoomWaitingView & VenueService Kısmi Stil/URL Kalıntıları** (GAP / Çözüldü · UX & Tasarım): Faz 7 editoryal sadeleştirmesine rağmen RoomWaitingView içinde hâlâ rounded-full rozetler ve animate-pulse nokta bulunuyor; venueService.ts içinde ise eski Unsplash fallback URL’i yer alıyordu. *Öneri/Çözüm:* RoomWaitingView içindeki rozetler Warm Editorial minimal standartlarına (`rounded`, `border`, minimal tipografi ve Lucide Users ikonu) uyarlandı; animate-pulse ve çocuksu nokta göstergeleri temizlendi. CelebrationVenueCard ve VenueListModal bileşenlerinde Unsplash yerine @decidetogether/shared getSmartFoodPhoto akıllı yerel fallback havuzu bağlandı; venueService.ts içindeki atıl FALLBACK_PHOTO_URL kaldırıldı.
- **[NEW-05] Dağıtım Yapılandırması ve 2+ Kişi Grup Desteği Eksikliği** (GAP / Kısmen Çözüldü · Test & Altyapı): Oda şeması kesin olarak hostId + peerId (2 kişi) üzerine kurulu ve repoda Dockerfile / üretim sağlık kontrolü dokümantasyonu yer almıyor. *Öneri/Çözüm:* Kök dizine .env.example eklendi; Dockerfile eklenmeli ve katılımcı haritası N kişilik oy eşiği (consensus threshold) destekleyecek şekilde evriltilmeli.

## 5. Önceliklendirilmiş İyileştirme Yol Haritası
- **[Kısa Vade · Yüksek · Tamamlandı] Açık İnceleme Kayıtlarını (IN-01, IN-02, IN-03) Kapat:** Split-screen’de gerçek kullanıcı adları gösterildi, kopmalarda düello zamanlayıcısı iptal edildi ve Lobby içindeki ölü kod kaldırıldı.
- **[Kısa Vade · Yüksek · Tamamlandı] HTTP & WebSocket Hız Sınırlama + .env.example Ekle:** Google Places API kotasını ve /ws bağlantısını kötüye kullanıma karşı koruyan express-rate-limit ve wsRateLimiter eklendi; kök .env.example oluşturuldu.
- **[Kısa Vade · Orta · Tamamlandı] RoomWaitingView Stil Tutarlılığı & Yerel Fallback Görseli:** RoomWaitingView rozetleri ve bekleme durumları Warm Editorial Minimal ilkeleriyle hizalandı; CelebrationVenueCard ve VenueListModal bileşenlerinde yerel getSmartFoodPhoto fallback sistemi devreye alındı.
- **[Orta Vade · Yüksek · 3–4 Gün] İstemci Birim & Çift İstemci E2E Test Hattı (Playwright):** İki tarayıcı sekmesi arasında gerçek zamanlı CREATE_ROOM -> SWIPE -> MATCH ve DUEL akışlarını CI’da otomatik doğrulayarak regresyonları sıfırlar.
- **[Orta Vade · Orta · 2–3 Gün] RoomManager Parçalama & Kök Dokümantasyon Senkronizasyonu:** Python/FastAPI öngören teknik vizyon belgesi gerçek TypeScript mimarisiyle güncellenmeli ve 708 satırlık RoomManager daha küçük servislere bölünmelidir.
- **[Uzun Vade · Stratejik · 1–2 Hafta] N Kişilik Grup Odaları, Kategori Filtreleri & PWA Kurulumu:** Yalnızca çiftler yerine 3–6 kişilik arkadaş grupları için çoğunluk/tam mutabakat modları, mutfak/bütçe filtreleri ve mobil ana ekrana eklenebilir PWA deneyimi ürünü ölçekler.
