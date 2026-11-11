import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import {
  Star,
  MapPin,
  Sparkles,
  Navigation,
  Share2,
  Phone,
  Utensils,
  ExternalLink,
} from 'lucide-react';
import { Venue, RoomLocation } from '../types.js';
import {
  buildGoogleMapsNavigationUrl,
  buildDeliveryLinks,
  sanitizePhoneUri,
  formatPriceTier,
  calculateDistanceKm,
} from '../utils/actionLinks.js';

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=400&q=80';

export function triggerCelebrationEffects() {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate([100, 50, 100, 50, 200]);
    } catch {
      // Ignore vibration error on non-supported hardware
    }
  }

  // 1. Center burst
  confetti({
    particleCount: 80,
    spread: 60,
    origin: { y: 0.6 },
    colors: ['#D9381E', '#2D6A4F', '#E07A5F', '#FBF9F5'],
  });

  // 2. Left and Right Cannons
  setTimeout(() => {
    confetti({
      particleCount: 50,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.65 },
      colors: ['#D9381E', '#2D6A4F', '#E07A5F'],
    });
    confetti({
      particleCount: 50,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.65 },
      colors: ['#D9381E', '#2D6A4F', '#E07A5F'],
    });
  }, 200);
}

export interface MatchCelebrationProps {
  venue: Venue;
  onLeave: () => void;
  roomLocation?: RoomLocation;
  duelResult?: {
    winnerNickname?: string;
    scores?: Record<string, number>;
    tieBroken?: boolean;
  };
}

