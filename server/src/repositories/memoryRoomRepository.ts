import { Room } from '../types.js';
import { IRoomRepository } from './roomRepository.js';

interface MemoryRecord {
  room: Room;
  updatedAt: number;
}

export class MemoryRoomRepository implements IRoomRepository {
  private rooms: Map<string, MemoryRecord> = new Map();

  public get(code: string): Room | null {
    const record = this.rooms.get(code);
    return record ? record.room : null;
  }

  public save(room: Room): void {
    this.rooms.set(room.code, {
      room,
      updatedAt: Date.now(),
    });
  }

  public delete(code: string): void {
    this.rooms.delete(code);
  }

  public listActive(): Room[] {
    return Array.from(this.rooms.values()).map((record) => record.room);
  }

  public cleanupExpired(maxAgeMs: number): number {
    const threshold = Date.now() - maxAgeMs;
    let deletedCount = 0;
    for (const [code, record] of this.rooms.entries()) {
      if (record.updatedAt < threshold) {
        this.rooms.delete(code);
        deletedCount++;
      }
    }
    return deletedCount;
  }

  public clear(): void {
    this.rooms.clear();
  }
}
