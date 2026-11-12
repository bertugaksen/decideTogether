import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  const [triggerSwipe, setTriggerSwipe] = useState<'like' | 'pass' | null>(null);
  const [showCelebrationModal, setShowCelebrationModal] = useState(false);

  useEffect(() => {
    if (savedCardIndex > currentIndex) {
      setCurrentIndex(savedCardIndex);
    }
  }, [savedCardIndex, currentIndex]);

  useEffect(() => {
    if (matchedVenue) {
      const timer = setTimeout(() => {
        setShowCelebrationModal(true);
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setShowCelebrationModal(false);
    }
  }, [matchedVenue]);

  const handleButtonClick = useCallback(
    (direction: 'like' | 'pass') => {
      if (isTransitioning || currentIndex >= venues.length) return;
      setIsTransitioning(true);
      setTriggerSwipe(direction);
    },
    [currentIndex, isTransitioning, venues.length]
  );

  const handleSwipeComplete = useCallback(
    (direction: 'like' | 'pass') => {
      if (currentIndex >= venues.length) return;
      const currentVenue = venues[currentIndex];
      onSwipe(currentVenue.id, direction, currentIndex, venues.length);
      setCurrentIndex((prev) => prev + 1);
      setTriggerSwipe(null);
      setIsTransitioning(false);
    },
    [currentIndex, onSwipe, venues]
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

  // 2. If match detected, handle match climax scale-up before showing celebration overlay
  if (matchedVenue) {
    if (!showCelebrationModal) {
      return (
        <div className="max-w-md mx-auto h-[100dvh] px-4 py-4 flex flex-col items-center justify-center select-none overflow-hidden">
          <motion.div
            initial={{ scale: 1, rotate: 0 }}
            animate={{ scale: 1.05 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="relative w-full max-w-[340px] aspect-[3/4.4]"
          >
            <VenueCard venue={matchedVenue} isTop={true} onSwipe={() => {}} />
          </motion.div>
        </div>
      );
    }

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
            <MapPin className="w-3.5 h-3.5 text-[#E07A5F] shrink-0" />
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
            className="bg-[#2D6A4F] h-full rounded-full transition-all duration-300 ease-out"
            style={{ width: `${userProgressPercent}%` }}
          />
        </div>
      </header>

      {/* Interactive Card Stack Container */}
      <div className="relative flex-1 my-3 flex items-center justify-center">
        <div className="relative w-[calc(100vw-36px)] max-w-[340px] aspect-[3/4.4]">
          <AnimatePresence mode="popLayout">
            {nextCard && (
              <VenueCard key={nextCard.id} venue={nextCard} isTop={false} onSwipe={() => {}} />
            )}
            {currentCard && (
              <VenueCard
                key={currentCard.id}
                venue={currentCard}
                isTop={true}
                triggerSwipe={triggerSwipe}
                onSwipe={handleSwipeComplete}
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
          onClick={() => handleButtonClick('pass')}
          className="w-16 h-16 rounded-full bg-white border border-[#E7E2D9] hover:border-[#D9381E] text-[#D9381E] flex items-center justify-center active:scale-[0.98] transition-transform duration-100 cursor-pointer disabled:opacity-50"
          aria-label="Pas Geç"
        >
          <X className="w-8 h-8 stroke-[2.5]" />
        </button>

        {/* Like Button (Green Basil) */}
        <button
          type="button"
          disabled={isTransitioning}
          onClick={() => handleButtonClick('like')}
          className="w-16 h-16 rounded-full bg-[#2D6A4F] border border-[#2D6A4F] text-white flex items-center justify-center hover:bg-[#24543F] active:scale-[0.98] transition-transform duration-100 cursor-pointer disabled:opacity-50"
          aria-label="Beğen"
        >
          <Heart className="w-8 h-8 fill-white stroke-none" />
        </button>
      </div>
    </div>
  );
};