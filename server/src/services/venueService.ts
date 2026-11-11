import { Venue, District, RoomLocation, cleanTurkishVenueName } from '../types.js';
import { VenueCache, getCoordinateCacheKey } from './venueCache.js';
import { MOCK_DISTRICTS, MOCK_VENUES } from './mockVenues.js';
import {
  buildGoogleMapsNavigationUrl,
  buildDeliveryLinks,
  calculateDistanceKm,
} from './actionLinks.js';

const GOOGLE_PLACES_NEARBY_URL = 'https://places.googleapis.com/v1/places:searchNearby';
const FALLBACK_PHOTO_URL = 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=80';

/**
 * Validates coordinate numbers strictly within geographic bounds (T-02-04).
 */
export function isValidCoordinate(lat?: number, lng?: number): boolean {
  return (
    typeof lat === 'number' &&
    typeof lng === 'number' &&
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

/**
 * Translates Google Places API price level string to 1-4 scale.
 */
export function mapPriceLevel(level?: string): 1 | 2 | 3 | 4 {
  switch (level) {
    case 'PRICE_LEVEL_INEXPENSIVE':
      return 1;
    case 'PRICE_LEVEL_MODERATE':
      return 2;
    case 'PRICE_LEVEL_EXPENSIVE':
      return 3;
    case 'PRICE_LEVEL_VERY_EXPENSIVE':
      return 4;
    default:
      return 2;
  }
}

/**
 * Translates English primary place types to friendly Turkish category labels.
 */
export function formatCategoryName(rawType?: string): string {
  if (!rawType) return 'Restoran & Cafe';
  const typeLower = rawType.toLowerCase().trim();

  const typeMap: Record<string, string> = {
    'kebab shop': 'Kebap & Izgara',
    'turkish restaurant': 'Türk Mutfağı & Ev Yemekleri',
    'fast food restaurant': 'Fast Food & Burger',
    'chicken restaurant': 'Tavuk & Sokak Lezzeti',
    'breakfast restaurant': 'Kahvaltı & Brunch',
    'coffee shop': 'Kahve & Kafe',
    'cafe': 'Kafe & Bistro',
    'pastry shop': 'Pastane & Tatlı',
    'bakery': 'Fırın & Hamur İşi',
    'chocolate shop': 'Çikolata & Tatlı',
    'italian restaurant': 'İtalyan & Pizza',
    'pizza restaurant': 'Pizza & Makarna',
    'seafood restaurant': 'Deniz Ürünleri & Balık',
    'steak house': 'Et & Steakhouse',
    'hamburger restaurant': 'Gurme Burger',
    'restaurant': 'Restoran & Lezzet Durağı',
  };

  return typeMap[typeLower] || rawType;
}

/**
 * Classifies a venue into a broad culinary category for deck diversity interleaving.
 */
export function categorizeVenue(venue: Venue): string {
  const cat = (venue.category || '').toLowerCase();
  const name = (venue.name || '').toLowerCase();
  const text = `${cat} ${name}`;

  if (
    text.includes('kebab') ||
    text.includes('kebap') ||
    text.includes('ciğer') ||
    text.includes('döner') ||
    text.includes('ocakbaşı') ||
    text.includes('köfte') ||
    text.includes('steak')
  ) {
    return 'kebap_et';
  }

  if (
    text.includes('burger') ||
    text.includes('fast food') ||
    text.includes('chicken') ||
    text.includes('tavuk') ||
    text.includes('sandviç') ||
    text.includes('büfe') ||
    text.includes('tost')
  ) {
    return 'burger_fast';
  }

  if (
    text.includes('pizza') ||
    text.includes('makarna') ||
    text.includes('pasta') ||
    text.includes('italy') ||
    text.includes('ital') ||
    text.includes('say cheese')
  ) {
    return 'pizza_italyan';
  }

  if (
    text.includes('tatlı') ||
    text.includes('pastane') ||
    text.includes('kahve') ||
    text.includes('coffee') ||
    text.includes('cafe') ||
    text.includes('kafe') ||
    text.includes('chocolate') ||
    text.includes('çikolata') ||
    text.includes('bakery') ||
    text.includes('fırın') ||
    text.includes('breakfast') ||
    text.includes('kahvaltı') ||
    text.includes('brekkie') ||
    text.includes('nata')
  ) {
    return 'cafe_tatli';
  }

  if (
    text.includes('türk') ||
    text.includes('ev yemeği') ||
    text.includes('lokanta') ||
    text.includes('çorba') ||
    text.includes('pide') ||
    text.includes('lahmacun') ||
    text.includes('sofra') ||
    text.includes('sokak') ||
    text.includes('şırdan') ||
    text.includes('kokoreç')
  ) {
    return 'geleneksel_ev';
  }

  return 'dunya_diger';
}

/**
 * Eliminates consecutive venues of the same category so users never see the same
 * cuisine/category twice in a row.
 */
export function balanceDeckDiversity(venues: Venue[], targetCount = 15): Venue[] {
  if (venues.length <= 1) return venues;

  // Filter out non-food venues (e.g. concert hall, department store, hotel)
  const nonFoodKeywords = [
    'concert hall',
    'department store',
    'clothing store',
    'gas station',
    'supermarket',
    'mall',
    'hotel',
    'motel',
    'lodging',
    'association',
    'organization',
    'guest house',
    'resort',
  ];
  const foodVenues = venues.filter((v) => {
    const cat = (v.category || '').toLowerCase();
    return !nonFoodKeywords.some((kw) => cat.includes(kw));
  });

  const pool = foodVenues.length >= 8 ? foodVenues : venues;

  // Group by category label
  const buckets: Record<string, Venue[]> = {};
  for (const v of pool) {
    const key = (v.category || 'Mekan').trim().toLowerCase();
    if (!buckets[key]) buckets[key] = [];
    buckets[key].push(v);
  }

  const bucketKeys = Object.keys(buckets);
  const result: Venue[] = [];
  let remaining = true;
  let lastBucket = '';

  while (result.length < targetCount && remaining) {
    remaining = false;
    for (const key of bucketKeys) {
      if (result.length >= targetCount) break;
      if (buckets[key].length > 0) {
        // Skip same category back-to-back if another category has items
        const otherAvailable = bucketKeys.some((k) => k !== key && buckets[k].length > 0);
        if (key === lastBucket && otherAvailable) {
          continue;
        }
        const venue = buckets[key].shift()!;
        result.push(venue);
        lastBucket = key;
        remaining = true;
      }
    }
  }

  // If target count not yet reached, drain any remaining venues
  if (result.length < targetCount) {
    for (const key of bucketKeys) {
      while (buckets[key].length > 0 && result.length < targetCount) {
        result.push(buckets[key].shift()!);
      }
    }
  }

  return result.slice(0, targetCount);
}

/**
 * Calculates nearest district from coordinates based on Euclidean distance.
 */
export function findNearestDistrict(lat: number, lng: number): District {
  let nearest = MOCK_DISTRICTS[0];
  let minDistance = Infinity;

  for (const district of MOCK_DISTRICTS) {
    const dLat = district.center.lat - lat;
    const dLng = district.center.lng - lng;
    const distSq = dLat * dLat + dLng * dLng;
    if (distSq < minDistance) {
      minDistance = distSq;
      nearest = district;
    }
  }

  return nearest;
}

/**
 * Enriches a venue with Phase 5 post-match action links (navigation URL, delivery URL, and distance).
 */
export function enrichVenueActions(
  venue: Venue,
  referenceCenter?: { lat: number; lng: number }
): Venue {
  const distanceKm =
    referenceCenter && venue.location
      ? calculateDistanceKm(
          referenceCenter.lat,
          referenceCenter.lng,
          venue.location.lat,
          venue.location.lng
        )
      : venue.distanceKm;

  const googleMapsUrl = buildGoogleMapsNavigationUrl(venue, referenceCenter);
  const deliveryUrl = venue.deliveryUrl || buildDeliveryLinks(venue).primaryUrl;

  return {
    ...venue,
    googleMapsUrl,
    deliveryUrl,
    distanceKm,
  };
}


/**
 * Fetches nearby venues from Google Places API (New) with strict field masking.
 */
export async function fetchGooglePlacesNearby(
  lat: number,
  lng: number,
  apiKey: string,
  radiusMeters = 1500
): Promise<Venue[]> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000); // 6s timeout

  try {
    const response = await fetch(GOOGLE_PLACES_NEARBY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        // STRICT FIELD MASK: includes Phase 5 phone and Google Maps URI fields
        'X-Goog-FieldMask': [
          'places.id',
          'places.displayName',
          'places.formattedAddress',
          'places.location',
          'places.rating',
          'places.userRatingCount',
          'places.priceLevel',
          'places.photos',
          'places.primaryTypeDisplayName',
          'places.currentOpeningHours.openNow',
          'places.nationalPhoneNumber',
          'places.internationalPhoneNumber',
          'places.googleMapsUri',
        ].join(','),
      },
      body: JSON.stringify({
        includedTypes: ['restaurant', 'cafe', 'fast_food_restaurant', 'bakery'],
        maxResultCount: 20,
        rankPreference: 'POPULARITY',
        languageCode: 'tr',
        locationRestriction: {
          circle: {
            center: { latitude: lat, longitude: lng },
            radius: radiusMeters,
          },
        },
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn(`[VenueService] Google Places API HTTP error: ${response.status} ${response.statusText}`);
      return [];
    }

    const data = (await response.json()) as any;
    if (!data.places || !Array.isArray(data.places)) {
      return [];
    }

    return data.places.map((p: any): Venue => {
      const firstPhotoName = p.photos?.[0]?.name;
      const photoUrl = firstPhotoName
        ? `/api/venues/photo?name=${encodeURIComponent(firstPhotoName)}`
        : FALLBACK_PHOTO_URL;

      const venueLat = p.location?.latitude || lat;
      const venueLng = p.location?.longitude || lng;

      const baseVenue: Venue = {
        id: `gplace_${p.id}`,
        name: cleanTurkishVenueName(p.displayName?.text) || 'Bilinmeyen Restoran',
        category: formatCategoryName(p.primaryTypeDisplayName?.text),
        rating: typeof p.rating === 'number' ? p.rating : 4.5,
        reviewCount: typeof p.userRatingCount === 'number' ? p.userRatingCount : 100,
        priceLevel: mapPriceLevel(p.priceLevel),
        address: p.formattedAddress || 'İstanbul',
        location: {
          lat: venueLat,
          lng: venueLng,
        },
        photoUrl,
        phone: p.nationalPhoneNumber || p.internationalPhoneNumber || undefined,
        isOpenNow: p.currentOpeningHours?.openNow ?? true,
      };

      return enrichVenueActions(baseVenue, { lat, lng });
    });
  } catch (err) {
    clearTimeout(timeoutId);
    console.error('[VenueService] Failed to query Google Places API, falling back:', err);
    return [];
  }
}

export class VenueService {
  private cache: VenueCache;
  private apiKey?: string;

  constructor(apiKey = process.env.GOOGLE_PLACES_API_KEY, cache = new VenueCache()) {
    this.apiKey = apiKey;
    this.cache = cache;
  }

  public getCache(): VenueCache {
    return this.cache;
  }

  public async getVenuesForDistrict(districtId: string): Promise<Venue[]> {
    const cacheKey = `district:${districtId}`;
    const cached = this.cache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const district = MOCK_DISTRICTS.find((d) => d.id === districtId) || MOCK_DISTRICTS[0];
    let organicVenues: Venue[] = [];

    if (this.apiKey && district) {
      organicVenues = await fetchGooglePlacesNearby(
        district.center.lat,
        district.center.lng,
        this.apiKey
      );
    }

    if (!organicVenues || organicVenues.length === 0) {
      organicVenues = MOCK_VENUES[districtId] || MOCK_VENUES['kadikoy-moda'];
    }

    const diverseOrganic = balanceDeckDiversity(organicVenues, 15);
    const deck = diverseOrganic.map((v) => enrichVenueActions(v, district.center));

    this.cache.set(cacheKey, deck);
    return deck;
  }

  public async resolveLocationAndVenues(
    districtId?: string,
    coords?: { lat: number; lng: number }
  ): Promise<{ location: RoomLocation; venues: Venue[] }> {
    const hasValidCoords = coords && isValidCoordinate(coords.lat, coords.lng);

    if (hasValidCoords && coords) {
      const geoKey = getCoordinateCacheKey(coords.lat, coords.lng);
      const cached = this.cache.get(geoKey);
      const nearest = findNearestDistrict(coords.lat, coords.lng);
      const location: RoomLocation = {
        districtId: nearest.id,
        label: `${nearest.name} (GPS)`,
        coords,
        isGps: true,
      };

      if (cached) {
        return { location, venues: cached };
      }

      let organic: Venue[] = [];
      if (this.apiKey) {
        organic = await fetchGooglePlacesNearby(coords.lat, coords.lng, this.apiKey);
      }

      if (!organic || organic.length === 0) {
        organic = MOCK_VENUES[nearest.id] || MOCK_VENUES['kadikoy-moda'];
      }

      const diverseOrganic = balanceDeckDiversity(organic, 15);
      const deck = diverseOrganic.map((v) => enrichVenueActions(v, coords));

      this.cache.set(geoKey, deck);
      return { location, venues: deck };
    }

    // Default to provided districtId or first district (Moda)
    const validDistrict = MOCK_DISTRICTS.find((d) => d.id === districtId) || MOCK_DISTRICTS[0];
    const location: RoomLocation = {
      districtId: validDistrict.id,
      label: validDistrict.name,
      coords: validDistrict.center,
      isGps: false,
    };

    const venues = await this.getVenuesForDistrict(validDistrict.id);
    return { location, venues };
  }
}
