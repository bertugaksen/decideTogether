import { Venue, District, RoomLocation, cleanTurkishVenueName, getSmartFoodPhoto, classifyCuisineText } from '../types.js';
import { VenueCache, getCoordinateCacheKey } from './venueCache.js';
import { MOCK_DISTRICTS, MOCK_VENUES } from './mockVenues.js';
import {
  buildGoogleMapsNavigationUrl,
  buildDeliveryLinks,
  calculateDistanceKm,
} from './actionLinks.js';

const GOOGLE_PLACES_NEARBY_URL = 'https://places.googleapis.com/v1/places:searchNearby';

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
  return classifyCuisineText(venue.category, venue.name);
}

export function classifyCuisine(venue: Venue): string {
  return classifyCuisineText(venue.category, venue.name);
}

/**
 * Eliminates consecutive venues of the same category so users never see the same
 * cuisine/category twice in a row.
 */
export function balanceDeckDiversity(venues: Venue[], targetCount = 15): Venue[] {
  if (venues.length <= 1) return venues;

  // Filter out non-food venues (e.g. concert hall, department store, hotel, AVM)
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
    'alışveriş merkezi',
    'alisveris merkezi',
    'avm',
    'mağaza',
    'magaza',
    'süpermarket',
    'supermarket',
    'bakkal',
    'giyim',
    'çetinkaya',
    'cetinkaya',
  ];
  const foodVenues = venues.filter((v) => {
    const cat = (v.category || '').toLowerCase();
    const name = (v.name || '').toLowerCase();
    return !nonFoodKeywords.some((kw) => cat.includes(kw) || name.includes(kw));
  });

  const pool = foodVenues.length > 0 ? foodVenues : venues;

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

    const NON_FOOD_PRIMARY_TYPES = new Set([
      'department_store',
      'shopping_mall',
      'supermarket',
      'grocery_store',
      'clothing_store',
      'home_goods_store',
      'convenience_store',
      'gas_station',
      'electronics_store',
      'store',
    ]);

    const NON_FOOD_TEXT = [
      'alışveriş merkezi',
      'alisveris merkezi',
      'avm',
      'mağaza',
      'magaza',
      'süpermarket',
      'supermarket',
      'bakkal',
      'giyim',
      'çetinkaya',
      'cetinkaya',
    ];

    const foodPlaces = data.places.filter((p: any) => {
      if (p.primaryType && NON_FOOD_PRIMARY_TYPES.has(p.primaryType)) return false;
      const typeText = (p.primaryTypeDisplayName?.text || '').toLowerCase();
      const nameText = (p.displayName?.text || '').toLowerCase();
      if (NON_FOOD_TEXT.some((kw) => typeText.includes(kw) || nameText.includes(kw))) {
        return false;
      }
      return true;
    });

    return foodPlaces.map((p: any): Venue => {
      const firstPhotoName = p.photos?.[0]?.name;
      const category = formatCategoryName(p.primaryTypeDisplayName?.text);
      const name = cleanTurkishVenueName(p.displayName?.text) || 'Bilinmeyen Restoran';
      const venueId = `gplace_${p.id}`;

      // Smart category photo when Google has no photo, or proxy URL with fallback hints
      const photoUrl = firstPhotoName
        ? `/api/venues/photo?name=${encodeURIComponent(firstPhotoName)}&cat=${encodeURIComponent(category)}&title=${encodeURIComponent(name)}`
        : getSmartFoodPhoto(category, name, venueId);

      const venueLat = p.location?.latitude || lat;
      const venueLng = p.location?.longitude || lng;

      const baseVenue: Venue = {
        id: venueId,
        name,
        category,
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

/**
 * Reverse geocodes coordinates to a clean district & city label in Turkish.
 * Uses BigDataCloud free client API, optionally Google Geocoding if API key is provided,
 * and falls back to nearest preset district.
 */
export async function reverseGeocodeLocation(
  lat: number,
  lng: number,
  apiKey?: string
): Promise<{ label: string; districtId: string }> {
  const nearest = findNearestDistrict(lat, lng);

  // 1. If Google Places/Geocoding API key is present, try Google Geocoding first
  if (apiKey) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);
      const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}&language=tr`;
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = (await res.json()) as any;
        if (data.results && data.results.length > 0) {
          const comp = data.results[0].address_components || [];
          const getComponent = (type: string) =>
            comp.find((c: any) => c.types.includes(type))?.long_name;

          const district =
            getComponent('administrative_area_level_2') ||
            getComponent('sublocality_level_1') ||
            getComponent('sublocality');
          const city =
            getComponent('administrative_area_level_1') ||
            getComponent('locality');

          if (district && city) {
            const formatted =
              district.toLowerCase() === city.toLowerCase()
                ? `${city} (GPS)`
                : `${district}, ${city} (GPS)`;
            return {
              label: formatted,
              districtId: nearest.id,
            };
          }
        }
      }
    } catch {
      // Ignore and fallback to BigDataCloud
    }
  }

  // 2. Free, high-accuracy reverse geocode client (BigDataCloud)
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);
    const url = `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=tr`;
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = (await res.json()) as any;
      const district =
        data.locality ||
        data.city ||
        data.localityInfo?.administrative?.find((a: any) => a.adminLevel === 6)?.name;
      const city =
        data.principalSubdivision ||
        data.localityInfo?.administrative?.find((a: any) => a.adminLevel === 4)?.name;

      if (district && city) {
        const formatted =
          district.toLowerCase() === city.toLowerCase()
            ? `${city} (GPS)`
            : `${district}, ${city} (GPS)`;
        return {
          label: formatted,
          districtId: nearest.id,
        };
      }
    }
  } catch {
    // Ignore and fallback to nearest preset
  }

  // 3. Fallback to nearest preset district
  return {
    label: `${nearest.name} (GPS)`,
    districtId: nearest.id,
  };
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
      const geo = await reverseGeocodeLocation(coords.lat, coords.lng, this.apiKey);
      const location: RoomLocation = {
        districtId: geo.districtId,
        label: geo.label,
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
        const nearest = findNearestDistrict(coords.lat, coords.lng);
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
