import React from 'react';
import { Sparkles, Loader2 } from 'lucide-react';

export interface CreateRoomCardProps {
  userName: string;
  onUserNameChange: (name: string) => void;
  onCreateRoom: () => void;
  isLoading?: boolean;
}

/**
 * Editorial card for initiating a new decision session, generating a 4-digit PIN,
 * with tactile button press and loading spinner state.
 */
export const CreateRoomCard: React.FC<CreateRoomCardProps> = ({
  userName,
  onUserNameChange,
  onCreateRoom,
  isLoading = false,
}) => {
  return (
    <div className="bg-white rounded-2xl border border-[#E7E2D9] p-6 shadow-xs">
      <h3 className="font-display font-bold text-lg text-[#1C1917] mb-1">
        Yeni Karar Odası Başlat
      </h3>
      <p className="text-xs text-[#78716C] mb-4">
        Tek tıkla 4 haneli PIN üret, arkadaşına WhatsApp'tan gönder ve 10 saniyede karar verin.
      </p>

      <div className="mb-4">
        <label
          htmlFor="user-name-create"
          className="block text-xs font-bold uppercase tracking-wider text-[#78716C] mb-1.5"
        >
          İsminiz (İsteğe Bağlı)
        </label>
        <input
          id="user-name-create"
          type="text"
          maxLength={15}
          value={userName}
          onChange={(e) => onUserNameChange(e.target.value)}
          placeholder="Örn: Deniz"
          className="w-full text-sm py-2 px-3 rounded-xl border border-[#E7E2D9] focus:outline-none focus:border-[#D9381E] bg-[#FAF7F2]"
        />
      </div>

      <button
        type="button"
        onClick={onCreateRoom}
        disabled={isLoading}
        className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-[#D9381E] hover:bg-[#BF2F18] text-white font-semibold text-sm transition-colors shadow-xs active:translate-y-px disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Oda Oluşturuluyor...</span>
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4" />
            <span>Hemen Oda Oluştur</span>
          </>
        )}
      </button>
    </div>
  );
};
