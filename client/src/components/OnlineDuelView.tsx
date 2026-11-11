import React, { useState, useEffect, useRef, useCallback } from 'react';
import { soundEffects } from '../utils/soundEffects.js';
import { TugOfWarBar } from './TugOfWarBar.js';
import { Participant } from '../types.js';

export interface OnlineDuelViewProps {
  currentUser: Participant;
  peer: Participant | null;
  opponentScore: number;
  onSendTapBatch: (cumulativeTaps: number) => void;
  onDuelFinish: () => void;
  durationMs?: number; // 5000ms default
}

export const OnlineDuelView: React.FC<OnlineDuelViewProps> = ({
  currentUser,
  peer,
  opponentScore,
  onSendTapBatch,
  onDuelFinish,
  durationMs = 5000,
}) => {
  const [localTaps, setLocalTaps] = useState(0);
  const [timeLeftMs, setTimeLeftMs] = useState(durationMs);
  const localTapsRef = useRef(0);
  const lastSentTapsRef = useRef(0);

  // 1. Optimistic 0ms local tap registration with haptic pulse (Mobile multi-touch)
  const handleTouch = useCallback((e: React.TouchEvent) => {
    const newTaps = e.changedTouches.length;
    localTapsRef.current += newTaps;
    setLocalTaps(localTapsRef.current);

    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(15);
      } catch {}
    }
    soundEffects.playTapSound();
  }, []);

  // Pointer fallback strictly for non-touch devices (mouse/pen) to prevent double-counting on mobile
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (e.pointerType === 'touch') return;
    localTapsRef.current += 1;
    setLocalTaps(localTapsRef.current);
    soundEffects.playTapSound();
  }, []);

  // 2. Batched WebSocket cumulative sync (every 80ms)
  useEffect(() => {
    const batchTimer = setInterval(() => {
      if (localTapsRef.current > lastSentTapsRef.current) {
        lastSentTapsRef.current = localTapsRef.current;
        onSendTapBatch(localTapsRef.current);
      }
    }, 80);

    return () => clearInterval(batchTimer);
  }, [onSendTapBatch]);

  // 3. 60fps Millisecond timer countdown
  useEffect(() => {
    const startTime = Date.now();
    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, durationMs - elapsed);
      setTimeLeftMs(remaining);

      if (remaining <= 0) {
        clearInterval(timer);
        soundEffects.playBuzzer();
        // Flush remaining taps immediately
        if (localTapsRef.current > lastSentTapsRef.current) {
          onSendTapBatch(localTapsRef.current);
        }
        onDuelFinish();
      }
    }, 30);

    return () => clearInterval(timer);
  }, [durationMs, onDuelFinish, onSendTapBatch]);

  const timerPercent = (timeLeftMs / durationMs) * 100;

  return (
    <div className="fixed inset-0 select-none overflow-hidden flex flex-col justify-between bg-[#FBF9F5] touch-none">
      {/* Millisecond Timer Bar */}
      <div className="w-full bg-[#E7E2D9] h-2">
        <div
          className="bg-[#D9381E] h-full transition-all duration-75 ease-linear"
          style={{ width: `${timerPercent}%` }}
        />
      </div>

      {/* Tug of War & Live Scores */}
      <div className="px-4 py-3 bg-white border-b border-[#E7E2D9]">
        <TugOfWarBar
          score1={localTaps}
          score2={opponentScore}
          label1={currentUser.nickname || 'Sen'}
          label2={peer?.nickname || 'Partner'}
        />
      </div>

      {/* Giant Interactive Tap Pad */}
      <div
        onTouchStart={handleTouch}
        onPointerDown={handlePointerDown}
        style={{ touchAction: 'none' }}
        className="flex-1 m-4 rounded-3xl bg-[#D9381E] text-white flex flex-col items-center justify-center active:scale-[0.99] transition-transform cursor-pointer shadow-lg"
      >
        <span className="text-sm uppercase tracking-widest font-bold opacity-80">
          SERİ DOKUN! 🔥
        </span>
        <div className="font-display font-black text-7xl mt-2 tabular-nums">
          {localTaps}
        </div>
      </div>
    </div>
  );
};
