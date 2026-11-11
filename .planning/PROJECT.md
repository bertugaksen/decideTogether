# DecideTogether

## What This Is

DecideTogether, çiftlerin ve arkadaşların "Ne yesek?" kararsızlığını ve seçim felcini (choice paralysis) 10 saniyelik eğlenceli bir oyuna dönüştüren mobil-web uygulamasıdır. Kullanıcılar üye olmadan 4 haneli PIN veya tek tık WhatsApp linkiyle odaya katılır; Google Places API ile çekilen civardaki gerçek mekanları bağımsız kaydırır; ortak ilk "Sağ" kaydırmada eşleşip anında yol tarifi veya sipariş linkine ulaşır. Deste biterse karar 5 saniyelik "Rapid Tapper" (Parmak Güreşi) düellosuyla verilir.

## Core Value

İki insanın sıfır sürtünmeyle (uygulama indirmeden / kayıt olmadan) 10 saniye içinde ortak bir yemek kararına varması veya beraberlikte tek telefondan/online eğlenceli bir düelloyla kazananı belirlemesi.

## Business Context

- **Customer**: Birlikte yemek yiyecek çiftler, ev arkadaşları ve arkadaş grupları; yerel restoranlar (reklam veren).
- **Revenue model**: Yerel sponsorlu restoran kartları (ilk 3 kart önceliği) + yemek sipariş uygulaması yönlendirme komisyonu (Affiliate / CPA).
- **Success metric**: Kurulan odaların en az %75'inin kararla sonuçlanması ve %40'ının "Yol Tarifi Al / Sipariş Ver" aksiyonuna tıklaması.
- **Strategy notes**: Mobil Web (PWA) öncelikli; virallik katsayısı yüksek iki kişilik doğal davet döngüsü.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Tek tıkla oda oluşturma (4 haneli PIN ve tek dokunuş WhatsApp davet linki)
- [ ] Sıfır login / anonim katılım ("Aç Panda", "Kararsız Koala" gibi eğlenceli takma adlar)
- [ ] Konum belirleme: GPS otomatik konum veya elle ilçe/semt seçimi (Hibrit)
- [ ] Google Places API ile civardaki açık gerçek mekanların 12-15 kartlık destesini çekme (ad, puan, fotoğraf, adres)
- [ ] Node.js WebSockets ile gerçek zamanlı lobi ve çift taraflı senkronizasyon
- [ ] Framer Motion ile akıcı kart kaydırma (Sağa Beğen, Sola Pas) ve eşzamanlı eşleşme (Match & Confetti)
- [ ] Beraberlik Bozucu: Deste bittiğinde 5 saniyelik Rapid Tapper (Parmak Güreşi) mini-düellosu (uzaktaysa online tap havuzu, masadalarsa tek ekrana geçiş)
- [ ] Eşleşme ekranı aksiyonları: Google Maps "🧭 Yol Tarifi Al" navigasyon linki ve "🛵 Sipariş Ver / 📞 Ara" butonu
- [ ] Bağlantı kopması kurtarma: `localStorage` ile oturumu saklama ve 30 saniyelik yeniden bağlanma toleransı
- [ ] Sponsorlu restoran kartı desteği (ilk 3 kartta yerel sponsor yerleşimi altyapısı)

### Out of Scope

- [Film / Dizi / Aktivite kategorileri] — MVP'de kararsızlığı artırmamak ve odağı dağıtmamak için sadece Yemek tutuldu; v2'ye ertelendi.
- [App Store / Google Play native app indirme] — Davet edilen kişinin indirme sürtünmesini (%80 terk oranı) sıfırlamak için Mobil Web (PWA) seçildi.
- [Kullanıcı üyelik / şifre / profil sistemi] — Anlık kullanım önceliği; sürtünme sıfır olmalı.
- [B2B Slack / Teams entegrasyonu] — Başlangıçta bireysel çiftlere (B2C) odaklanıldı.
- [Grup modu (3+ kişi çoğunluk oyu)] — İlk fazda 2 kişilik çift dinamiği doğrulandıktan sonra eklenecek.

## Context

- Teknik yığın: Full-Stack TypeScript (Node.js + WebSockets backend + React 19 / Vite frontend + Tailwind CSS + Framer Motion).
- Ağ dayanıklılığı: Rapid Tapper düellosunda ping adaleti için yerel anındalık (client-side optimism), 100ms batch sayaç yollama ve senkronize zaman damgası kullanılır.
- Veri kaynağı: Google Places API (Aylık 200$ ücretsiz bakiye + Sanal kart ile 0$ harcama kilidi).

## Constraints

- **Platform**: Mobil Web (PWA) — İndirme bariyeri olmaksızın mobil tarayıcılarda tam ekran ve akıcı çalışmalı.
- **Performans**: Eşleşme ve WebSocket gecikmesi <100ms olmalı.
- **Bütçe**: Sıfır altyapı maliyeti (Vercel/Railway ücretsiz host + Google Cloud ücretsiz kota).
- **Zaman Sınırı**: Bir karar oturumu maksimum 60 saniyede tamamlanmalı.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Mobil Web (PWA) seçimi | Native app indirme sürtünmesini yok etmek ve WhatsApp'tan anında odaya çekebilmek için | — Pending |
| Yalnızca Yemek kategorisi | İlk sürümde kapsam şişmesini (scope creep) önlemek ve en sık yaşanan problemi çözmek için | — Pending |
| Google Places API ile gerçek mekanlar | "Burger" gibi genel yemek seçildikten sonra "Hangi mekan?" krizinin devam etmesini önlemek için | — Pending |
| Rapid Tapper (Parmak Güreşi) | Beraberlikte çarkıfelek/yazı-tura gibi sıkıcı şans yerine viral, yüksek enerjili bir düello sunmak için | — Pending |
| "Yol Tarifi Al" navigasyonu | Mekan zaten belli olduğu için tekrar arama yerine doğrudan Google Maps rotasını başlatmak için | — Pending |
| Sponsorlu Kart + Komisyon | Reklam/sponsorluk satışı ve yemek sipariş yönlendirmelerinden ilk günden gelir üretebilmek için | — Pending |
| Full-Stack TypeScript | Python veya C# yerine tek dil ile ortak tip paylaşımı, sıfır dil geçişi ve maksimum geliştirme hızı için | ✓ Good |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-11-07 after project initialization questioning*
