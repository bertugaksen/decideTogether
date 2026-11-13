import { DuelState, Venue } from '../types.js';

export interface DuelInitialization {
  duelState: DuelState;
  startTime: number;
  durationMs: number;
  totalWaitMs: number;
}

export interface TapValidationResult {
  valid: boolean;
  newScore: number;
}

export interface DuelWinnerResult {
  winnerId?: string;
  tieBroken: boolean;
}

export class DuelEngine {
  /**
   * Initializes duel timing, status, and initial score dictionary
   */
  public initializeDuel(
    mode: 'online' | 'split',
    participantIds: string[],
    countdownMs = 3000,
    durationMs = 5000,
    gracePeriodMs = 350
  ): DuelInitialization {
    const startTime = Date.now() + countdownMs;
    const initialScores: Record<string, number> = {};
    for (const id of participantIds) {
      initialScores[id] = 0;
    }

    const duelState: DuelState = {
      status: 'countdown',
      mode,
      startTime,
      durationMs,
      scores: initialScores,
    };

    const totalWaitMs =
      mode === 'split'
        ? countdownMs + durationMs + 15000 // 15s grace for split mode client submission
        : countdownMs + durationMs + gracePeriodMs;
    return { duelState, startTime, durationMs, totalWaitMs };
  }

  /**
   * Validates incoming cumulative taps against timing boundaries and anti-cheat limit (DUEL-02, T-04-02, T-04-03)
   */
  public validateTap(
    duelState: DuelState,
    userId: string,
    cumulativeTaps: number,
    now: number = Date.now()
  ): TapValidationResult {
    // Timing boundary: taps only valid between startTime and (startTime + durationMs + 400ms grace)
    if (now < duelState.startTime || now > duelState.startTime + duelState.durationMs + 400) {
      return { valid: false, newScore: duelState.scores[userId] || 0 };
    }

    const currentScore = duelState.scores[userId] || 0;
    // Anti-cheat clamp: maximum increase of 30 taps per incoming batched packet (T-04-02)
    let validatedTaps = cumulativeTaps;
    if (validatedTaps - currentScore > 30) {
      validatedTaps = currentScore + 30;
    }

    const newScore = Math.max(currentScore, validatedTaps);
    return { valid: true, newScore };
  }

  /**
   * Determines the duel winner from final tap scores, with fair random tie-breaking (DUEL-04)
   */
  public determineWinner(
    scores: Record<string, number>,
    userIds: string[],
    forcedWinnerId?: string
  ): DuelWinnerResult {
    if (forcedWinnerId) {
      return { winnerId: forcedWinnerId, tieBroken: false };
    }

    let winnerId: string | undefined;
    let tieBroken = false;

    if (userIds.length >= 2) {
      const u1 = userIds[0];
      const u2 = userIds[1];
      const s1 = scores[u1] || 0;
      const s2 = scores[u2] || 0;

      if (s1 > s2) {
        winnerId = u1;
      } else if (s2 > s1) {
        winnerId = u2;
      } else {
        // Exact tie: fair random coin toss (DUEL-04)
        winnerId = Math.random() < 0.5 ? u1 : u2;
        tieBroken = true;
      }
    } else if (userIds.length === 1) {
      winnerId = userIds[0];
    }

    return { winnerId, tieBroken };
  }

  /**
   * Resolves the winning venue hierarchically: winner's likes -> peer's likes -> top deck venue (DUEL-04)
   */
  public resolveWinningVenue(
    venues: Venue[],
    votes: Record<string, Record<string, 'like' | 'pass'>> = {},
    winnerId: string,
    participantIds: string[] = []
  ): Venue | undefined {
    if (!venues || venues.length === 0) return undefined;

    // 1. Winner's likes in votes (sorted by rating descending)
    const winnerVotes = votes[winnerId] || {};
    const likedVenueIds = Object.keys(winnerVotes).filter((vid) => winnerVotes[vid] === 'like');

    if (likedVenueIds.length > 0) {
      const likedVenues = venues.filter((v) => likedVenueIds.includes(v.id));
      if (likedVenues.length > 0) {
        likedVenues.sort((a, b) => b.rating - a.rating);
        return likedVenues[0];
      }
    }

    // 2. Winner passed on all: fallback to peer's likes
    const peerId = participantIds.find((id) => id !== winnerId);
    if (peerId) {
      const peerVotes = votes[peerId] || {};
      const peerLikedIds = Object.keys(peerVotes).filter((vid) => peerVotes[vid] === 'like');
      if (peerLikedIds.length > 0) {
        const peerLikedVenues = venues.filter((v) => peerLikedIds.includes(v.id));
        if (peerLikedVenues.length > 0) {
          peerLikedVenues.sort((a, b) => b.rating - a.rating);
          return peerLikedVenues[0];
        }
      }
    }

    // 3. Both passed on all: fallback to top deck venue
    return venues[0];
  }
}

export const duelEngine = new DuelEngine();
