---
phase: 05-post-match-navigation-delivery
reviewed: "2026-11-11T12:15:00Z"
depth: deep
files_reviewed: 25
files_reviewed_list:
  - server/src/index.ts
  - server/src/roomManager.ts
  - server/src/types.ts
  - server/src/services/venueService.ts
  - server/src/services/venueCache.ts
  - server/src/services/actionLinks.ts
  - server/src/services/mockVenues.ts
  - client/src/App.tsx
  - client/src/main.tsx
  - client/src/types.ts
  - client/src/hooks/useRoomSocket.ts
  - client/src/hooks/useGeolocation.ts
  - client/src/utils/actionLinks.ts
  - client/src/utils/soundEffects.ts
  - client/src/components/Lobby.tsx
  - client/src/components/SwipeDeck.tsx
  - client/src/components/VenueCard.tsx
  - client/src/components/DistrictSelector.tsx
  - client/src/components/VenueListModal.tsx
  - client/src/components/MatchCelebration.tsx
  - client/src/components/DeckExhausted.tsx
  - client/src/components/RapidTapperDuel.tsx
  - client/src/components/SplitScreenDuelView.tsx
  - client/src/components/OnlineDuelView.tsx
  - client/src/components/DuelCountdown.tsx
  - client/src/components/TugOfWarBar.tsx
findings:
  critical: 2
  warning: 4
  info: 4
  total: 10
  necessity: 0
status: issues_found
---

# Codebase & Phase 05: Code Review Report

**Reviewed:** 2026-11-11T12:15:00Z  
**Depth:** deep (Full Codebase & Architecture Audit)  
**Files Reviewed:** 25  
**Status:** issues_found  

## Summary

DecideTogether kod tabanı üzerinde mimari, güvenlik, yarış durumları (race conditions), tip güvenliği ve kod kalitesi odaklı derinlemesine (deep) bir denetim gerçekleştirildi.

Projenin temel WebSocket akışları, O(1) anlık eşleşme algoritması, ses sentezi ve mobil dokunma izolasyonları başarılı bir şekilde inşa edilmiştir. Ancak refactoring öncesinde giderilmesi gereken **2 Kritik Hata** (Düello zamanlayıcı senkronizasyon kaybı ve Photo Proxy SSRF/girdi doğrulama açığı) ile mimari modülerliği ve kod tekrarını engelleyen **4 Uyarı** ve **4 Bilgilendirme** konusu tespit edilmiştir.

---

## Critical Issues

### CR-01: Düello Geri Sayım Desenkronizasyonu ve 1 Saniyelik Dokunma Penceresi Kaybı

**File:** `client/src/components/DuelCountdown.tsx:16-32` & `client/src/components/OnlineDuelView.tsx:63-82`  
**Category:** Logic Bug / Timing Desynchronization  
**Issue:**  
`DuelCountdown.tsx` içinde `step` durumu 3'ten başlar. `setInterval` her saniye tetiklenir:
1. saniye: `prev=3` -> 2
2. saniye: `prev=2` -> 1
3. saniye: `prev=1` -> 0 ("BAŞLA! 🔥" fanfare çalar)
4. saniye: `prev=0` -> `clearInterval` yapılır ve `onComplete()` çağrılır.

Bu durum `onComplete` çağrısının montajdan **4000ms** sonra gerçekleşmesine neden olur. Ancak sunucu tarafında (`server/src/roomManager.ts:548-577`) `countdownMs = 3000`'dir. Sunucu düello başlangıcını 3000ms olarak belirler ve `countdownMs (3000) + durationMs (5000) + 350 = 8350ms` sonra düelloyu sonlandırır.
İstemci savaşa 1 saniye geç başladığı için:
1. İstemci 5 saniyelik düellonun yalnızca ~4.3 saniyesinde dokunabilir.
2. `server/src/roomManager.ts:591` içindeki zaman kontrolü (`now > startTime + durationMs + 400`) nedeniyle istemcinin son saniyede attığı dokunuşlar sunucu tarafından sessizce reddedilir.
3. Sunucu 8350ms'de `MATCH` mesajını yayınlayıp düelloyu bitirdiğinde, istemci ekranındaki geri sayım çubuğunda hala vakit varken oyun aniden kesilir.

