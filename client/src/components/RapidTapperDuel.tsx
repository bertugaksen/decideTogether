import React, { useState } from 'react';
import { DuelCountdown } from './DuelCountdown.js';
import { OnlineDuelView } from './OnlineDuelView.js';
import { SplitScreenDuelView } from './SplitScreenDuelView.js';
import { Participant } from '../types.js';

export interface RapidTapperDuelProps {
  mode: 'online' | 'split';
  durationMs?: number;
  startTime?: number;
  currentUser: Participant;
  peer: Participant | null;
  opponentScore?: number;
  player1Name?: string;
  player2Name?: string;
  onSendTapBatch: (taps: number) => void;
  onSplitComplete: (winnerRole: 'p1' | 'p2', scores: { p1: number; p2: number }) => void;
  onOnlineFinish: () => void;
}

export const RapidTapperDuel: React.FC<RapidTapperDuelProps> = ({
  mode,
  durationMs = 5000,
  startTime,
  currentUser,
  peer,
  opponentScore = 0,
  player1Name,
  player2Name,
  onSendTapBatch,
  onSplitComplete,
  onOnlineFinish,
}) => {
  const [phase, setPhase] = useState<'countdown' | 'battling' | 'finished'>('countdown');

  return (
    <>
      {phase === 'countdown' && (
        <DuelCountdown onComplete={() => setPhase('battling')} />
      )}

      {phase === 'battling' && mode === 'online' && (
        <OnlineDuelView
          currentUser={currentUser}
          peer={peer}
          opponentScore={opponentScore}
          durationMs={durationMs}
          startTime={startTime}
          onSendTapBatch={onSendTapBatch}
          onDuelFinish={onOnlineFinish}
        />
      )}

      {phase === 'battling' && mode === 'split' && (
        <SplitScreenDuelView
          durationMs={durationMs}
          player1Name={player1Name || (currentUser.role === 'host' ? currentUser.nickname : peer?.nickname) || 'Oyuncu 1'}
          player2Name={player2Name || (currentUser.role === 'host' ? peer?.nickname : currentUser.nickname) || 'Oyuncu 2'}
          onComplete={(winnerRole, scores) => {
            setPhase('finished');
            onSplitComplete(winnerRole, scores);
          }}
        />
      )}
    </>
  );
};
