import React, { useState } from 'react';
import { DuelCountdown } from './DuelCountdown.js';
import { OnlineDuelView } from './OnlineDuelView.js';
import { SplitScreenDuelView } from './SplitScreenDuelView.js';
import { Participant } from '../types.js';

export interface RapidTapperDuelProps {
  mode: 'online' | 'split';
  durationMs?: number;
  currentUser: Participant;
  peer: Participant | null;
  opponentScore?: number;
  onSendTapBatch: (taps: number) => void;
  onSplitComplete: (winnerRole: 'p1' | 'p2', scores: { p1: number; p2: number }) => void;
  onOnlineFinish: () => void;
}

export const RapidTapperDuel: React.FC<RapidTapperDuelProps> = ({
  mode,
  durationMs = 5000,
  currentUser,
  peer,
  opponentScore = 0,
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
          onSendTapBatch={onSendTapBatch}
          onDuelFinish={onOnlineFinish}
        />
      )}

      {phase === 'battling' && mode === 'split' && (
        <SplitScreenDuelView
          durationMs={durationMs}
          onComplete={(winnerRole, scores) => {
            setPhase('finished');
            onSplitComplete(winnerRole, scores);
          }}
        />
      )}
    </>
  );
};
