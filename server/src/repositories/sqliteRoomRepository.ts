import { DatabaseSync, StatementSync } from 'node:sqlite';
import { Room } from '../types.js';
import { IRoomRepository } from './roomRepository.js';

export class SqliteRoomRepository implements IRoomRepository {
  private db: DatabaseSync;
  private cache: Map<string, Room> = new Map();
  private getStmt: StatementSync;
  private saveStmt: StatementSync;
  private deleteStmt: StatementSync;
  private listStmt: StatementSync;
  private cleanupStmt: StatementSync;

  constructor(dbPath: string = './decidetogether.db') {
    this.db = new DatabaseSync(dbPath);

    // Concurrency and write-ahead log tuning
    try {
      this.db.exec('PRAGMA journal_mode = WAL;');
      this.db.exec('PRAGMA busy_timeout = 5000;');
    } catch {
      // WAL / busy_timeout may not apply to all SQLite modes (e.g., in-memory)
    }

    // Initialize rooms schema with updatedAt index for fast TTL cleanup
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS rooms (
        code TEXT PRIMARY KEY,
        data TEXT NOT NULL,
        updatedAt INTEGER NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_rooms_updatedAt ON rooms(updatedAt);
    `);

    // Prepare parameterized statements to prevent SQL injection (T-08-01)
    this.getStmt = this.db.prepare('SELECT data FROM rooms WHERE code = ?');
    this.saveStmt = this.db.prepare(`
      INSERT INTO rooms (code, data, updatedAt)
      VALUES (?, ?, ?)
      ON CONFLICT(code) DO UPDATE SET
        data = excluded.data,
        updatedAt = excluded.updatedAt
    `);
    this.deleteStmt = this.db.prepare('DELETE FROM rooms WHERE code = ?');
    this.listStmt = this.db.prepare('SELECT code, data FROM rooms');
    this.cleanupStmt = this.db.prepare('DELETE FROM rooms WHERE updatedAt < ?');
  }

  public get(code: string): Room | null {
    if (this.cache.has(code)) {
      return this.cache.get(code)!;
    }

    const row = this.getStmt.get(code) as { data: string } | undefined;
    if (!row || !row.data) {
      return null;
    }
    try {
      const room = JSON.parse(row.data) as Room;
      this.cache.set(code, room);
      return room;
    } catch {
      return null;
    }
  }

  public save(room: Room): void {
    this.cache.set(room.code, room);
    // Exclude circular Node Timeout objects if present in duelState
    const serialized = JSON.stringify(room, (key, value) => (key === 'timer' ? undefined : value));
    const updatedAt = Date.now();
    this.saveStmt.run(room.code, serialized, updatedAt);
  }

  public delete(code: string): void {
    this.cache.delete(code);
    this.deleteStmt.run(code);
  }

  public listActive(): Room[] {
    const rows = this.listStmt.all() as Array<{ code: string; data: string }>;
    const activeRooms: Room[] = [];
    for (const row of rows) {
      if (row && row.data) {
        try {
          const cached = this.cache.get(row.code);
          if (cached) {
            activeRooms.push(cached);
          } else {
            const room = JSON.parse(row.data) as Room;
            this.cache.set(room.code, room);
            activeRooms.push(room);
          }
        } catch {
          // Skip corrupted rows safely
        }
      }
    }
    return activeRooms;
  }

  public cleanupExpired(maxAgeMs: number): number {
    const threshold = Date.now() - maxAgeMs;
    const res = this.cleanupStmt.run(threshold) as { changes: number | bigint };
    const count = Number(res.changes);
    if (count > 0) {
      // Evict deleted codes from in-memory cache
      const rows = this.listStmt.all() as Array<{ code: string }>;
      const activeCodes = new Set(rows.map((r) => r.code));
      for (const code of this.cache.keys()) {
        if (!activeCodes.has(code)) {
          this.cache.delete(code);
        }
      }
    }
    return count;
  }

  public close(): void {
    this.cache.clear();
    this.db.close();
  }
}
