import test from 'node:test';
import assert from 'node:assert/strict';
import {
  VenueService,
  isValidCoordinate,
  findNearestDistrict,
  mapPriceLevel,
} from '../services/venueService.js';
import { MOCK_DISTRICTS, MOCK_VENUES } from '../services/mockVenues.js';

test('isValidCoordinate - validates lat and lng ranges strictly (T-02-04)', () => {
  // Valid Istanbul coordinates
  assert.strictEqual(isValidCoordinate(40.9856, 29.0270), true);
  assert.strictEqual(isValidCoordinate(0, 0), true);
  assert.strictEqual(isValidCoordinate(-90, -180), true);
  assert.strictEqual(isValidCoordinate(90, 180), true);

  // Invalid ranges
  assert.strictEqual(isValidCoordinate(90.1, 29.0), false);
  assert.strictEqual(isValidCoordinate(-91, 29.0), false);
  assert.strictEqual(isValidCoordinate(40.0, 180.1), false);
  assert.strictEqual(isValidCoordinate(40.0, -180.1), false);

  // Non-finite / invalid types
  assert.strictEqual(isValidCoordinate(NaN, 29.0), false);
  assert.strictEqual(isValidCoordinate(40.0, Infinity), false);
  assert.strictEqual(isValidCoordinate(undefined, 29.0), false);
  assert.strictEqual(isValidCoordinate(40.0, undefined), false);
});

test('findNearestDistrict - accurately resolves nearest district for GPS points', () => {
  // Moda coordinates
  const nearModa = findNearestDistrict(40.9860, 29.0265);
  assert.strictEqual(nearModa.id, 'kadikoy-moda');

  // Beşiktaş coordinates
  const nearBesiktas = findNearestDistrict(41.0425, 29.0080);
  assert.strictEqual(nearBesiktas.id, 'besiktas-carsi');

  // Caddebostan coordinates
  const nearCadde = findNearestDistrict(40.9630, 29.0620);
  assert.strictEqual(nearCadde.id, 'kadikoy-caddebostan');

  // Nişantaşı coordinates
  const nearNisantasi = findNearestDistrict(41.0520, 28.9950);
  assert.strictEqual(nearNisantasi.id, 'sisli-nisantasi');
});

test('mapPriceLevel - translates Google Places price levels', () => {
  assert.strictEqual(mapPriceLevel('PRICE_LEVEL_INEXPENSIVE'), 1);
  assert.strictEqual(mapPriceLevel('PRICE_LEVEL_MODERATE'), 2);
  assert.strictEqual(mapPriceLevel('PRICE_LEVEL_EXPENSIVE'), 3);
  assert.strictEqual(mapPriceLevel('PRICE_LEVEL_VERY_EXPENSIVE'), 4);
  assert.strictEqual(mapPriceLevel(undefined), 2);
  assert.strictEqual(mapPriceLevel('OTHER'), 2);
});

test('VenueService - offline fallback returns 15 venues with slot 2 sponsor when no API key', async () => {
  const service = new VenueService(undefined); // No API key
  const deck = await service.getVenuesForDistrict('kadikoy-moda');

  assert.strictEqual(deck.length, 15);
  // Slot 2 (index 1) must be sponsored
  assert.strictEqual(deck[1].isSponsored, true);
  assert.strictEqual(deck[1].sponsorBadge, 'Öne Çıkan Lezzet');

  // First item must be organic
  assert.strictEqual(deck[0].isSponsored, undefined);
  assert.ok(deck[0].name.length > 0);
  assert.ok(deck[0].rating > 0);
  assert.ok(deck[0].photoUrl.length > 0);
});

test('VenueService - resolveLocationAndVenues handles valid district ID', async () => {
  const service = new VenueService(undefined);
  const result = await service.resolveLocationAndVenues('besiktas-carsi');

  assert.strictEqual(result.location.districtId, 'besiktas-carsi');
  assert.strictEqual(result.location.label, 'Beşiktaş, Çarşı');
  assert.strictEqual(result.location.isGps, false);
  assert.strictEqual(result.venues.length, 15);
  assert.strictEqual(result.venues[1].isSponsored, true);
});

test('VenueService - resolveLocationAndVenues handles GPS coordinates', async () => {
  const service = new VenueService(undefined);
  const result = await service.resolveLocationAndVenues(undefined, {
    lat: 41.0526,
    lng: 28.9945, // Nişantaşı coords
  });

  assert.strictEqual(result.location.districtId, 'sisli-nisantasi');
  assert.strictEqual(result.location.isGps, true);
  assert.strictEqual(result.venues.length, 15);
  assert.strictEqual(result.venues[1].isSponsored, true);
});

test('VenueService - caches results in-memory avoiding recalculation', async () => {
  const service = new VenueService(undefined);
  const deck1 = await service.getVenuesForDistrict('kadikoy-moda');
  const deck2 = await service.getVenuesForDistrict('kadikoy-moda');

  // Exact same array reference returned from in-memory cache
  assert.strictEqual(deck1, deck2);
});
