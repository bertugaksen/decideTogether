import { Venue } from './types.js';

/**
 * Calculates Haversine distance in kilometers between two geographic coordinates,
 * rounded to 1 decimal place (ACTION-01).
 */
export function calculateDistanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

/**
 * Formats priceLevel (1..4) with both ₺ symbols and a Turkish editorial tier label (ACTION-01).
 */
export function formatPriceTier(priceLevel?: 1 | 2 | 3 | 4): {
  symbols: string;
  label: string;
} {
  const level = priceLevel && priceLevel >= 1 && priceLevel <= 4 ? priceLevel : 2;
  const symbols = '₺'.repeat(level);
  const labels: Record<1 | 2 | 3 | 4, string> = {
    1: 'Ekonomik',
    2: 'Orta',
    3: 'Keyifli',
    4: 'Özel / Fine',
  };
  return { symbols, label: labels[level] };
}

/**
 * Builds a universal cross-platform Google Maps turn-by-turn navigation URL (ACTION-02).
 */
export function buildGoogleMapsNavigationUrl(
  venue: Pick<Venue, 'id' | 'name' | 'address' | 'location' | 'googleMapsUrl'>,
  originCoords?: { lat: number; lng: number }
): string {
  if (venue.googleMapsUrl && venue.googleMapsUrl.startsWith('https://www.google.com/maps/dir/')) {
    return venue.googleMapsUrl;
  }

  const params = new URLSearchParams({
    api: '1',
    destination: `${venue.name}, ${venue.address}`,
    travelmode: 'walking',
  });

  if (venue.id && venue.id.startsWith('gplace_')) {
    const placeId = venue.id.replace(/^gplace_/, '').trim();
    if (placeId) {
      params.set('destination_place_id', placeId);
    }
  }

  if (
    originCoords &&
    typeof originCoords.lat === 'number' &&
    typeof originCoords.lng === 'number' &&
    Number.isFinite(originCoords.lat) &&
    Number.isFinite(originCoords.lng)
  ) {
    params.set('origin', `${originCoords.lat},${originCoords.lng}`);
  }

  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

/**
 * Sanitizes a phone string into a safe tel: URI (ACTION-03, T-05-01).
 */
export function sanitizePhoneUri(phone?: string): string | null {
  if (!phone || typeof phone !== 'string') return null;
  const cleaned = phone.replace(/[^0-9+]/g, '');
  const digitCount = cleaned.replace(/\D/g, '').length;
  if (digitCount < 7 || digitCount > 15) return null;
  return `tel:${cleaned}`;
}

export interface DeliveryPlatformLinks {
  primaryUrl: string;
  yemeksepetiUrl: string;
  getirYemekUrl: string;
  trendyolYemekUrl: string;
}

/**
 * Builds food delivery search URLs for Turkish delivery platforms and general order lookup (ACTION-03).
 */
export function buildDeliveryLinks(
  venue: Pick<Venue, 'name' | 'address' | 'deliveryUrl'>,
  locationLabel?: string
): DeliveryPlatformLinks {
  const region = locationLabel ? locationLabel.replace(/\s*\(GPS\)\s*/i, '').trim() : '';
  const baseQuery = [venue.name, region || venue.address].filter(Boolean).join(' ');

  const yemeksepetiUrl = `https://www.google.com/search?q=${encodeURIComponent(
    `${baseQuery} Yemeksepeti online sipariş`
  )}`;
  const getirYemekUrl = `https://www.google.com/search?q=${encodeURIComponent(
    `${baseQuery} GetirYemek sipariş`
  )}`;
  const trendyolYemekUrl = `https://www.google.com/search?q=${encodeURIComponent(
    `${baseQuery} Trendyol Yemek sipariş`
  )}`;

  const hasSafeCustomUrl =
    typeof venue.deliveryUrl === 'string' && /^https:\/\/[^\s]+$/i.test(venue.deliveryUrl);

  const primaryUrl = hasSafeCustomUrl
    ? venue.deliveryUrl!
    : `https://www.google.com/search?q=${encodeURIComponent(
        `${baseQuery} yemek siparişi`
      )}`;

  return {
    primaryUrl,
    yemeksepetiUrl,
    getirYemekUrl,
    trendyolYemekUrl,
  };
}
