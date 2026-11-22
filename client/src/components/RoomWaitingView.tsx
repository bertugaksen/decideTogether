import React, { useState } from 'react';
import { Share2, Copy, Check, Users, Edit2, Eye, ArrowRight, Utensils } from 'lucide-react';
import { Room, Participant } from '../types.js';

export interface RoomWaitingViewProps {
  room: Room;
  currentUser: Participant | null;
  peer: Participant | null;
  onStartSwiping: () => void;
  onLeaveRoom: () => void;
  onUpdateNickname: (name: string) => void;
  onOpenDistrictSelector: () => void;
  onOpenVenueList: () => void;
  onShareWhatsApp: () => void;
  onCopyPin: () => void;
  copied: boolean;
}

export const RoomWaitingView: React.FC<RoomWaitingViewProps> = ({
  room,
  currentUser,
  peer,
  onStartSwiping,
  onLeaveRoom,
  onUpdateNickname,
  onOpenDistrictSelector,
  onOpenVenueList,
  onShareWhatsApp,
  onCopyPin,
  copied,
}) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState('');

  const handleSaveNickname = (e: React.FormEvent) => {
    e.preventDefault();
    if (editedName.trim()) {
      onUpdateNickname(editedName.trim());
      setIsEditingName(false);
    }
  };

  const isPeerReady = Boolean(peer && peer.connected);

  const pinCard = (
    <div className="bg-white rounded-2xl border border-[#E7E2D9] p-5 text-center shadow-xs">
      <div className="flex items-center justify-between mb-2 text-xs font-semibold uppercase tracking-wider text-[#78716C]">
        <span>Oda Kodu</span>
        <span className="text-[#D9381E] bg-[#FDF2F0] border border-[#FCDAD7] px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider">Özel Masa</span>
      </div>

      {/* 4-Digit Display */}
      <div className="font-display font-black text-4xl tracking-widest text-[#1C1917] py-1.5">
        {room.code}
      </div>

      <p className="text-xs text-[#78716C] mt-1 mb-4">
        {isPeerReady
          ? 'Arkadaşın odaya bağlandı. İhtiyaç halinde oda kodunu tekrar paylaşabilirsin.'
          : 'Arkadaşın bu kodu girerek odaya katılabilir ya da direkt davet linki paylaşabilirsin.'}
      </p>

      <div className="space-y-2">
        <button
          type="button"
          onClick={onShareWhatsApp}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#D9381E] hover:bg-[#BF2F18] text-white font-semibold text-sm transition-colors shadow-xs active:translate-y-px cursor-pointer"
        >
          <Share2 className="w-4 h-4" />
          WhatsApp ile Paylaş
        </button>

        <button
          type="button"
          onClick={onCopyPin}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-white border border-[#E7E2D9] hover:bg-[#FAF7F2] text-[#1C1917] font-semibold text-sm transition-colors active:translate-y-px cursor-pointer"
        >
          {copied ? <Check className="w-4 h-4 text-[#2D6A4F]" /> : <Copy className="w-4 h-4" />}
          {copied ? 'Kopyalandı!' : 'Kodu Kopyala'}
        </button>
      </div>
    </div>
  );

  const participantsCard = (
    <div className="bg-white rounded-xl border border-[#E7E2D9] p-4 shadow-xs">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-[#1C1917]">
          <Users className="w-4 h-4 text-[#78716C]" />
          <span>Odada {Object.keys(room.participants).length} / 2 kişi var</span>
        </div>
        <span
          className={`text-[11px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded border ${
            isPeerReady
              ? 'bg-[#E8F5E9] text-[#2D6A4F] border-[#C8E6C9]'
              : 'bg-[#FAF7F2] text-[#78716C] border-[#E7E2D9]'
          }`}
        >
          {isPeerReady ? 'Hazır' : 'Bekleniyor'}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        {/* Current User */}
        <div className="p-3 rounded-lg bg-[#FAF7F2] border border-[#E7E2D9] flex items-center justify-between">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-[#D9381E] text-white flex items-center justify-center font-bold text-sm shrink-0">
              {currentUser?.nickname.charAt(0)}
            </div>
            {isEditingName ? (
              <form onSubmit={handleSaveNickname} className="flex items-center gap-1">
                <input
                  type="text"
                  maxLength={15}
                  autoFocus
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  className="w-20 px-1 py-0.5 text-xs bg-white border border-[#E7E2D9] rounded"
                />
                <button type="submit" className="text-[10px] text-[#2D6A4F] font-bold">Kaydet</button>
              </form>
            ) : (
              <div className="overflow-hidden">
                <p className="text-xs font-bold text-[#1C1917] truncate">{currentUser?.nickname}</p>
                <p className="text-[10px] text-[#78716C]">{currentUser?.role === 'host' ? 'Sen (Oda Sahibi)' : 'Sen (Katılımcı)'}</p>
              </div>
            )}
          </div>
          {!isEditingName && (
            <button
              type="button"
              onClick={() => {
                setEditedName(currentUser?.nickname || '');
                setIsEditingName(true);
              }}
              className="p-1 hover:text-[#D9381E] text-[#78716C]"
              title="İsmi Değiştir"
            >
              <Edit2 className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Peer User */}
        <div
          className={`p-3 rounded-lg border flex items-center gap-2.5 ${
            peer
              ? peer.connected
                ? 'bg-[#E8F5E9] border-[#C8E6C9]'
                : 'bg-[#FFEBEE] border-[#FFCDD2]'
              : 'bg-white border-dashed border-[#E7E2D9]'
          }`}
        >
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
              peer
                ? peer.connected
                  ? 'bg-[#2D6A4F] text-white'
                  : 'bg-[#E53935] text-white'
                : 'bg-[#F0ECE1] text-[#78716C]'
            }`}
          >
            {peer ? peer.nickname.charAt(0) : '?'}
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-bold text-[#1C1917] truncate">
              {peer ? peer.nickname : 'Partner bekleniyor'}
            </p>
            <p className="text-[10px] text-[#78716C]">
              {peer ? (peer.connected ? 'Bağlandı' : 'Koptu...') : 'Davet et'}
            </p>
          </div>
        </div>
      </div>

      {/* Single Linear CTA inside the Card */}
      {isPeerReady ? (
        <div className="mt-3.5 pt-3.5 border-t border-[#E7E2D9]">
          <button
            type="button"
            onClick={onStartSwiping}
            className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-[#2D6A4F] hover:bg-[#24543E] text-white font-display font-bold text-base transition-all shadow-md active:translate-y-px cursor-pointer"
          >
            <span>Oylamayı Başlat</span>
            <ArrowRight className="w-5 h-5" />
          </button>
          <p className="text-[11px] text-center text-[#78716C] mt-1.5">
            Her iki taraf için de mekan kartları destesi açılacaktır.
          </p>
        </div>
      ) : (
        <div className="mt-3.5 pt-3.5 border-t border-[#E7E2D9] text-center">
          <p className="text-xs text-[#78716C] flex items-center justify-center gap-2">
            <Users className="w-3.5 h-3.5 text-[#A8A29E]" />
            <span>Oylamayı başlatmak için partnerinin odaya katılması bekleniyor.</span>
          </p>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Priority: If partner has joined, prioritize start action at the top */}
      {isPeerReady ? (
        <>
          {participantsCard}
          {pinCard}
        </>
      ) : (
        <>
          {pinCard}
          {participantsCard}
        </>
      )}

      {/* Selection Pool Preview Banner */}
      <div className="bg-[#FAF7F2] rounded-xl border border-[#E7E2D9] p-3.5 transition-all shadow-2xs">
        <div className="flex items-center justify-between">
          <div
            onClick={onOpenVenueList}
            className="flex items-center gap-3 cursor-pointer flex-1"
          >
            <Utensils className="w-5 h-5 text-[#E07A5F] shrink-0" />
            <div>
              <div className="flex items-center gap-1.5">
                <p className="text-[10px] font-bold uppercase tracking-wider text-[#D9381E]">
                  SEÇKİ HAVUZU
                </p>
                <span className="inline-flex items-center gap-1 text-[10px] text-[#2D6A4F] bg-[#E8F5E9] border border-[#C8E6C9] px-2 py-0.5 rounded font-semibold uppercase tracking-wider">
                  <Eye className="w-3 h-3" />
                  Mekanları Gör
                </span>
              </div>
              <p className="text-xs font-bold text-[#1C1917]">
                {room?.location?.label || 'Kadıköy, Moda'} Lezzetleri
              </p>
              <p className="text-[11px] text-[#78716C]">
                {room?.venues ? `${room.venues.length} mekan oylamaya hazır (Tıkla ve İncele)` : 'Mekanlar hazırlanıyor...'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenDistrictSelector}
            className="text-[11px] text-[#78716C] hover:text-[#1C1917] bg-white border border-[#E7E2D9] px-2.5 py-1 rounded font-semibold shrink-0 cursor-pointer transition-colors"
          >
            Bölge Değiştir
          </button>
        </div>
      </div>

      <button
        type="button"
        onClick={onLeaveRoom}
        className="w-full text-center py-2 text-xs text-[#78716C] hover:text-[#D9381E] transition-colors cursor-pointer"
      >
        Odadan Ayrıl
      </button>
    </div>
  );
};
