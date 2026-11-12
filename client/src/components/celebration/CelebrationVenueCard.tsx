import React from 'react';
import { Star, MapPin } from 'lucide-react';
import { Venue, RoomLocation } from '../../types.js';
import { formatPriceTier, calculateDistanceKm } from '../../utils/actionLinks.js';

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=400&q=80';

export interface CelebrationVenueCardProps {
  venue: Venue;
  roomLocation?: RoomLocation;
}

/**
 * Editorial presentation card showcasing the matched winning venue,
 * including high-res imagery, rating badges, distance, price tier, and live open status.
 */
export const CelebrationVenueCard: React.FC<CelebrationVenueCardProps> = ({
  venue,
  roomLocation,
}) => {
  const priceTier = formatPriceTier(venue.priceLevel);
  const distanceKm =
    venue.distanceKm ??
    (roomLocation?.coords && venue.location
      ? calculateDistanceKm(
          roomLocation.coords.lat,
          roomLocation.coords.lng,
          venue.location.lat,
          venue.location.lng
        )
      : undefined);

  return (
    <div className="bg-white rounded-2xl border border-[#E7E2D9] overflow-hidden shadow-xs text-left">
      <div className="relative w-full h-40 bg-stone-100">
        <img
          src={venue.photoUrl || FALLBACK_IMAGE}
          alt={venue.name}
          className="w-full h-full object-cover"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = FALLBACK_IMAGE;
          }}
        />
        {distanceKm !== undefined && (
          <div className="absolute bottom-2.5 right-2.5 bg-[#1C1917]/80 backdrop-blur-xs text-white text-[10px] font-semibold px-2 py-0.5 rounded-full">
            ~{distanceKm} km
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
  );
};
