import React, { useState, useEffect, useRef } from 'react';
import { useRoomSocket } from '../hooks/useRoomSocket.js';
import { Share2, Copy, Check, Users, MapPin, Sparkles, AlertCircle, ArrowRight, Edit2, Eye } from 'lucide-react';
import logoImg from '../assets/logo.jpg';
import { DistrictSelector } from './DistrictSelector.js';
import { VenueListModal } from './VenueListModal.js';
import { SwipeDeck } from './SwipeDeck.js';
import { RoomLocation } from '../types.js';

export const Lobby: React.FC = () => {
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
  } = useRoomSocket();

  const [inputPin, setInputPin] = useState('');
  const [userName, setUserName] = useState('');
  const [copied, setCopied] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState('');
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
      `🍕 Bu akşam ne yiyoruz? DecideTogether odama katıl, birlikte hızlıca karar verelim!\n\n👉 Katılmak için tıkla: ${shareUrl}\n(Veya PIN: ${room.code})`
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

  const handleSaveNickname = (e: React.FormEvent) => {
    e.preventDefault();
    if (editedName.trim()) {
      updateNickname(editedName.trim());
      setIsEditingName(false);
    }
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
            Bu akşam ne yiyoruz?
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
          <div className="space-y-4">
            {/* PIN Card */}
            <div className="bg-white rounded-2xl border border-[#E7E2D9] p-6 text-center shadow-xs">
              <div className="flex items-center justify-between mb-3 text-xs font-semibold uppercase tracking-wider text-[#78716C]">
                <span>Oda Kodu</span>
                <span className="text-[#D9381E] bg-[#FDF2F0] px-2 py-0.5 rounded">Özel Masa</span>
              </div>

              {/* 4-Digit Display */}
              <div className="font-display font-black text-5xl tracking-widest text-[#1C1917] py-2">
                {room.code}
              </div>

              <p className="text-xs text-[#78716C] mt-2 mb-6">
                Arkadaşın bu kodu girerek odaya katılabilir ya da direkt davet linki paylaşabilirsin.
              </p>

              <div className="space-y-2.5">
                <button
                  onClick={handleWhatsAppShare}
                  className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-[#D9381E] hover:bg-[#BF2F18] text-white font-semibold text-sm transition-colors shadow-xs active:translate-y-px cursor-pointer"
                >
                  <Share2 className="w-4 h-4" />
                  WhatsApp ile Paylaş
                </button>

                <button
                  onClick={handleCopyPin}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-white border border-[#E7E2D9] hover:bg-[#FAF7F2] text-[#1C1917] font-semibold text-sm transition-colors active:translate-y-px cursor-pointer"
                >
                  {copied ? <Check className="w-4 h-4 text-[#2D6A4F]" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Kopyalandı!' : 'Kodu Kopyala'}
                </button>
              </div>
            </div>

            {/* Participants Status Card */}
            <div className="bg-white rounded-xl border border-[#E7E2D9] p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-[#1C1917]">
                  <Users className="w-4 h-4 text-[#78716C]" />
                  <span>Odada {Object.keys(room.participants).length} / 2 kişi var</span>
                </div>
                <span
                  className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    peer && peer.connected
                      ? 'bg-[#E8F5E9] text-[#2D6A4F]'
                      : 'bg-[#FFF3E0] text-[#E65100]'
                  }`}
                >
                  {peer && peer.connected ? '● Hazır' : '○ Bekleniyor'}
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

              {/* Single Linear CTA inside the Card (follows DESIGN.md: no duplicate bottom navigation bar) */}
              {peer && peer.connected ? (
                <div className="mt-3.5 pt-3.5 border-t border-[#E7E2D9]">
                  <button
                    type="button"
                    onClick={startSwiping}
                    className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-[#2D6A4F] hover:bg-[#24543E] text-white font-display font-bold text-base transition-all shadow-md active:translate-y-px cursor-pointer"
                  >
                    <span>🎮 Eşleşmeyi / Oylamayı Başlat</span>
                    <ArrowRight className="w-5 h-5" />
                  </button>
                  <p className="text-[11px] text-center text-[#78716C] mt-1.5">
                    Her iki taraf için de mekan kartları destesi açılacaktır.
                  </p>
                </div>
              ) : (
                <div className="mt-3 pt-3 border-t border-[#E7E2D9] text-center">
                  <p className="text-xs text-[#E65100] font-medium flex items-center justify-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#E65100] animate-pulse" />
                    Oylamayı başlatmak için partnerinin odaya katılması bekleniyor...
                  </p>
                </div>
              )}
            </div>

            {/* Selection Pool Preview Banner */}
            <div className="bg-[#FAF7F2] rounded-xl border border-[#E7E2D9] p-3.5 transition-all shadow-2xs">
              <div className="flex items-center justify-between">
                <div
                  onClick={() => setIsVenueListOpen(true)}
                  className="flex items-center gap-3 cursor-pointer flex-1"
                >
                  <span className="text-2xl">🍕</span>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-[#D9381E]">
                        SEÇKİ HAVUZU
                      </p>
                      <span className="inline-flex items-center gap-1 text-[9px] text-[#2D6A4F] bg-[#E8F5E9] border border-[#C8E6C9] px-1.5 py-0.2 rounded-full font-bold">
                        <Eye className="w-2.5 h-2.5" />
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
                  onClick={() => setIsDistrictSelectorOpen(true)}
                  className="text-[10px] text-[#78716C] hover:text-[#1C1917] bg-white border border-[#E7E2D9] px-2 py-1 rounded-lg font-semibold shrink-0 cursor-pointer"
                >
                  Bölge Değiştir
                </button>
              </div>
            </div>

            <button
              onClick={leaveRoom}
              className="w-full text-center py-2 text-xs text-[#78716C] hover:text-[#D9381E] transition-colors cursor-pointer"
            >
              Odadan Ayrıl
            </button>
          </div>
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
