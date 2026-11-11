import React, { useState, useEffect, useRef } from 'react';
import { useRoomSocket } from '../hooks/useRoomSocket.js';
import { MapPin, Sparkles, AlertCircle } from 'lucide-react';
import logoImg from '../assets/logo.jpg';
import { DistrictSelector } from './DistrictSelector.js';
import { VenueListModal } from './VenueListModal.js';
import { SwipeDeck } from './SwipeDeck.js';
import { RoomWaitingView } from './RoomWaitingView.js';
import { RoomLocation } from '../types.js';

export interface LobbyProps {
  socket?: ReturnType<typeof useRoomSocket>;
}

export const Lobby: React.FC<LobbyProps> = ({ socket: externalSocket }) => {
  const localSocket = useRoomSocket();
  const socket = externalSocket || localSocket;
  const {
    room,
    currentUser,
    peer,
    connectionStatus,
    error,
    peerDisconnectSeconds,
    partnerProgress,
    matchedVenue,
    isDeckExhausted,
    duelState,
    createRoom,
    joinRoom,
    updateNickname,
    leaveRoom,
    setLocation,
    startSwiping,
    sendSwipe,
    startDuel,
    sendDuelTap,
    resolveSplitDuel,
  } = socket;

  const [inputPin, setInputPin] = useState('');
  const [userName, setUserName] = useState('');
  const [copied, setCopied] = useState(false);
  const [isDistrictSelectorOpen, setIsDistrictSelectorOpen] = useState(false);
  const [isVenueListOpen, setIsVenueListOpen] = useState(false);
  const [pendingLocation, setPendingLocation] = useState<RoomLocation>({
    districtId: 'adana-seyhan',
    label: 'Seyhan, Adana',
    coords: { lat: 36.9914, lng: 35.3308 },
    isGps: false,
  });

  const hasAutoJoinedRef = useRef(false);

  // Check URL query param for one-time auto-join (e.g. ?room=1234)
  useEffect(() => {
    if (hasAutoJoinedRef.current || room) return;
    const params = new URLSearchParams(window.location.search);
    const urlRoom = params.get('room');
    if (urlRoom && /^\d{4}$/.test(urlRoom)) {
      hasAutoJoinedRef.current = true;
      setInputPin(urlRoom);
      joinRoom(urlRoom);
    }
  }, [joinRoom, room]);

  const handleCopyPin = () => {
    if (!room) return;
    navigator.clipboard.writeText(room.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsAppShare = () => {
    if (!room) return;
    const shareUrl = `${window.location.origin}/?room=${room.code}`;
    const text = encodeURIComponent(
      `Birlikte ne yiyoruz? DecideTogether odama katıl, 10 saniyede karar verelim.\n\nKatılmak için linke tıkla: ${shareUrl}\n(Oda PIN: ${room.code})`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank', 'noopener,noreferrer');
  };

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (/^\d{4}$/.test(inputPin)) {
      joinRoom(inputPin, userName.trim() || undefined);
    }
  };

  const handleCreateRoom = () => {
    createRoom(userName.trim() || undefined, {
      districtId: pendingLocation.districtId,
      coords: pendingLocation.coords,
    });
  };

  // If room is currently swiping, matched, or duel, render the interactive SwipeDeck
  if (
    room &&
    currentUser &&
    (room.status === 'swiping' || room.status === 'matched' || room.status === 'duel')
  ) {
    return (
      <SwipeDeck
        room={room}
        currentUser={currentUser}
        peer={peer}
        partnerProgress={partnerProgress}
        matchedVenue={matchedVenue}
        isDeckExhausted={isDeckExhausted}
        duelState={duelState}
        onSwipe={sendSwipe}
        onLeave={leaveRoom}
        onStartOnlineDuel={() => startDuel('online')}
        onStartSplitDuel={() => startDuel('split')}
        onSendDuelTap={sendDuelTap}
        onResolveSplitDuel={resolveSplitDuel}
      />
    );
  }

  return (
    <div className="max-w-md mx-auto h-full overflow-y-auto px-4 py-6 flex flex-col justify-between">
      {/* Top Header */}
      <div>
        <header className="flex items-center justify-between pb-4 border-b border-[#E7E2D9]">
          <div className="flex items-center gap-2.5">
            <img
              src={logoImg}
              alt="DecideTogether Logo"
              className="w-9 h-9 rounded-xl object-cover shadow-xs border border-[#E7E2D9]"
            />
            <div>
              <h1 className="font-display font-bold text-xl tracking-tight leading-none">
                DecideTogether
              </h1>
              <span className="text-xs text-[#78716C] font-medium">Lobi</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-[#F5F0EB] text-[#78716C]">
              <span
                className={`w-2 h-2 rounded-full ${
                  connectionStatus === 'connected' ? 'bg-[#2D6A4F]' : 'bg-[#D9381E] animate-pulse'
                }`}
              />
              {connectionStatus === 'connected' ? 'Bağlı' : 'Bağlanıyor...'}
            </span>
          </div>
        </header>

        {/* Hero Section */}
        <div className="mt-6 mb-6">
          <div className="flex items-center gap-2 mb-2">
            <button
              type="button"
              onClick={() => setIsDistrictSelectorOpen(true)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-white border border-[#E7E2D9] hover:border-[#D9381E] text-[#1C1917] transition-all shadow-2xs active:scale-95 cursor-pointer"
            >
              <MapPin className="w-3.5 h-3.5 text-[#D9381E]" />
              <span>{room?.location?.label || pendingLocation.label}</span>
              <span className="text-[10px] text-[#78716C] ml-0.5">▼ Değiştir</span>
            </button>
            {room && (
              <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-[#E8F5E9] text-[#2D6A4F]">
                ● CANLI ODA
              </span>
            )}
          </div>
          <h2 className="font-display text-3xl font-extrabold text-[#1C1917] tracking-tight leading-tight">
            Birlikte ne yiyoruz?
          </h2>
          <p className="text-sm text-[#78716C] mt-1">
            Birlikte karar vermenin en lezzetli ve hızlı yolu.
          </p>
        </div>

        {/* Global Error Notice */}
        {error && (
          <div className="mb-4 p-3 rounded-lg bg-[#FFEBEE] border border-[#FFCDD2] text-[#B71C1C] text-sm flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              type="button"
              onClick={() => {
                leaveRoom();
                window.location.href = '/';
              }}
              className="text-xs font-bold underline hover:text-[#900] cursor-pointer shrink-0"
            >
              Yenile
            </button>
          </div>
        )}

        {/* Disconnect Grace Period Countdown */}
        {peerDisconnectSeconds !== null && (
          <div className="mb-4 p-3.5 rounded-xl bg-[#FFF3E0] border border-[#FFE0B2] text-[#E65100] text-sm flex items-center justify-between animate-pulse">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span className="font-medium">Partnerinin bağlantısı koptu...</span>
            </div>
            <span className="font-display font-bold text-base px-2 py-0.5 rounded bg-white border border-[#FFE0B2]">
              {peerDisconnectSeconds}s
            </span>
          </div>
        )}

        {/* State A: Room Active View */}
        {room ? (
          <RoomWaitingView
            room={room}
            currentUser={currentUser}
            peer={peer}
            onStartSwiping={startSwiping}
            onLeaveRoom={leaveRoom}
            onUpdateNickname={updateNickname}
            onOpenDistrictSelector={() => setIsDistrictSelectorOpen(true)}
            onOpenVenueList={() => setIsVenueListOpen(true)}
            onShareWhatsApp={handleWhatsAppShare}
            onCopyPin={handleCopyPin}
            copied={copied}
          />
        ) : (
          /* State B: Initial Screen (Create or Join) */
          <div className="space-y-6">
            {/* Create Room Box */}
            <div className="bg-white rounded-2xl border border-[#E7E2D9] p-6 shadow-xs">
              <h3 className="font-display font-bold text-lg text-[#1C1917] mb-1">
                Yeni Karar Odası Başlat
              </h3>
              <p className="text-xs text-[#78716C] mb-4">
                Tek tıkla 4 haneli PIN üret, arkadaşına WhatsApp'tan gönder ve 10 saniyede karar verin.
              </p>

              <div className="mb-4">
                <label htmlFor="user-name-create" className="block text-xs font-bold uppercase tracking-wider text-[#78716C] mb-1.5">
                  İsminiz (İsteğe Bağlı)
                </label>
                <input
                  id="user-name-create"
                  type="text"
                  maxLength={15}
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="w-full text-sm py-2 px-3 rounded-xl border border-[#E7E2D9] focus:outline-none focus:border-[#D9381E] bg-[#FAF7F2]"
                />
              </div>

              <button
                onClick={handleCreateRoom}
                className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-[#D9381E] hover:bg-[#BF2F18] text-white font-semibold text-sm transition-colors shadow-xs active:translate-y-px cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                Hemen Oda Oluştur
              </button>
            </div>

            {/* Divider */}
            <div className="relative text-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#E7E2D9]" />
              </div>
              <span className="relative px-3 bg-[#FBF9F5] text-xs font-medium text-[#78716C]">
                veya PIN ile Katıl
              </span>
            </div>

            {/* Join Room Box */}
            <form onSubmit={handleJoinSubmit} className="bg-white rounded-2xl border border-[#E7E2D9] p-6 shadow-xs">
              <div className="mb-3">
                <label htmlFor="user-name-join" className="block text-xs font-bold uppercase tracking-wider text-[#78716C] mb-1.5">
                  İsminiz (İsteğe Bağlı)
                </label>
                <input
                  id="user-name-join"
                  type="text"
                  maxLength={15}
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="w-full text-sm py-2 px-3 rounded-xl border border-[#E7E2D9] focus:outline-none focus:border-[#D9381E] bg-[#FAF7F2]"
                />
              </div>

              <label htmlFor="pin-input" className="block text-xs font-bold uppercase tracking-wider text-[#78716C] mb-1.5">
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
                  onChange={(e) => setInputPin(e.target.value.replace(/\D/g, ''))}
                  className="flex-1 min-w-0 text-center font-display font-bold text-2xl tracking-widest py-2.5 px-3 rounded-xl border border-[#E7E2D9] focus:outline-none focus:border-[#D9381E] bg-[#FAF7F2]"
                />
                <button
                  type="submit"
                  disabled={inputPin.length !== 4}
                  className="shrink-0 px-5 py-2.5 rounded-xl bg-[#1C1917] hover:bg-black text-white font-semibold text-sm disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  Katıl
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* District Selector Modal */}
      <DistrictSelector
        isOpen={isDistrictSelectorOpen}
        onClose={() => setIsDistrictSelectorOpen(false)}
        selectedDistrictId={room?.location?.districtId || pendingLocation.districtId}
        onSelectDistrict={(districtId) => {
          if (room) {
            setLocation(districtId);
          }
        }}
        onSelectGpsCoords={(coords) => {
          if (room) {
            setLocation(undefined, coords);
          }
        }}
        onSelectLocation={(loc) => {
          setPendingLocation(loc);
          if (room) {
            setLocation(loc.districtId, loc.coords);
          }
        }}
      />

      {/* Venue List Preview Modal */}
      <VenueListModal
        isOpen={isVenueListOpen}
        onClose={() => setIsVenueListOpen(false)}
        locationLabel={room?.location?.label || pendingLocation.label}
        venues={room?.venues || []}
      />
    </div>
  );
};