export const MatchCelebration: React.FC<MatchCelebrationProps> = ({
  venue,
  onLeave,
  roomLocation,
  duelResult,
}) => {
  const [showDeliveryOptions, setShowDeliveryOptions] = useState(false);

  useEffect(() => {
    triggerCelebrationEffects();
  }, []);

  const navigationUrl = buildGoogleMapsNavigationUrl(venue, roomLocation?.coords);
  const deliveryLinks = buildDeliveryLinks(venue, roomLocation?.label);
  const safeTelUri = sanitizePhoneUri(venue.phone);
  const priceTier = formatPriceTier(venue.priceLevel);

  const computedDistanceKm =
    venue.distanceKm !== undefined
      ? venue.distanceKm
      : roomLocation?.coords && venue.location
      ? calculateDistanceKm(
          roomLocation.coords.lat,
          roomLocation.coords.lng,
          venue.location.lat,
          venue.location.lng
        )
      : undefined;

  // ACTION-02: Start direct Google Maps turn-by-turn route navigation
  const handleOpenGoogleMaps = () => {
    window.open(navigationUrl, '_blank', 'noopener,noreferrer');
  };

  // ACTION-03: Call restaurant directly via sanitized tel: URI or phone lookup fallback
  const handleCallVenue = () => {
    if (safeTelUri) {
      window.location.href = safeTelUri;
    } else {
      const phoneQuery = encodeURIComponent(`${venue.name} ${venue.address} telefon iletişim`);
      window.open(`https://www.google.com/search?q=${phoneQuery}`, '_blank', 'noopener,noreferrer');
    }
  };

  // ACTION-03: Open delivery platform search
  const handleOpenDeliveryPlatform = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleShareResult = () => {
    const text = encodeURIComponent(
      `🎉 Karar verildi! Bu akşam ${venue.name} (${venue.address}) gidiyoruz! 🍕\n🧭 Yol tarifi: ${navigationUrl}`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank', 'noopener,noreferrer');
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="match-celebration-title"
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-300"
    >
      <div className="relative w-full max-w-sm bg-[#FBF9F5] rounded-3xl border border-[#E7E2D9] p-5 shadow-2xl space-y-3.5 text-center my-auto">
        {/* Celebration Header */}
        <div>
          <div className="w-12 h-12 mx-auto rounded-2xl bg-[#E8F5E9] text-[#2D6A4F] flex items-center justify-center text-2xl shadow-xs">
            🎉
          </div>
          {duelResult?.tieBroken ? (
            <span className="inline-block mt-2.5 text-[11px] font-bold uppercase tracking-wider text-[#E07A5F] bg-[#FFF3E0] px-3 py-1 rounded-full">
              TAM BERABERLİK! YAZI-TURA KAZANANI: {duelResult.winnerNickname}
            </span>
          ) : duelResult?.winnerNickname ? (
            <span className="inline-block mt-2.5 text-[11px] font-bold uppercase tracking-wider text-[#2D6A4F] bg-[#E8F5E9] px-3 py-1 rounded-full">
              🏆 DÜELLO KAZANANI: {duelResult.winnerNickname}
            </span>
          ) : (
            <span className="inline-block mt-2.5 text-[11px] font-bold uppercase tracking-wider text-[#D9381E] bg-[#FDF2F0] px-3 py-1 rounded-full">
              ORTAK KARAR BULUNDU!
            </span>
          )}
          <h2
            id="match-celebration-title"
            className="font-display font-black text-2xl text-[#1C1917] mt-1"
          >
            Bu akşam buradayız!
          </h2>
        </div>

        {/* Winner Restaurant Card (ACTION-01) */}
        <div className="bg-white rounded-2xl border border-[#E7E2D9] overflow-hidden shadow-xs text-left">
          <div className="relative w-full h-40 bg-stone-100">
            <img
              src={venue.photoUrl || FALLBACK_IMAGE}
              alt={venue.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                const img = e.currentTarget;
                img.onerror = null;
                img.src = FALLBACK_IMAGE;
              }}
            />
            {venue.isSponsored && (
              <div className="absolute top-3 left-3 bg-[#D9381E] text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                <Sparkles className="w-3 h-3" />
                <span>{venue.sponsorBadge || 'Sponsorlu'}</span>
              </div>
            )}
            {computedDistanceKm !== undefined && (
              <div className="absolute bottom-2.5 right-2.5 bg-[#1C1917]/80 backdrop-blur-xs text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">
                ~{computedDistanceKm} km
              </div>
            )}
          </div>

          <div className="p-4">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-[#D9381E] uppercase truncate">
                {venue.category}
              </span>
              <div className="flex items-center gap-1 bg-[#F5F0EB] px-2 py-0.5 rounded-lg text-xs font-bold text-[#1C1917] shrink-0">
                <Star className="w-3.5 h-3.5 fill-[#E07A5F] text-[#E07A5F]" />
                <span>{venue.rating.toFixed(1)}</span>
                <span className="text-[#78716C] font-normal">({venue.reviewCount})</span>
              </div>
            </div>

            <h3 className="font-display font-bold text-xl text-[#1C1917] mt-1 leading-snug">
              {venue.name}
            </h3>
            <p className="text-xs text-[#78716C] mt-1 flex items-start gap-1">
              <MapPin className="w-3.5 h-3.5 text-[#78716C] shrink-0 mt-0.5" />
              <span>{venue.address}</span>
            </p>

            {venue.sponsorPromoText && (
              <p className="mt-2 text-[11px] font-semibold text-[#D9381E] bg-[#FDF2F0] px-2.5 py-1 rounded-md">
                {venue.sponsorPromoText}
              </p>
            )}

            <div className="flex items-center justify-between pt-2.5 mt-2.5 border-t border-[#E7E2D9] text-xs font-medium text-[#78716C]">
              <span>
                Fiyat: <strong className="text-[#1C1917]">{priceTier.symbols}</strong> ({priceTier.label})
              </span>
              <span className={venue.isOpenNow !== false ? 'text-[#2D6A4F] font-semibold' : 'text-[#78716C]'}>
                {venue.isOpenNow !== undefined ? (venue.isOpenNow ? '● Açık' : '○ Kapalı') : '● Açık'}
              </span>
            </div>
          </div>
        </div>

        {/* Post-Match Action Buttons (ACTION-02 & ACTION-03) */}
        <div className="space-y-2 pt-1">
          {/* Primary CTA: Turn-by-turn Google Maps Navigation (ACTION-02) */}
          <button
            type="button"
            onClick={handleOpenGoogleMaps}
            className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-[#D9381E] hover:bg-[#BF2F18] text-white font-semibold text-sm transition-colors shadow-xs active:translate-y-px cursor-pointer"
          >
            <Navigation className="w-4 h-4" />
            <span>🧭 Yol Tarifi Al (Google Haritalar)</span>
          </button>

          {/* Secondary CTA Row: Delivery Order & Direct Phone Call (ACTION-03) */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setShowDeliveryOptions((prev) => !prev)}
              aria-expanded={showDeliveryOptions}
              className="flex items-center justify-center gap-1.5 py-3 px-3 rounded-xl bg-[#2D6A4F] hover:bg-[#24543E] text-white font-semibold text-xs transition-colors shadow-2xs active:translate-y-px cursor-pointer"
            >
              <Utensils className="w-3.5 h-3.5 shrink-0" />
              <span>🛵 Sipariş Ver</span>
            </button>

            <button
              type="button"
              onClick={handleCallVenue}
              title={venue.phone ? `Ara: ${venue.phone}` : 'Telefon numarasını bul'}
              className="flex items-center justify-center gap-1.5 py-3 px-3 rounded-xl bg-white border border-[#E7E2D9] hover:bg-[#FAF7F2] text-[#1C1917] font-semibold text-xs transition-colors active:translate-y-px cursor-pointer"
            >
              <Phone className="w-3.5 h-3.5 text-[#D9381E] shrink-0" />
              <span className="truncate">{venue.phone ? '📞 Hemen Ara' : '📞 Numara Bul'}</span>
            </button>
          </div>

          {/* Expandable Delivery Platform Picker (ACTION-03) */}
          {showDeliveryOptions && (
            <div className="p-3 rounded-2xl bg-white border border-[#E7E2D9] space-y-2 text-left animate-in fade-in duration-150">
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#78716C]">
                Sipariş Platformu Seçin
              </p>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => handleOpenDeliveryPlatform(deliveryLinks.yemeksepetiUrl)}
                  className="py-2 px-2 rounded-lg bg-[#FDF2F0] hover:bg-[#FCE4DF] text-[#D9381E] font-bold text-[11px] flex items-center justify-center gap-1 transition-colors cursor-pointer"
                >
                  <span>Yemeksepeti</span>
                  <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenDeliveryPlatform(deliveryLinks.getirYemekUrl)}
                  className="py-2 px-2 rounded-lg bg-[#F5F0EB] hover:bg-[#EAE2D9] text-[#1C1917] font-bold text-[11px] flex items-center justify-center gap-1 transition-colors cursor-pointer"
                >
                  <span>GetirYemek</span>
                  <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenDeliveryPlatform(deliveryLinks.trendyolYemekUrl)}
                  className="py-2 px-2 rounded-lg bg-[#FFF3E0] hover:bg-[#FFE0B2] text-[#E65100] font-bold text-[11px] flex items-center justify-center gap-1 transition-colors cursor-pointer"
                >
                  <span>Trendyol</span>
                  <ExternalLink className="w-2.5 h-2.5 shrink-0" />
                </button>
              </div>
              <button
                type="button"
                onClick={() => handleOpenDeliveryPlatform(deliveryLinks.primaryUrl)}
                className="w-full py-1.5 text-center text-[11px] font-semibold text-[#78716C] hover:text-[#1C1917] underline cursor-pointer"
              >
                Tüm Sipariş Seçeneklerini Google'da Ara
              </button>
            </div>
          )}

          {/* Share & Restart Actions */}
          <button
            type="button"
            onClick={handleShareResult}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-white border border-[#E7E2D9] hover:bg-[#FAF7F2] text-[#1C1917] font-semibold text-xs transition-colors active:translate-y-px cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5 text-[#2D6A4F]" />
            <span>WhatsApp ile Arkadaşına Gönder</span>
          </button>

          <button
            type="button"
            onClick={onLeave}
            className="w-full text-center py-1.5 text-xs text-[#78716C] hover:text-[#D9381E] transition-colors cursor-pointer"
          >
            Yeni Karar Odası Başlat
          </button>
        </div>
      </div>
    </div>
  );
};