**Fix:**  
`DuelCountdown.tsx` içinde "BAŞLA!" aşaması 250-300ms gösterilip hemen `onComplete` tetiklenmeli ve istemci sunucudan gelen `duelState.startTime` damgasını baz almalıdır:
```tsx
// DuelCountdown.tsx
useEffect(() => {
  soundEffects.initOnUserGesture();
  soundEffects.playCountdownTick();

  const interval = setInterval(() => {
    setStep((prev) => {
      if (prev === 1) {
        soundEffects.playStartFanfare();
        // 300ms sonra savaşı başlat
        setTimeout(onComplete, 300);
        return 0; // "BAŞLA! 🔥"
      }
      if (prev <= 0) {
        clearInterval(interval);
        return -1;
      }
      soundEffects.playCountdownTick();
      return prev - 1;
    });
  }, 1000);

  return () => clearInterval(interval);
}, [onComplete]);
```

---

### CR-02: Mekan Fotoğrafı Proxy Uç Noktasında Doğrulanmamış Girdi ve SSRF Riski

**File:** `server/src/index.ts:52-79`  
**Category:** Security / Input Validation & SSRF  
**Issue:**  
`/api/venues/photo` uç noktası `photoName` parametresini doğrudan `req.query.name` üzerinden alır ve URL şablonuna doğrudan ekler:
```ts
const googlePhotoUrl = `https://places.googleapis.com/v1/${photoName}/media?maxHeightPx=600&maxWidthPx=800&key=${apiKey}`;
```
Parametre üzerinde herhangi bir regex veya yol doğrulama kontrolü yapılmadığından, istemci `../../` gibi yol manipülasyonları veya beklenmeyen URI segmentleri enjekte ederek sunucu üzerinden Google Cloud API anahtarını yetkisiz isteklerde suistimal edebilir veya SSRF açığına yol açabilir.

**Fix:**  
Google Places yeni API fotoğraf kaynak adları `places/[PLACE_ID]/photos/[PHOTO_ID]` formatındadır. Bu format kesin bir regex ile doğrulanmalıdır:
```ts
app.get('/api/venues/photo', async (req, res) => {
  const photoName = req.query.name as string;
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  const fallbackUrl = 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80';

  const VALID_PHOTO_NAME_REGEX = /^places\/[A-Za-z0-9_-]+\/photos\/[A-Za-z0-9_-]+$/;
  if (!photoName || !VALID_PHOTO_NAME_REGEX.test(photoName) || !apiKey) {
    return res.redirect(fallbackUrl);
  }
  // ... devam eder
```

---

## Warnings

### WR-01: `RoomManager` Sınıfında God Object / Monolitik Tasarım

**File:** `server/src/roomManager.ts:22-703`  
**Category:** Architecture / Maintainability  
**Issue:**  
`RoomManager` tek başına 703 satırdan oluşmaktadır. WebSocket bağlantı oturumları, PIN üretimi, oda yaşam döngüsü, konum çözümleme, oy verme/swipe motoru, deste tükenme analizi ve 5 saniyelik düello motorunun (sayaçlar, hile koruması, skor hesaplama, beraberlik yazı-turası) tamamını tek bir sınıfta barındırmaktadır. Tek Sorumluluk Prensibi (SRP) ihlal edilmiştir.

**Fix:**  
Düello mekanikleri `DuelEngine` servisine (`server/src/services/duelEngine.ts`), oda durum yönetimi ise ayrık bir depoya (`RoomStore`) bölünmelidir.

---

### WR-02: Görsel Yüklenemediğinde (`onError`) Sonsuz Döngü Riski

**File:** `client/src/components/VenueCard.tsx:51-53, 114-116` & `client/src/components/VenueListModal.tsx:78-82`  
**Category:** Frontend Stability / Error Handling  
**Issue:**  
Görsellerde `onError={(e) => { (e.target as HTMLImageElement).src = FALLBACK_IMAGE; }}` kullanılmıştır. Eğer internet bağlantısı kesilirse veya Unsplash fallback görseli yüklenemezse, tarayıcı tekrar `onError` tetikleyecek ve sonsuz bir döngü oluşacaktır. Bu durum tarayıcı sekmesini dondurabilir.

**Fix:**  
Yedek görsel atanmadan önce `onerror` işleyicisi sıfırlanmalıdır:
```tsx
onError={(e) => {
  const img = e.currentTarget;
  img.onerror = null;
  img.src = FALLBACK_IMAGE;
}}
```

---

### WR-03: `Lobby.tsx` İçinde Aşırı Sorumluluk Yığılması

**File:** `client/src/components/Lobby.tsx:10-531`  
**Category:** Component Architecture  
**Issue:**  
`Lobby.tsx` 531 satırdır ve sadece lobi ekranını değil, tüm uygulamanın state router'ı gibi davranmaktadır. Oda `swiping`, `matched` veya `duel` durumuna geçtiğinde `SwipeDeck` render edilmekte; lobi aşamasında ise PIN girişi, takma ad düzenleme, WhatsApp paylaşımı, QR kopyalama ve modal yönetimlerinin tamamı burada toplanmıştır. `App.tsx` ise yalnızca 12 satırdır.

**Fix:**  
Ekran yönlendirme ve görünüm yönetimi (LobbyView, RoomWaitingView, ActiveGameView) ayrılmalı, `App.tsx` gerçek bir view orchestrator haline getirilmelidir.

---

### WR-04: `useGeolocation` Hook'unda Bileşen Kapanma (Unmount) Sızıntısı

**File:** `client/src/hooks/useGeolocation.ts:23-55`  
**Category:** React Lifecycle / Memory Safety  
**Issue:**  
`navigator.geolocation.getCurrentPosition` 8 saniyelik bir zaman aşımına (`timeout: 8000`) sahiptir. Kullanıcı modalı kapattığında veya sayfadan ayrıldığında callback çalıştığında unmounted bileşen üzerinde `setIsLoading(false)` çağrısı yapılmaya çalışılacaktır.

**Fix:**  
Bileşenin hala bağlı olduğunu denetleyen bir `isMountedRef` veya `AbortController` benzeri bir iptal bayrağı eklenmelidir.

---

## Info

### IN-01: Client ve Server Arasında Tiplerin Kopyalanması

**File:** `client/src/types.ts` & `server/src/types.ts`  
**Category:** Code Quality / DRY  
**Issue:**  
148 satırlık veri modelleri (`Room`, `Participant`, `Venue`, `DuelState`, `ClientMessage`, `ServerMessage`) iki alt projede tıpatıp kopyalanmıştır. Protokolde yapılacak tek bir alan değişikliği iki dosyanın birden senkron güncellenmesini gerektirir.

**Fix:**  
Monorepo workspace yapısına uygun olarak ortak bir `@decidetogether/shared` paketi veya kök dizinde paylaşılan bir `types` modülü tanımlanmalıdır.

---

### IN-02: Yardımcı Fonksiyonların Çift Taraflı Tekrarı (`actionLinks.ts`)

**File:** `client/src/utils/actionLinks.ts` & `server/src/services/actionLinks.ts`  
**Category:** Code Quality / DRY  
**Issue:**  
Haversine mesafe hesaplama (`calculateDistanceKm`), Google Maps rota bağlantısı üretici (`buildGoogleMapsNavigationUrl`) ve sipariş arama linkleri (`buildDeliveryLinks`) hem istemcide hem sunucuda bağımsız dosyalarda kopyalanmıştır.

**Fix:**  
Bu saf matematiksel ve dize formatlayıcı fonksiyonlar ortak paylaşılan pakete taşınmalıdır.

---

### IN-03: Semt Listesi Tanımlarının Çift Taraflı Saklanması

**File:** `client/src/components/DistrictSelector.tsx:6-56` & `server/src/services/mockVenues.ts:3-76`  
**Category:** Maintainability / DRY  
**Issue:**  
Varsayılan semtler (`PRESET_DISTRICTS` ve `MOCK_DISTRICTS`) hem istemci bileşeni içine sabit dizi olarak yazılmış hem de sunucuda tanımlanmıştır.

**Fix:**  
Semt listesi tek bir konfigürasyondan beslenmelidir.

---

### IN-04: Kaynak Kodu İçinde 53 KB Statik Mock Veri Dosyası

**File:** `server/src/services/mockVenues.ts` (1,170 satır, 53.6 KB)  
**Category:** Code Cleanliness  
**Issue:**  
1000'den fazla satırlık mock restoran verisi doğrudan TypeScript kaynak dosyasında yer almakta, git diff'lerini ve derleme sürecini ağırlaştırmaktadır.

**Fix:**  
Mock veri `server/src/data/mockVenues.json` dosyasına taşınmalı ve ihtiyaç anında dinamik okunmalıdır.

---

_Reviewed: 2026-11-11T12:15:00Z_  
_Reviewer: gsd-code-reviewer_  
_Depth: deep_
