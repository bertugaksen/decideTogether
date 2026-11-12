import { Room } from '../types.js';

export interface IRoomRepository {
  /**
   * Retrieves a room by its unique 4-digit code.
   * Returns the Room object or null if not found.
   */
  get(code: string): Room | null;

  /**
   * Persists or updates room state.
   */
  save(room: Room): void;

  /**
   * Deletes a room by its code.
   */
  delete(code: string): void;

  /**
   * Lists all active rooms currently stored.
   */
  listActive(): Room[];

  /**
   * Cleans up expired rooms whose updatedAt is older than (now - maxAgeMs).
   * Returns the count of deleted rooms.
   */
  cleanupExpired(maxAgeMs: number): number;
}
