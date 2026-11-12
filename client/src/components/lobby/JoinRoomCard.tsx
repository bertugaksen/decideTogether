import React from 'react';
import { Loader2 } from 'lucide-react';

export interface JoinRoomCardProps {
  userName: string;
  onUserNameChange: (name: string) => void;
  inputPin: string;
  onPinChange: (pin: string) => void;
  onJoinSubmit: (e: React.FormEvent) => void;
  isLoading?: boolean;
}

/**
 * Editorial card for joining an existing decision room via 4-digit PIN,
 * supporting instant numpad input on mobile browsers and immediate validation.
 */
export const JoinRoomCard: React.FC<JoinRoomCardProps> = ({
  userName,
  onUserNameChange,
  inputPin,
  onPinChange,
  onJoinSubmit,
  isLoading = false,
}) => {
  return (
    <form
      onSubmit={onJoinSubmit}
      className="bg-white rounded-2xl border border-[#E7E2D9] p-6 shadow-xs"
    >
      <div className="mb-3">
        <label
          htmlFor="user-name-join"
          className="block text-xs font-bold uppercase tracking-wider text-[#78716C] mb-1.5"
        >
          İsminiz (İsteğe Bağlı)
        </label>
        <input
          id="user-name-join"
          type="text"
          maxLength={15}
          value={userName}
          onChange={(e) => onUserNameChange(e.target.value)}
          placeholder="Örn: Ece"
          className="w-full text-sm py-2 px-3 rounded-xl border border-[#E7E2D9] focus:outline-none focus:border-[#D9381E] bg-[#FAF7F2]"
        />
      </div>

      <label
        htmlFor="pin-input"
        className="block text-xs font-bold uppercase tracking-wider text-[#78716C] mb-1.5"
      >
        4 Haneli PIN Kodunu Gir
      </label>
      <div className="flex items-center gap-2 w-full">
        <input
          id="pin-input"
          type="text"
          maxLength={4}
          pattern="[0-9]{4}"
          inputMode="numeric"
          value={inputPin}
          onChange={(e) => onPinChange(e.target.value.replace(/\D/g, ''))}
          placeholder="••••"
          className="flex-1 min-w-0 text-center font-display font-bold text-2xl tracking-widest py-2.5 px-3 rounded-xl border border-[#E7E2D9] focus:outline-none focus:border-[#D9381E] bg-[#FAF7F2]"
        />
        <button
          type="submit"
          disabled={inputPin.length !== 4 || isLoading}
          className="shrink-0 px-5 py-2.5 rounded-xl bg-[#1C1917] hover:bg-black text-white font-semibold text-sm disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer flex items-center justify-center gap-1.5"
        >
          {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
          <span>Katıl</span>
        </button>
      </div>
    </form>
  );
};
