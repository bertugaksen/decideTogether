import { LRUCache } from 'lru-cache';
import { Venue } from '../types.js';

export const VENUE_CACHE_TTL_MS = 2 * 60 * 60 * 1000; // 7,200,000 ms (2 hours per VENUE-03 and T-02-02)
export const VENUE_CACHE_MAX_ENTRIES = 500;

/**
 * Snaps latitude and longitude coordinates to a ~500m grid (0.005 step)
 * to avoid duplicate API requests from GPS coordinate drift.
 */
export function getCoordinateCacheKey(lat: number, lng: number): string {
  const step = 0.005;
  const snappedLat = (Math.round(lat / step) * step).toFixed(3);
  const snappedLng = (Math.round(lng / step) * step).toFixed(3);
  return `geo:${snappedLat},${snappedLng}`;
}

export class VenueCache {
  private cache: LRUCache<string, Venue[]>;
  public readonly ttl: number;
  public readonly max: number;

  constructor(options?: { ttl?: number; max?: number }) {
    this.ttl = options?.ttl ?? VENUE_CACHE_TTL_MS;
    this.max = options?.max ?? VENUE_CACHE_MAX_ENTRIES;

    this.cache = new LRUCache<string, Venue[]>({
      max: this.max,
      ttl: this.ttl,
    });
  }

  public get(key: string): Venue[] | undefined {
    return this.cache.get(key);
  }

  public set(key: string, venues: Venue[]): void {
    this.cache.set(key, venues);
  }

  public has(key: string): boolean {
    return this.cache.has(key);
  }

  public clear(): void {
    this.cache.clear();
  }

  public get size(): number {
    return this.cache.size;
  }
}
