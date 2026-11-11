import React, { useState, useCallback, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Heart, X, MapPin, Users } from 'lucide-react';
import { Room, Participant, Venue, DuelState } from '../types.js';
import { VenueCard } from './VenueCard.js';
import { MatchCelebration } from './MatchCelebration.js';
import { DeckExhausted } from './DeckExhausted.js';
import { RapidTapperDuel } from './RapidTapperDuel.js';

export interface SwipeDeckProps {
  room: Room;
  currentUser: Participant;
  peer: Participant | null;
  partnerProgress: { cardIndex: number; totalCards: number } | null;
  matchedVenue: Venue | null;
  isDeckExhausted: boolean;
  duelState?: DuelState | null;
  onSwipe: (venueId: string, vote: 'like' | 'pass', cardIndex: number, totalCards: number) => void;
  onLeave: () => void;
  onStartOnlineDuel?: () => void;
  onStartSplitDuel?: () => void;
  onSendDuelTap?: (taps: number) => void;
  onResolveSplitDuel?: (winnerRole: 'p1' | 'p2', scores: { p1: number; p2: number }) => void;
}

export const SwipeDeck: React.FC<SwipeDeckProps> = ({
  room,
  currentUser,
  peer,
  partnerProgress,
  matchedVenue,
  isDeckExhausted,
  duelState,
  onSwipe,
  onLeave,
  onStartOnlineDuel,
  onStartSplitDuel,
  onSendDuelTap,
  onResolveSplitDuel,
}) => {
  const venues = room.venues || [];
  // Resume from saved server progress on page refresh (ROOM-04)
  const savedCardIndex =
    room.progress?.[currentUser.id] !== undefined
      ? room.progress[currentUser.id].cardIndex + 1
      : 0;
  const [currentIndex, setCurrentIndex] = useState(savedCardIndex);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    if (savedCardIndex > currentIndex) {
      setCurrentIndex(savedCardIndex);
    }
  }, [savedCardIndex, currentIndex]);

  const handleCardSwipe = useCallback(
    (direction: 'like' | 'pass') => {
      // T-03-06: 250ms transition lock prevents double-swiping
      if (isTransitioning || currentIndex >= venues.length) return;
      setIsTransitioning(true);

      const currentVenue = venues[currentIndex];
      onSwipe(currentVenue.id, direction, currentIndex, venues.length);

      setTimeout(() => {
        setCurrentIndex((prev) => prev + 1);
        setIsTransitioning(false);
      }, 250);
    },
    [currentIndex, isTransitioning, onSwipe, venues]
  );

  // 1. If duel active and not finished, render RapidTapperDuel orchestrator
  if (duelState && duelState.status !== 'finished') {
    const opponentId = peer?.id;
    const opponentScore = opponentId && duelState.scores ? duelState.scores[opponentId] || 0 : 0;

    return (
      <RapidTapperDuel
        mode={duelState.mode}
        durationMs={duelState.durationMs}
        startTime={duelState.startTime}
        currentUser={currentUser}
        peer={peer}
        opponentScore={opponentScore}
        onSendTapBatch={(taps) => onSendDuelTap?.(taps)}
        onSplitComplete={(winnerRole, scores) => onResolveSplitDuel?.(winnerRole, scores)}
        onOnlineFinish={() => {}}
      />
    );
  }

  // 2. If match detected, render celebration overlay with duelResult and roomLocation
  if (matchedVenue) {
    const winnerNickname = duelState?.winnerId
      ? room.participants[duelState.winnerId]?.nickname ||
        (duelState.winnerId === currentUser.id ? currentUser.nickname : peer?.nickname)
      : undefined;

    const duelResultProp = duelState
      ? {
          winnerNickname,
          scores: duelState.scores,
          tieBroken: duelState.tieBroken,
        }
      : undefined;

    return (
      <MatchCelebration
        venue={matchedVenue}
        roomLocation={room.location}
        onLeave={onLeave}
        duelResult={duelResultProp}
      />
    );
  }

  // 3. If all cards swiped without match or server reports duel
  if (isDeckExhausted || currentIndex >= venues.length) {
    return (
      <DeckExhausted
        onLeave={onLeave}
        onStartOnlineDuel={onStartOnlineDuel}
        onStartSplitDuel={onStartSplitDuel}
      />
    );
  }

  // Render 2-card sliding window for optimal mobile memory & 60fps
  const visibleCards = venues.slice(currentIndex, currentIndex + 2);
  const currentCard = visibleCards[0];
  const nextCard = visibleCards[1];

  const userProgressPercent =
    venues.length > 0
      ? Math.min(100, Math.round(((currentIndex + 1) / venues.length) * 100))
      : 0;

  return (
    <div className="max-w-md mx-auto h-[100dvh] px-4 py-4 flex flex-col justify-between select-none overflow-hidden">
      {/* Header with live Partner Progress Badge */}
      <header className="pb-2">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#1C1917]">
            <MapPin className="w-3.5 h-3.5 text-[#D9381E] shrink-0" />
            <span className="truncate max-w-[160px]">{room.location?.label || 'Bölge'}</span>
          </div>

          {/* Partner Progress Pill */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-[#FAF7F2] border border-[#E7E2D9]">
            <Users className="w-3.5 h-3.5 text-[#78716C] shrink-0" />
            <span className="text-[#1C1917] font-bold">
              {partnerProgress
                ? `${peer?.nickname || 'Partner'}: ${partnerProgress.cardIndex}/${partnerProgress.totalCards}`
                : `${peer?.nickname || 'Partner'} bekleniyor`}
            </span>
          </div>
        </div>

        {/* User Progress Bar */}
        <div className="w-full bg-[#E7E2D9] h-1.5 rounded-full overflow-hidden">
          <div
            className="bg-[#D9381E] h-full rounded-full transition-all duration-300 ease-out"
            style={{ width: `${userProgressPercent}%` }}
          />
        </div>
      </header>

      {/* Interactive Card Stack Container */}
      <div className="relative flex-1 my-3 flex items-center justify-center">
        <div className="relative w-full max-w-[340px] aspect-[3/4.4]">
          <AnimatePresence mode="popLayout">
            {nextCard && (
              <VenueCard key={nextCard.id} venue={nextCard} isTop={false} onSwipe={() => {}} />
            )}
            {currentCard && (
              <VenueCard
                key={currentCard.id}
                venue={currentCard}
                isTop={true}
                onSwipe={handleCardSwipe}
              />
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Programmatic Tactile Action Buttons */}
      <div className="pt-2 pb-4 flex items-center justify-center gap-8">
        {/* Pass Button (Red Paprika) */}
        <button
          type="button"
          disabled={isTransitioning}
          onClick={() => handleCardSwipe('pass')}
          className="w-16 h-16 rounded-full bg-white border-2 border-[#E7E2D9] hover:border-[#D9381E] text-[#D9381E] flex items-center justify-center shadow-lg active:scale-90 transition-all cursor-pointer disabled:opacity-50"
          aria-label="Pas Geç"
        >
          <X className="w-8 h-8 stroke-[2.5]" />
        </button>

        {/* Like Button (Green Basil) */}
        <button
          type="button"
          disabled={isTransitioning}
          onClick={() => handleCardSwipe('like')}
          className="w-16 h-16 rounded-full bg-[#2D6A4F] text-white flex items-center justify-center shadow-lg hover:bg-[#24543E] active:scale-90 transition-all cursor-pointer disabled:opacity-50"
          aria-label="Beğen"
        >
          <Heart className="w-8 h-8 fill-white stroke-none" />
        </button>
      </div>
    </div>
  );
};
