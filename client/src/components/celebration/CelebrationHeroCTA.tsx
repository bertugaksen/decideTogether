import React from 'react';
import { Navigation } from 'lucide-react';

export interface CelebrationHeroCTAProps {
  navigationUrl: string;
  label?: string;
}

/**
 * Basil Green full-width button rendering turn-by-turn navigation link
 * with Lucide Navigation icon and tactile tap scaling.
 */
export const CelebrationHeroCTA: React.FC<CelebrationHeroCTAProps> = ({
  navigationUrl,
  label = 'Yol Tarifi Al (Google Haritalar)',
}) => {
  return (
    <a
      href={navigationUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-[#2D6A4F] hover:bg-[#24543F] text-white font-medium text-sm transition-all shadow-xs active:scale-[0.98] cursor-pointer"
    >
      <Navigation className="w-4 h-4" />
      <span>{label}</span>
    </a>
  );
};
