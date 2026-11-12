import React, { useState, useEffect, useRef } from 'react';
import type { useRoomSocket } from '../hooks/useRoomSocket.js';
import { AlertCircle } from 'lucide-react';
import logoImg from '../assets/logo.jpg';
import { DistrictSelector } from './DistrictSelector.js';
import { VenueListModal } from './VenueListModal.js';
import { SwipeDeck } from './SwipeDeck.js';
import { RoomWaitingView } from './RoomWaitingView.js';
import { LocationPill } from './lobby/LocationPill.js';
import { CreateRoomCard } from './lobby/CreateRoomCard.js';
import { JoinRoomCard } from './lobby/JoinRoomCard.js';
import { RoomLocation } from '../types.js';

export interface LobbyProps {
  socket: ReturnType<typeof useRoomSocket>;
}

export const Lobby: React.FC<LobbyProps> = ({ socket }) => {
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

  // If room is currently swiping, matched, or duel, delegate to SwipeDeck
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

  const activeLocationLabel = room?.location?.label || pendingLocation.label;

  return (
    <div className="max-w-md mx-auto h-full overflow-y-auto px-4 py-6 flex flex-col justify-between">
      <div>
        {/* Header */}
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
          <LocationPill
            label={activeLocationLabel}
            onOpenDistrictSelector={() => setIsDistrictSelectorOpen(true)}
            isLiveRoom={Boolean(room)}
            venueCount={room?.venues?.length}
          />
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
            <CreateRoomCard
              userName={userName}
              onUserNameChange={setUserName}
              onCreateRoom={handleCreateRoom}
            />

            <div className="relative text-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[#E7E2D9]" />
              </div>
              <span className="relative px-3 bg-[#FBF9F5] text-xs font-medium text-[#78716C]">
                veya PIN ile Katıl
              </span>
            </div>

            <JoinRoomCard
              userName={userName}
              onUserNameChange={setUserName}
              inputPin={inputPin}
              onPinChange={setInputPin}
              onJoinSubmit={handleJoinSubmit}
            />
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
        locationLabel={activeLocationLabel}
        venues={room?.venues || []}
      />
    </div>
  );
};
