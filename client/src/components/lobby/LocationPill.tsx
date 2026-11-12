import React from 'react';
import { MapPin } from 'lucide-react';

export interface LocationPillProps {
  label: string;
  onOpenDistrictSelector: () => void;
  isLiveRoom?: boolean;
  venueCount?: number;
}

/**
 * Editorial location chip indicating the active district, venue count,
 * and live room status, allowing instant opening of the DistrictSelector modal.
 */
export const LocationPill: React.FC<LocationPillProps> = ({
  label,
  onOpenDistrictSelector,
  isLiveRoom = false,
  venueCount,
}) => {
  return (
    <div className="flex items-center gap-2 mb-2">
      <button
        type="button"
        onClick={onOpenDistrictSelector}
        className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-white border border-[#E7E2D9] hover:border-[#D9381E] text-[#1C1917] transition-all shadow-2xs active:scale-95 cursor-pointer"
      >
        <MapPin className="w-3.5 h-3.5 text-[#D9381E]" />
        <span>{label}</span>
        {venueCount !== undefined && venueCount > 0 && (
          <span className="text-[10px] text-[#78716C] font-normal">({venueCount})</span>
        )}
        <span className="text-[10px] text-[#78716C] ml-0.5">▼ Değiştir</span>
      </button>
      {isLiveRoom && (
        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-[#E8F5E9] text-[#2D6A4F]">
          ● CANLI ODA
        </span>
      )}
    </div>
  );
};
