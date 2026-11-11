import React from 'react';
import { Swords, LogOut, Smartphone } from 'lucide-react';
import { soundEffects } from '../utils/soundEffects.js';

export interface DeckExhaustedProps {
  onLeave: () => void;
  onStartOnlineDuel?: () => void;
  onStartSplitDuel?: () => void;
}

export const DeckExhausted: React.FC<DeckExhaustedProps> = ({
  onLeave,
  onStartOnlineDuel,
  onStartSplitDuel,
}) => {
  const handleOnlineClick = () => {
    soundEffects.initOnUserGesture(); // Unlock AudioContext on mobile
    onStartOnlineDuel?.();
  };

  const handleSplitClick = () => {
    soundEffects.initOnUserGesture(); // Unlock AudioContext on mobile
    onStartSplitDuel?.();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-sm bg-[#FBF9F5] rounded-3xl border border-[#E7E2D9] p-6 space-y-4 text-center">
        {/* Header and description */}
        <div className="w-14 h-14 mx-auto rounded-2xl bg-[#FAF7F2] border border-[#E7E2D9] flex items-center justify-center">
          <Swords className="w-6 h-6 text-[#E07A5F]" />
        </div>

        <div>
          <span className="inline-block text-xs font-medium text-[#78716C] bg-[#FAF7F2] border border-[#E7E2D9] px-3 py-1 rounded-full">
            Ortak karar bulunamadı
          </span>
          <h2 className="font-display font-extrabold text-2xl text-[#1C1917] mt-2">
            Beraberlik!
          </h2>
          <p className="text-xs text-[#78716C] mt-2 leading-relaxed">
            İkiniz de aynı mekanda buluşamadınız. Kararı 5 saniyelik eğlenceli Parmak Güreşi (Rapid Tapper) düellosuyla belirlemeye hazır mısınız?
          </p>
        </div>

        {/* Dual Mode Actions per UI-SPEC */}
        <div className="space-y-2 pt-2">
          {/* Primary CTA (Mode A) */}
          <button
            onClick={handleOnlineClick}
            className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-[#D9381E] hover:bg-[#BF2F18] text-white font-display font-bold text-sm transition-all shadow-xs active:translate-y-px cursor-pointer"
          >
            <Swords className="w-4 h-4 text-white" />
            <span>Parmak Güreşini Başlat</span>
          </button>

          {/* Secondary CTA (Mode B) */}
          <button
            onClick={handleSplitClick}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-white border border-[#E7E2D9] hover:bg-[#FAF7F2] text-[#1C1917] font-semibold text-sm transition-colors cursor-pointer"
          >
            <Smartphone className="w-4 h-4 text-[#2D6A4F]" />
            <span>Yan Yana Oyna (Tek Telefon)</span>
          </button>

          {/* Exit Action */}
          <button
            onClick={onLeave}
            className="w-full flex items-center justify-center gap-2 py-2 px-4 text-[#78716C] hover:text-[#D9381E] font-medium text-xs transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Odadan Ayrıl</span>
          </button>
        </div>
      </div>
    </div>
  );
};
