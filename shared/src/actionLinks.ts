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
 * Omits the 'origin' parameter so Google Maps dynamically routes from the user's live device GPS ("Konumunuz").
 */
export function buildGoogleMapsNavigationUrl(
  venue: Pick<Venue, 'id' | 'name' | 'address' | 'location' | 'googleMapsUrl'>,
  _originCoords?: { lat: number; lng: number }
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

  // Omitting 'origin' prompts Google Maps to use live device GPS location
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
  uberEatsUrl: string;
  getirYemekUrl: string;
  trendyolYemekUrl: string;
}

/**
 * Builds food delivery universal links for mobile app opening and web ordering (ACTION-03, MOB-04).
 */
export function buildDeliveryLinks(
  venue: Pick<Venue, 'name' | 'address' | 'deliveryUrl'>,
  locationLabel?: string
): DeliveryPlatformLinks {
  const region = locationLabel ? locationLabel.replace(/\s*\(GPS\)\s*/i, '').trim() : '';
  const venueQuery = encodeURIComponent(venue.name.trim());
  const contextQuery = encodeURIComponent([venue.name, region].filter(Boolean).join(' '));

  // Universal Links: Opens native app directly if installed on phone, else opens website search
  const yemeksepetiUrl = `https://www.yemeksepeti.com/search?query=${venueQuery}`;
  const uberEatsUrl = `https://www.ubereats.com/search?q=${venueQuery}`;
  const getirYemekUrl = `https://getir.com/yemek/arama?q=${venueQuery}`;
  const trendyolYemekUrl = `https://www.trendyol.com/sr?q=${contextQuery}`;

  const hasSafeCustomUrl =
    typeof venue.deliveryUrl === 'string' && /^https:\/\/[^\s]+$/i.test(venue.deliveryUrl);

  const primaryUrl = hasSafeCustomUrl ? venue.deliveryUrl! : yemeksepetiUrl;

  return {
    primaryUrl,
    yemeksepetiUrl,
    uberEatsUrl,
    getirYemekUrl,
    trendyolYemekUrl,
  };
}
