import test from 'node:test';
import assert from 'node:assert/strict';
import { VenueCache, getCoordinateCacheKey } from '../services/venueCache.js';
import { Venue } from '../types.js';

test('getCoordinateCacheKey - snaps nearby coordinates within ~500m to the same key', () => {
  // Moda center: 40.98561, 29.02704
  // 20 meters drift: 40.98580, 29.02720
  const key1 = getCoordinateCacheKey(40.98561, 29.02704);
  const key2 = getCoordinateCacheKey(40.98580, 29.02720);

  assert.strictEqual(key1, key2);
  assert.strictEqual(key1, 'geo:40.985,29.025');
});

test('getCoordinateCacheKey - yields distinct keys for locations >1km apart', () => {
  const modaKey = getCoordinateCacheKey(40.9856, 29.0270);
  const besiktasKey = getCoordinateCacheKey(41.0428, 29.0077);
  const caddebostanKey = getCoordinateCacheKey(40.9634, 29.0617);

  assert.notStrictEqual(modaKey, besiktasKey);
  assert.notStrictEqual(modaKey, caddebostanKey);
  assert.notStrictEqual(besiktasKey, caddebostanKey);
});

test('VenueCache - stores and retrieves venue arrays with get, set, has, and clear', () => {
  const cache = new VenueCache();
  const mockVenue: Venue = {
    id: 'test_01',
    name: 'Test Restoran',
    category: 'Cafe',
    rating: 4.5,
    reviewCount: 100,
    priceLevel: 2,
    address: 'Moda Cad. No:1',
    location: { lat: 40.9856, lng: 29.0270 },
    photoUrl: 'https://images.unsplash.com/photo-test',
    isOpenNow: true,
  };

  const districtKey = 'district:kadikoy-moda';
  const geoKey = getCoordinateCacheKey(40.9856, 29.0270);

  // Initially empty
  assert.strictEqual(cache.has(districtKey), false);
  assert.strictEqual(cache.get(districtKey), undefined);

  // Set district venues
  cache.set(districtKey, [mockVenue]);
  assert.strictEqual(cache.has(districtKey), true);
  const retrieved = cache.get(districtKey);
  assert.ok(retrieved);
  assert.strictEqual(retrieved.length, 1);
  assert.strictEqual(retrieved[0].id, 'test_01');

  // Set geo venues
  cache.set(geoKey, [mockVenue]);
  assert.strictEqual(cache.has(geoKey), true);
  assert.strictEqual(cache.get(geoKey)?.[0].name, 'Test Restoran');

  // Clear
  cache.clear();
  assert.strictEqual(cache.has(districtKey), false);
  assert.strictEqual(cache.has(geoKey), false);
  assert.strictEqual(cache.get(districtKey), undefined);
});

test('VenueCache - configuration properties (2-hour TTL and max capacity)', () => {
  const cache = new VenueCache();
  assert.strictEqual(cache.ttl, 7200000, 'TTL must be exactly 2 hours (7,200,000 ms) per T-02-02');
  assert.strictEqual(cache.max, 500, 'Max entries must be 500 to prevent unbounded memory growth');
});
