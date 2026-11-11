import test from 'node:test';
import assert from 'node:assert/strict';
import { VenueService } from '../services/venueService.js';
import { Venue } from '../types.js';

test('MOB-02: MVP venue decks are 100% organic with zero sponsor insertion', async () => {
  const service = new VenueService(undefined);
  const result = await service.resolveLocationAndVenues('adana-seyhan');

  assert.strictEqual(result.venues.length, 15);

  // Assert NO venue has isSponsored or sponsorBadge
  for (const venue of result.venues) {
    assert.strictEqual(venue.isSponsored, undefined);
    assert.strictEqual(venue.sponsorBadge, undefined);
    // Assert no fake sponsor IDs
    assert.ok(!venue.id.startsWith('spon_'), `Venue ${venue.id} must not be a sponsor`);
  }
});

test('MOB-02: Adana location resolves only Adana venues without out-of-city injections', async () => {
  const service = new VenueService(undefined);
  const result = await service.resolveLocationAndVenues('adana-seyhan');

  // Moda Bostanı Pizzeria (Kadıköy) must NEVER be in an Adana deck
  const modaPizzeria = result.venues.find((v) => v.name.includes('Moda Bostanı'));
  assert.strictEqual(modaPizzeria, undefined, 'Moda Bostanı must not be present in Adana');
});
