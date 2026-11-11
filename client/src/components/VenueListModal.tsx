import React from 'react';
import { X, Star, MapPin, Sparkles, UtensilsCrossed } from 'lucide-react';
import { Venue } from '../types.js';

interface VenueListModalProps {
  isOpen: boolean;
  onClose: () => void;
  locationLabel: string;
  venues: Venue[];
}

export const VenueListModal: React.FC<VenueListModalProps> = ({
  isOpen,
  onClose,
  locationLabel,
  venues,
}) => {
  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="venue-list-title"
      className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4"
    >
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative w-full max-w-lg bg-[#FBF9F5] rounded-t-3xl sm:rounded-2xl border border-[#E7E2D9] p-6 shadow-xl space-y-4 max-h-[85vh] flex flex-col animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#E7E2D9] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#FDF2F0] flex items-center justify-center text-[#D9381E]">
              <UtensilsCrossed className="w-5 h-5" />
            </div>
            <div>
              <h3 id="venue-list-title" className="font-display font-bold text-lg text-[#1C1917] leading-tight">
                {locationLabel} Seçkisi
              </h3>
              <p className="text-xs text-[#78716C] mt-0.5">
                Oylamaya hazır {venues.length} popüler mekan
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-[#78716C] hover:text-[#1C1917] hover:bg-[#FAF7F2] transition-colors"
            aria-label="Kapat"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Venue List */}
        <div className="overflow-y-auto space-y-2.5 pr-1 flex-1">
          {venues.length === 0 ? (
            <div className="text-center py-8 text-sm text-[#78716C]">
              Henüz mekan yüklenmedi.
            </div>
          ) : (
            venues.map((venue, idx) => (
              <div
                key={venue.id || idx}
                className={`p-3.5 rounded-xl border transition-all ${
                  venue.isSponsored
                    ? 'bg-[#FFFBF5] border-[#F0D5BA] shadow-2xs'
                    : 'bg-white border-[#E7E2D9] hover:border-[#D0C9BD]'
                }`}
              >
                <div className="flex items-start gap-3">
                  {/* Photo or placeholder */}
                  <div className="w-16 h-16 rounded-lg bg-[#F5F0EB] overflow-hidden shrink-0 border border-[#E7E2D9]">
                    <img
                      src={venue.photoUrl}
                      alt={venue.name}
                      className="w-full h-full object-cover"
                      loading="lazy"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=400&q=80';
                      }}
                    />
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-bold text-[#78716C]">#{idx + 1}</span>
                      <h4 className="font-bold text-sm text-[#1C1917] truncate">
                        {venue.name}
                      </h4>
                      {venue.isSponsored && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#D9381E] text-white">
                          <Sparkles className="w-2.5 h-2.5" />
                          {venue.sponsorBadge || 'Öne Çıkan'}
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-[#78716C] mt-0.5 truncate">{venue.category}</p>

                    <div className="flex items-center gap-3 mt-1.5 text-xs text-[#78716C]">
                      <div className="flex items-center gap-1 font-semibold text-[#1C1917]">
                        <Star className="w-3.5 h-3.5 fill-[#E07A5F] text-[#E07A5F]" />
                        <span>{venue.rating.toFixed(1)}</span>
                        <span className="text-[10px] text-[#A8A29E]">({venue.reviewCount})</span>
                      </div>

                      {venue.priceLevel && (
                        <span className="text-[#78716C] font-semibold text-[11px]">
                          {'₺'.repeat(venue.priceLevel)}
                        </span>
                      )}

                      {venue.isOpenNow !== undefined && (
                        <span
                          className={`text-[10px] font-semibold px-1.5 py-0.2 rounded ${
                            venue.isOpenNow
                              ? 'bg-[#E8F5E9] text-[#2D6A4F]'
                              : 'bg-[#FFEBEE] text-[#B71C1C]'
                          }`}
                        >
                          {venue.isOpenNow ? 'Açık' : 'Kapalı'}
                        </span>
                      )}
                    </div>

                    {venue.address && (
                      <div className="flex items-center gap-1 mt-1 text-[11px] text-[#A8A29E] truncate">
                        <MapPin className="w-3 h-3 shrink-0" />
                        <span className="truncate">{venue.address}</span>
                      </div>
                    )}

                    {venue.sponsorPromoText && (
                      <p className="mt-1.5 text-[11px] font-semibold text-[#D9381E] bg-[#FDF2F0] px-2 py-1 rounded-md">
                        {venue.sponsorPromoText}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-[#E7E2D9] shrink-0">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-[#1C1917] hover:bg-black text-white text-xs font-semibold transition-colors"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
};
