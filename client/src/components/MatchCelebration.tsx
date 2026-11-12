import React, { useEffect } from 'react';
import { Check } from 'lucide-react';
import { Venue, RoomLocation } from '../types.js';
import { buildGoogleMapsNavigationUrl, buildDeliveryLinks } from '../utils/actionLinks.js';
import {
  fireWarmCelebrationConfetti,
  triggerCelebrationEffects,
} from './celebration/celebrationConfetti.js';
import { CelebrationHeroCTA } from './celebration/CelebrationHeroCTA.js';
import { CelebrationPillGrid } from './celebration/CelebrationPillGrid.js';
import { CelebrationVenueCard } from './celebration/CelebrationVenueCard.js';

export { triggerCelebrationEffects, fireWarmCelebrationConfetti };

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
    fireWarmCelebrationConfetti();
  }, []);

  const navigationUrl = buildGoogleMapsNavigationUrl(venue, roomLocation?.coords);
  const deliveryLinks = buildDeliveryLinks(venue, roomLocation?.label);

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
          <span
            className={`inline-block mt-2.5 text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full ${
              duelResult?.tieBroken
                ? 'text-[#E07A5F] bg-[#FFF3E0]'
                : 'text-[#2D6A4F] bg-[#E8F5E9]'
            }`}
          >
            {duelResult?.tieBroken
              ? `Kura sonucu: ${duelResult.winnerNickname}`
              : duelResult?.winnerNickname
              ? `Düello kazananı: ${duelResult.winnerNickname}`
              : 'Ortak karar'}
          </span>
          <h2 id="match-celebration-title" className="font-display font-semibold text-2xl text-[#1C1917] mt-1">
            Karar verildi: Buradayız.
          </h2>
        </div>

        {/* Winner Restaurant Presentation Card (ACTION-01) */}
        <CelebrationVenueCard venue={venue} roomLocation={roomLocation} />

        {/* Post-Match Action Sub-Components (ACTION-02, ACTION-03 & MOB-04) */}
        <div className="space-y-2 pt-1">
          <CelebrationHeroCTA navigationUrl={navigationUrl} />
          <CelebrationPillGrid venue={venue} navigationUrl={navigationUrl} deliveryLinks={deliveryLinks} />
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
