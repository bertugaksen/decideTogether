import { DatabaseSync, StatementSync } from 'node:sqlite';
import { Room } from '../types.js';
import { IRoomRepository } from './roomRepository.js';

export class SqliteRoomRepository implements IRoomRepository {
  private db: DatabaseSync;
  private getStmt: StatementSync;
  private saveStmt: StatementSync;
  private deleteStmt: StatementSync;
  private listStmt: StatementSync;
  private cleanupStmt: StatementSync;

  constructor(dbPath: string = './decidetogether.db') {
    this.db = new DatabaseSync(dbPath);

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
    this.listStmt = this.db.prepare('SELECT data FROM rooms');
    this.cleanupStmt = this.db.prepare('DELETE FROM rooms WHERE updatedAt < ?');
  }

  public get(code: string): Room | null {
    const row = this.getStmt.get(code) as { data: string } | undefined;
    if (!row || !row.data) {
      return null;
    }
    try {
      return JSON.parse(row.data) as Room;
    } catch {
      return null;
    }
  }

  public save(room: Room): void {
    const serialized = JSON.stringify(room);
    const updatedAt = Date.now();
    this.saveStmt.run(room.code, serialized, updatedAt);
  }

  public delete(code: string): void {
    this.deleteStmt.run(code);
  }

  public listActive(): Room[] {
    const rows = this.listStmt.all() as Array<{ data: string }>;
    const activeRooms: Room[] = [];
    for (const row of rows) {
      if (row && row.data) {
        try {
          activeRooms.push(JSON.parse(row.data) as Room);
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
    return Number(res.changes);
  }

  public close(): void {
    this.db.close();
  }
}
