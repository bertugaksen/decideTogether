import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildGoogleMapsNavigationUrl,
  sanitizePhoneUri,
  buildDeliveryLinks,
  calculateDistanceKm,
} from '../services/actionLinks.js';
import { VenueService } from '../services/venueService.js';
import { MOCK_DISTRICTS, MOCK_VENUES } from '../services/mockVenues.js';
import { RoomManager } from '../roomManager.js';
import { WebSocket } from 'ws';

function createMockSocket() {
  const sentMessages: any[] = [];
  return {
    ws: {
      readyState: WebSocket.OPEN,
      send: (data: string) => sentMessages.push(JSON.parse(data)),
    } as unknown as WebSocket,
    sentMessages,
  };
}

test('buildGoogleMapsNavigationUrl - generates turn-by-turn directions URL with destination, walking mode, and dynamic device GPS origin (ACTION-02, MOB-03)', () => {
  const url = buildGoogleMapsNavigationUrl({
    id: 'gplace_ChIJ123456789',
    name: 'Aida - Vino e Cucina',
    address: 'Moda Cad. No:10, Kadıköy',
    location: { lat: 40.9862, lng: 29.0264 },
  });

  assert.ok(url.startsWith('https://www.google.com/maps/dir/?'));
  assert.ok(url.includes('api=1'));
  assert.ok(url.includes('travelmode=walking'));
  assert.ok(url.includes('destination_place_id=ChIJ123456789'));
  assert.strictEqual(url.includes('origin='), false);
});

test('sanitizePhoneUri - formats valid phone numbers into tel: URIs and rejects unsafe or invalid input (ACTION-03, T-05-01)', () => {
  assert.strictEqual(sanitizePhoneUri('+90 216 348 44 10'), 'tel:+902163484410');
  assert.strictEqual(sanitizePhoneUri('0322 352 45 45'), 'tel:03223524545');
  assert.strictEqual(sanitizePhoneUri('javascript:alert(1)'), null);
  assert.strictEqual(sanitizePhoneUri('123'), null);
  assert.strictEqual(sanitizePhoneUri(undefined), null);
  assert.strictEqual(sanitizePhoneUri(''), null);
});

test('buildDeliveryLinks - produces universal app links for Yemeksepeti and Uber Eats (ACTION-03, MOB-04)', () => {
  const links = buildDeliveryLinks(
    {
      name: 'Basta! Street Food Bar',
      address: 'Caferağa Mah. Sakız Sok. No:1, Kadıköy',
    },
    'Kadıköy, Moda (GPS)'
  );

  assert.ok(links.yemeksepetiUrl.includes('yemeksepeti.com'));
  assert.ok(links.uberEatsUrl.includes('ubereats.com'));
  assert.ok(links.getirYemekUrl.includes('getir.com'));
  assert.ok(links.trendyolYemekUrl.includes('trendyol.com'));
  assert.ok(links.primaryUrl.startsWith('https://'));
});

test('calculateDistanceKm - computes realistic Haversine distance in km (ACTION-01)', () => {
  const dist = calculateDistanceKm(40.9856, 29.027, 40.9862, 29.0264);
  assert.ok(dist >= 0 && dist <= 0.5);
});

test('MOCK_VENUES & VenueService - all 7 preset districts have 15 enriched venues with phone, navigation, and delivery links', async () => {
  const service = new VenueService(undefined);

  for (const district of MOCK_DISTRICTS) {
    assert.ok(
      MOCK_VENUES[district.id] && MOCK_VENUES[district.id].length >= 15,
      `District ${district.id} must have 15 mock venues`
    );

    const deck = await service.getVenuesForDistrict(district.id);
    assert.strictEqual(deck.length, 15);

    for (const venue of deck) {
      assert.ok(venue.googleMapsUrl?.startsWith('https://www.google.com/maps/dir/?'));
      assert.ok(venue.deliveryUrl?.startsWith('https://'));
      assert.ok(venue.phone && venue.phone.length >= 10);
      assert.strictEqual(typeof venue.distanceKm, 'number');
    }
  }
});


test('RoomManager.leaveRoom - cleanly removes leaving participant, resets room to waiting, and allows a new peer to join', async () => {
  const manager = new RoomManager();
  const hostMock = createMockSocket();
  const peer1Mock = createMockSocket();
  const peer2Mock = createMockSocket();

  const { room } = await manager.createRoom(hostMock.ws, 'Host');
  const join1 = manager.joinRoom(peer1Mock.ws, room.code, undefined, 'Peer 1');
  assert.strictEqual(join1.success, true);
  assert.strictEqual(room.status, 'ready');

  // Peer 1 explicitly leaves room
  const left = manager.leaveRoom(peer1Mock.ws);
  assert.strictEqual(left, true);
  assert.strictEqual(room.status, 'waiting');
  assert.strictEqual(room.peerId, undefined);
  assert.strictEqual(Object.keys(room.participants).length, 1);

  // Peer 2 can now join the room without getting "Oda dolu"
  const join2 = manager.joinRoom(peer2Mock.ws, room.code, undefined, 'Peer 2');
  assert.strictEqual(join2.success, true);
  assert.strictEqual(room.status, 'ready');
  assert.strictEqual(Object.keys(room.participants).length, 2);
});
