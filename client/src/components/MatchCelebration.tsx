import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  Star,
  MapPin,
  Check,
  Navigation,
  Share2,
  Phone,
  Utensils,
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

  confetti({
    particleCount: 70,
    spread: 60,
    origin: { y: 0.6 },
    colors: ['#E07A5F', '#D4AF37', '#2D6A4F', '#FBF9F5'],
    disableForReducedMotion: true,
  });
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

  // ACTION-03: Call restaurant directly via sanitized tel: URI or phone lookup fallback
  const handleCallVenue = () => {
    if (safeTelUri) {
      window.location.href = safeTelUri;
    } else {
      const phoneQuery = encodeURIComponent(`${venue.name} ${venue.address} telefon iletişim`);
      window.open(`https://www.google.com/search?q=${phoneQuery}`, '_blank', 'noopener,noreferrer');
    }
  };

  const handleShareResult = () => {
    const text = encodeURIComponent(
      `Ortak kararımız belli oldu: ${venue.name} (${venue.address}).\n\nYol tarifi: ${navigationUrl}`
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
      <div className="relative w-full max-w-sm bg-[#FBF9F5] rounded-3xl border border-[#E7E2D9] p-5 shadow-sm space-y-3.5 text-center my-auto">
        {/* Celebration Header */}
        <div>
          <div className="w-12 h-12 mx-auto rounded-2xl bg-[#E8F5E9] flex items-center justify-center shadow-xs">
            <Check className="w-6 h-6 text-[#2D6A4F]" />
          </div>
          {duelResult?.tieBroken ? (
            <span className="inline-block mt-2.5 text-[11px] font-bold uppercase tracking-wider text-[#E07A5F] bg-[#FFF3E0] px-3 py-1 rounded-full">
              Kura sonucu: {duelResult.winnerNickname}
            </span>
          ) : duelResult?.winnerNickname ? (
            <span className="inline-block mt-2.5 text-[11px] font-bold uppercase tracking-wider text-[#2D6A4F] bg-[#E8F5E9] px-3 py-1 rounded-full">
              Düello kazananı: {duelResult.winnerNickname}
            </span>
          ) : (
            <span className="inline-block mt-2.5 text-[11px] font-bold uppercase tracking-wider text-[#2D6A4F] bg-[#E8F5E9] px-3 py-1 rounded-full">
              Ortak karar
            </span>
          )}
          <h2
            id="match-celebration-title"
            className="font-display font-semibold text-2xl text-[#1C1917] mt-1"
          >
            Karar verildi: Buradayız.
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
            {computedDistanceKm !== undefined && (
              <div className="absolute bottom-2.5 right-2.5 bg-[#1C1917]/80 backdrop-blur-xs text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">
                ~{computedDistanceKm} km
              </div>
            )}
          </div>

          <div className="p-4">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold text-[#E07A5F] uppercase truncate">
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

        {/* Post-Match Action Buttons (ACTION-02, ACTION-03 & MOB-04) */}
        <div className="space-y-2 pt-1">
          {/* Primary CTA: Turn-by-turn Google Maps Navigation with Live GPS Origin (ACTION-02) */}
          <a
            href={navigationUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-[#2D6A4F] hover:bg-[#24543F] text-white font-medium text-sm transition-all shadow-xs active:scale-[0.98] cursor-pointer"
          >
            <Navigation className="w-4 h-4" />
            <span>Yol Tarifi Al (Google Haritalar)</span>
          </a>

          {/* 2x2 Secondary Action Pills */}
          <div className="grid grid-cols-2 gap-2 mt-3">
            <a
              href={deliveryLinks.yemeksepetiUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white border border-[#E7E2D9] text-[#1C1917] hover:bg-[#FAF7F2] font-medium text-xs py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 active:scale-[0.98] transition-all cursor-pointer"
            >
              <Utensils className="w-3.5 h-3.5 text-[#78716C] shrink-0" />
              <span>Yemeksepeti</span>
            </a>

            <a
              href={deliveryLinks.uberEatsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-white border border-[#E7E2D9] text-[#1C1917] hover:bg-[#FAF7F2] font-medium text-xs py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 active:scale-[0.98] transition-all cursor-pointer"
            >
              <Utensils className="w-3.5 h-3.5 text-[#78716C] shrink-0" />
              <span>Uber Eats</span>
            </a>

            <button
              type="button"
              onClick={handleCallVenue}
              title={venue.phone ? `Ara: ${venue.phone}` : 'Telefon numarasını bul'}
              className="bg-white border border-[#E7E2D9] text-[#1C1917] hover:bg-[#FAF7F2] font-medium text-xs py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 active:scale-[0.98] transition-all cursor-pointer"
            >
              <Phone className="w-3.5 h-3.5 text-[#78716C] shrink-0" />
              <span className="truncate">{venue.phone ? 'Hemen Ara' : 'Numara Bul'}</span>
            </button>

            <button
              type="button"
              onClick={handleShareResult}
              className="bg-white border border-[#E7E2D9] text-[#1C1917] hover:bg-[#FAF7F2] font-medium text-xs py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 active:scale-[0.98] transition-all cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5 text-[#78716C] shrink-0" />
              <span className="truncate">WhatsApp Paylaş</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onLeave}
            className="w-full text-center py-2 text-xs text-[#78716C] hover:text-[#1C1917] transition-colors cursor-pointer"
          >
            Yeni Karar Odası Başlat
          </button>
        </div>
      </div>
    </div>
  );
};
