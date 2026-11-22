import React, { useRef, useState, useEffect, useCallback } from 'react';
import { soundEffects } from '../utils/soundEffects.js';
import { TugOfWarBar } from './TugOfWarBar.js';

export interface SplitScreenDuelProps {
  onComplete: (winnerRole: 'p1' | 'p2', scores: { p1: number; p2: number }) => void;
  durationMs?: number;
  player1Name?: string;
  player2Name?: string;
}

export const SplitScreenDuelView: React.FC<SplitScreenDuelProps> = ({
  onComplete,
  durationMs = 5000,
  player1Name,
  player2Name,
}) => {
  const [p1Score, setP1Score] = useState(0);
  const [p2Score, setP2Score] = useState(0);
  const [timeLeftMs, setTimeLeftMs] = useState(durationMs);
  const p1ScoreRef = useRef(0);
  const p2ScoreRef = useRef(0);

  const triggerHaptic = () => {
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(15);
      } catch {}
    }
  };

  // Touch isolation: e.changedTouches on p1 container only (T-04-05)
  const handleP1Touch = useCallback((e: React.TouchEvent) => {
    const count = e.changedTouches.length;
    p1ScoreRef.current += count;
    setP1Score(p1ScoreRef.current);
    triggerHaptic();
    soundEffects.playTapSound();
  }, []);

  // Mouse/pen fallback only (ignore touch to prevent double counting on mobile)
  const handleP1Pointer = useCallback((e: React.PointerEvent) => {
    if (e.pointerType === 'touch') return;
    p1ScoreRef.current += 1;
    setP1Score(p1ScoreRef.current);
    soundEffects.playTapSound();
  }, []);

  // Touch isolation: e.changedTouches on p2 container only (T-04-05)
  const handleP2Touch = useCallback((e: React.TouchEvent) => {
    const count = e.changedTouches.length;
    p2ScoreRef.current += count;
    setP2Score(p2ScoreRef.current);
    triggerHaptic();
    soundEffects.playTapSound();
  }, []);

  // Mouse/pen fallback only (ignore touch to prevent double counting on mobile)
  const handleP2Pointer = useCallback((e: React.PointerEvent) => {
    if (e.pointerType === 'touch') return;
    p2ScoreRef.current += 1;
    setP2Score(p2ScoreRef.current);
    soundEffects.playTapSound();
  }, []);

  // Countdown battle timer
  useEffect(() => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, durationMs - elapsed);
      setTimeLeftMs(remaining);

      if (remaining <= 0) {
        clearInterval(interval);
        soundEffects.playBuzzer();
        const s1 = p1ScoreRef.current;
        const s2 = p2ScoreRef.current;
        // If s1 === s2, server's RESOLVE_SPLIT_DUEL handler detects the tie and runs a fair coin toss
        const winner = s1 > s2 ? 'p1' : s2 > s1 ? 'p2' : Math.random() < 0.5 ? 'p1' : 'p2';
        onComplete(winner, { p1: s1, p2: s2 });
      }
    }, 30);

    return () => clearInterval(interval);
  }, [durationMs, onComplete]);

  return (
    <div
      style={{ touchAction: 'none' }}
      className="fixed inset-0 select-none overflow-hidden flex flex-col touch-none bg-[#FBF9F5]"
    >
      {/* Top Half: Player 1 (Rotated 180° for Seated Opponent) */}
      <div
        onTouchStart={handleP1Touch}
        onPointerDown={handleP1Pointer}
        style={{ touchAction: 'none' }}
        className="flex-1 bg-white text-[#1C1917] flex flex-col items-center justify-center rotate-180 active:bg-[#FAF7F2] transition-colors cursor-pointer select-none"
      >
        <span className="text-xs uppercase tracking-widest font-semibold text-[#78716C] max-w-[200px] truncate text-center">
          {player1Name || 'Oyuncu 1'}
        </span>
        <span className="text-sm uppercase tracking-wider font-semibold text-[#E07A5F] mt-1">
          Dokun
        </span>
        <div className="font-display font-bold text-6xl text-[#1C1917] mt-1 tabular-nums">
          {p1Score}
        </div>
      </div>

      {/* Center Dividing Seam (56px per UI-SPEC) */}
      <div className="h-14 bg-[#FBF9F5] border-y border-[#E7E2D9] flex flex-col justify-center px-4 z-10 shrink-0 space-y-1">
        <div className="w-full bg-[#E7E2D9] h-1 rounded-full overflow-hidden">
          <div
            className="bg-[#E07A5F] h-full transition-all duration-75 ease-linear"
            style={{ width: `${(timeLeftMs / durationMs) * 100}%` }}
          />
        </div>
        <TugOfWarBar
          score1={p1Score}
          score2={p2Score}
          label1={player1Name ? player1Name.slice(0, 8) : 'P1'}
          label2={player2Name ? player2Name.slice(0, 8) : 'P2'}
        />
      </div>

      {/* Bottom Half: Player 2 (Normal 0° Orientation) */}
      <div
        onTouchStart={handleP2Touch}
        onPointerDown={handleP2Pointer}
        style={{ touchAction: 'none' }}
        className="flex-1 bg-white text-[#1C1917] flex flex-col items-center justify-center active:bg-[#FAF7F2] transition-colors cursor-pointer select-none"
      >
        <span className="text-xs uppercase tracking-widest font-semibold text-[#78716C] max-w-[200px] truncate text-center">
          {player2Name || 'Oyuncu 2'}
        </span>
        <span className="text-sm uppercase tracking-wider font-semibold text-[#2D6A4F] mt-1">
          Dokun
        </span>
        <div className="font-display font-bold text-6xl text-[#1C1917] mt-1 tabular-nums">
          {p2Score}
        </div>
      </div>
    </div>
  );
};