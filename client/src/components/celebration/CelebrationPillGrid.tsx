import React from 'react';
import { Utensils, Phone, Share2 } from 'lucide-react';
import { Venue } from '../../types.js';
import { sanitizePhoneUri } from '../../utils/actionLinks.js';

export interface CelebrationPillGridProps {
  venue: Venue;
  navigationUrl: string;
  deliveryLinks: {
    yemeksepetiUrl: string;
    uberEatsUrl: string;
  };
  onCallVenue?: () => void;
  onShareResult?: () => void;
}

/**
 * 2x2 grid of crisp white action pills (Yemeksepeti, Uber Eats, Hemen Ara, WhatsApp Paylaş)
 * with 1px #E7E2D9 border and tactile interaction.
 */
export const CelebrationPillGrid: React.FC<CelebrationPillGridProps> = ({
  venue,
  navigationUrl,
  deliveryLinks,
  onCallVenue,
  onShareResult,
}) => {
  const safeTelUri = sanitizePhoneUri(venue.phone);

  const handleCall = () => {
    if (onCallVenue) {
      onCallVenue();
      return;
    }
    if (safeTelUri) {
      window.location.href = safeTelUri;
    } else {
      const phoneQuery = encodeURIComponent(`${venue.name} ${venue.address} telefon iletişim`);
      window.open(`https://www.google.com/search?q=${phoneQuery}`, '_blank', 'noopener,noreferrer');
    }
  };

  const handleShare = () => {
    if (onShareResult) {
      onShareResult();
      return;
    }
    const text = encodeURIComponent(
      `Ortak kararımız belli oldu: ${venue.name} (${venue.address}).\n\nYol tarifi: ${navigationUrl}`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank', 'noopener,noreferrer');
  };

  return (
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
        onClick={handleCall}
        title={venue.phone ? `Ara: ${venue.phone}` : 'Telefon numarasını bul'}
        className="bg-white border border-[#E7E2D9] text-[#1C1917] hover:bg-[#FAF7F2] font-medium text-xs py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 active:scale-[0.98] transition-all cursor-pointer"
      >
        <Phone className="w-3.5 h-3.5 text-[#78716C] shrink-0" />
        <span className="truncate">{venue.phone ? 'Hemen Ara' : 'Numara Bul'}</span>
      </button>

      <button
        type="button"
        onClick={handleShare}
        className="bg-white border border-[#E7E2D9] text-[#1C1917] hover:bg-[#FAF7F2] font-medium text-xs py-2.5 px-3 rounded-xl flex items-center justify-center gap-1.5 active:scale-[0.98] transition-all cursor-pointer"
      >
        <Share2 className="w-3.5 h-3.5 text-[#78716C] shrink-0" />
        <span className="truncate">WhatsApp Paylaş</span>
      </button>
    </div>
  );
};
