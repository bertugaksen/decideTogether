import test from 'node:test';
import assert from 'node:assert/strict';
import { injectSponsoredVenues } from '../services/venueService.js';
import { Venue } from '../types.js';

test('injectSponsoredVenues - deterministically inserts primary sponsor at slot 2 (index 1) with badge', () => {
  const organicVenues: Venue[] = Array.from({ length: 15 }, (_, i) => ({
    id: `org_${i + 1}`,
    name: `Organic Restaurant ${i + 1}`,
    category: 'Cafe',
    rating: 4.5,
    reviewCount: 100,
    priceLevel: 2,
    address: `Street ${i + 1}`,
    location: { lat: 40.98, lng: 29.02 },
    photoUrl: 'https://images.unsplash.com/photo-test',
    isOpenNow: true,
  }));

  const sponsoredCandidates: Venue[] = [
    {
      id: 'spon_moda_01',
      name: 'Moda Bostanı Pizzeria',
      category: 'Odun Ateşinde Pizza',
      rating: 4.9,
      reviewCount: 420,
      priceLevel: 2,
      address: 'Caferağa Mah. Moda Cad. No:44, Kadıköy',
      location: { lat: 40.9842, lng: 29.0285 },
      photoUrl: 'https://images.unsplash.com/photo-pizza',
      isSponsored: true,
      sponsorBadge: 'Öne Çıkan Lezzet',
      sponsorPromoText: 'Tatlı ikramı',
      isOpenNow: true,
    },
  ];

  const deck = injectSponsoredVenues(organicVenues, sponsoredCandidates);

  // Assert deck size is capped at 15
  assert.strictEqual(deck.length, 15);

  // Assert slot 1 (index 0) remains organic
  assert.strictEqual(deck[0].id, 'org_1');
  assert.strictEqual(deck[0].isSponsored, undefined);

  // Assert slot 2 (index 1) is the sponsored venue
  assert.strictEqual(deck[1].id, 'spon_moda_01');
  assert.strictEqual(deck[1].isSponsored, true);
  assert.strictEqual(deck[1].sponsorBadge, 'Öne Çıkan Lezzet');

  // Assert slot 3 (index 2) is organic 2
  assert.strictEqual(deck[2].id, 'org_2');
});

test('injectSponsoredVenues - inserts secondary sponsor at slot 3 (index 2) when two sponsors provided', () => {
  const organicVenues: Venue[] = Array.from({ length: 15 }, (_, i) => ({
    id: `org_${i + 1}`,
    name: `Organic Restaurant ${i + 1}`,
    category: 'Cafe',
    rating: 4.5,
    reviewCount: 100,
    priceLevel: 2,
    address: `Street ${i + 1}`,
    location: { lat: 40.98, lng: 29.02 },
    photoUrl: 'https://images.unsplash.com/photo-test',
    isOpenNow: true,
  }));

  const twoSponsors: Venue[] = [
    {
      id: 'spon_1',
      name: 'Sponsor 1',
      category: 'Pizza',
      rating: 4.9,
      reviewCount: 400,
      priceLevel: 2,
      address: 'Moda Cad.',
      location: { lat: 40.98, lng: 29.02 },
      photoUrl: 'https://test.com/1',
      isSponsored: true,
      sponsorBadge: 'Öne Çıkan Lezzet',
    },
    {
      id: 'spon_2',
      name: 'Sponsor 2',
      category: 'Burger',
      rating: 4.8,
      reviewCount: 300,
      priceLevel: 2,
      address: 'Köyiçi Cad.',
      location: { lat: 41.04, lng: 29.00 },
      photoUrl: 'https://test.com/2',
      isSponsored: true,
      sponsorBadge: 'Öne Çıkan Lezzet',
    },
  ];

  const deck = injectSponsoredVenues(organicVenues, twoSponsors);

  assert.strictEqual(deck.length, 15);
  assert.strictEqual(deck[0].id, 'org_1');
  assert.strictEqual(deck[1].id, 'spon_1');
  assert.strictEqual(deck[2].id, 'spon_2');
  assert.strictEqual(deck[3].id, 'org_2');
});

test('injectSponsoredVenues - returns organic list capped at 15 if candidates array is empty', () => {
  const organicVenues: Venue[] = Array.from({ length: 18 }, (_, i) => ({
    id: `org_${i + 1}`,
    name: `Organic Restaurant ${i + 1}`,
    category: 'Cafe',
    rating: 4.5,
    reviewCount: 100,
    priceLevel: 2,
    address: `Street ${i + 1}`,
    location: { lat: 40.98, lng: 29.02 },
    photoUrl: 'https://images.unsplash.com/photo-test',
    isOpenNow: true,
  }));

  const deck = injectSponsoredVenues(organicVenues, []);
  assert.strictEqual(deck.length, 15);
  assert.strictEqual(deck[0].id, 'org_1');
  assert.strictEqual(deck[1].id, 'org_2');
});
