// Nominatim (OpenStreetMap) Search Service - FREE, no API key needed
// With retry logic and fallback to Photon API
import type { EnrichedPlaceData, PlaceSearchResult } from '../types';
import { retryWithBackoff } from '../utils/retry-utils';

const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org';
const PHOTON_BASE = 'https://photon.komoot.io'; // Alternative OSM geocoder (faster, no rate limit)

const RATE_LIMIT_MS = 1100; // 1 request per second for Nominatim
const PHOTON_RATE_LIMIT_MS = 100; // Photon is more lenient

let lastNominatimRequest = 0;
let lastPhotonRequest = 0;

// Retry configuration for geocoding
const RETRY_CONFIG = {
  maxRetries: 3,
  initialDelayMs: 500,
  maxDelayMs: 10000,
  backoffFactor: 2,
  jitterMs: 200,
};

async function enforceNominatimRateLimit(): Promise<void> {
  const now = Date.now();
  const elapsed = now - lastNominatimRequest;
  if (elapsed < RATE_LIMIT_MS) {
    await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_MS - elapsed));
  }
  lastNominatimRequest = Date.now();
}

async function enforcePhotonRateLimit(): Promise<void> {
  const now = Date.now();
  const elapsed = now - lastPhotonRequest;
  if (elapsed < PHOTON_RATE_LIMIT_MS) {
    await new Promise(resolve => setTimeout(resolve, PHOTON_RATE_LIMIT_MS - elapsed));
  }
  lastPhotonRequest = Date.now();
}

/**
 * Search using Nominatim API with retry logic
 */
export async function searchNominatim(
  query: string,
  options?: {
    near?: { lat: number; lng: number };
    limit?: number;
  }
): Promise<EnrichedPlaceData[]> {
  await enforceNominatimRateLimit();

  const params = new URLSearchParams({
    q: query,
    format: 'json',
    limit: String(options?.limit || 3),
    addressdetails: '1',
  });

  // Add viewbox if near coordinates provided
  if (options?.near) {
    const { lat, lng } = options.near;
    const delta = 0.5; // ~50km radius
    params.set('viewbox', `${lng - delta},${lat + delta},${lng + delta},${lat - delta}`);
    params.set('bounded', '0');
  }

  try {
    const result = await retryWithBackoff(
      async () => {
        const response = await fetch(`${NOMINATIM_BASE}/search?${params}`, {
          headers: {
            'User-Agent': 'WanderForge/1.0 (travel-planning-app)',
            'Accept': 'application/json',
          },
        });

        if (!response.ok) {
          const error = new Error(`Nominatim error: ${response.status}`);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (error as any).status = response.status;

          // Nominatim returns 429 for rate limiting
          if (response.status === 429 || response.status === 503) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (error as any).isRetryable = true;
          }

          throw error;
        }

        return response;
      },
      {
        ...RETRY_CONFIG,
        onRetry: (attempt, error, delayMs) => {
          console.warn(`[Nominatim] Retry ${attempt} after ${Math.round(delayMs)}ms: ${error.message}`);
        },
      }
    );

    const data = await result.json();

    return data.map((item: {
      place_id: number;
      display_name: string;
      lat: string;
      lon: string;
      type: string;
      class: string;
      address?: Record<string, string>;
    }) => ({
      placeId: String(item.place_id),
      name: item.display_name.split(',')[0],
      formattedAddress: item.display_name,
      coordinates: {
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon),
      },
      types: [item.type, item.class].filter(Boolean),
      source: 'nominatim' as const,
    }));
  } catch (error) {
    console.error('[Nominatim] Search failed after retries:', error);
    return [];
  }
}

/**
 * Search using Photon API (Komoot) - alternative OSM geocoder
 * Faster and more lenient rate limits than Nominatim
 */
export async function searchPhoton(
  query: string,
  options?: {
    near?: { lat: number; lng: number };
    limit?: number;
  }
): Promise<EnrichedPlaceData[]> {
  await enforcePhotonRateLimit();

  const params = new URLSearchParams({
    q: query,
    limit: String(options?.limit || 3),
  });

  // Add bias location if provided
  if (options?.near) {
    params.set('lat', String(options.near.lat));
    params.set('lon', String(options.near.lng));
  }

  try {
    const result = await retryWithBackoff(
      async () => {
        const response = await fetch(`${PHOTON_BASE}/api/?${params}`, {
          headers: {
            'Accept': 'application/json',
          },
        });

        if (!response.ok) {
          const error = new Error(`Photon error: ${response.status}`);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (error as any).status = response.status;

          if (response.status === 429 || response.status === 503) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (error as any).isRetryable = true;
          }

          throw error;
        }

        return response;
      },
      {
        ...RETRY_CONFIG,
        onRetry: (attempt, error, delayMs) => {
          console.warn(`[Photon] Retry ${attempt} after ${Math.round(delayMs)}ms: ${error.message}`);
        },
      }
    );

    const data = await result.json();

    return (data.features || []).map((feature: {
      properties: {
        osm_id?: number;
        name?: string;
        street?: string;
        city?: string;
        state?: string;
        country?: string;
        type?: string;
      };
      geometry: {
        coordinates: [number, number];
      };
    }) => {
      const props = feature.properties;
      const coords = feature.geometry.coordinates;

      // Build display name from parts
      const addressParts = [
        props.name,
        props.street,
        props.city,
        props.state,
        props.country,
      ].filter(Boolean);

      return {
        placeId: String(props.osm_id || Math.random()),
        name: props.name || addressParts[0] || query,
        formattedAddress: addressParts.join(', '),
        coordinates: {
          lat: coords[1],
          lng: coords[0],
        },
        types: [props.type].filter(Boolean),
        source: 'photon' as const,
      };
    });
  } catch (error) {
    console.error('[Photon] Search failed after retries:', error);
    return [];
  }
}

// Enhanced in-memory cache with TTL
interface CacheEntry {
  data: EnrichedPlaceData;
  timestamp: number;
}

const placeCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

function getCacheKey(query: string): string {
  return query.toLowerCase().trim();
}

export function getCachedPlace(query: string): EnrichedPlaceData | null {
  const key = getCacheKey(query);
  const entry = placeCache.get(key);

  if (!entry) return null;

  // Check if cache entry is still valid
  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    placeCache.delete(key);
    return null;
  }

  return entry.data;
}

export function cachePlace(query: string, place: EnrichedPlaceData): void {
  const key = getCacheKey(query);
  placeCache.set(key, {
    data: place,
    timestamp: Date.now(),
  });

  // Clean up old entries periodically (keep max 500)
  if (placeCache.size > 500) {
    const entries = Array.from(placeCache.entries());
    entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
    for (let i = 0; i < 100; i++) {
      placeCache.delete(entries[i][0]);
    }
  }
}

/**
 * Clear all cached places
 */
export function clearPlaceCache(): void {
  placeCache.clear();
}

/**
 * Main search function with fallback chain:
 * 1. Check cache
 * 2. Try Photon (faster, more reliable)
 * 3. Fallback to Nominatim
 */
export async function searchPlace(query: string): Promise<PlaceSearchResult> {
  // Check cache first
  const cached = getCachedPlace(query);
  if (cached) {
    console.log(`[Geocoding] Cache hit for: ${query}`);
    return { places: [cached], source: 'cached', cached: true };
  }

  // Try Photon first (faster, more lenient)
  console.log(`[Geocoding] Searching Photon for: ${query}`);
  let places = await searchPhoton(query);

  if (places.length > 0) {
    cachePlace(query, places[0]);
    return { places, source: 'photon', cached: false };
  }

  // Fallback to Nominatim
  console.log(`[Geocoding] Photon failed, falling back to Nominatim for: ${query}`);
  places = await searchNominatim(query);

  if (places.length > 0) {
    cachePlace(query, places[0]);
    return { places, source: 'nominatim', cached: false };
  }

  return { places: [], source: 'nominatim', cached: false };
}

/**
 * Search with location bias (prefer results near a specific point)
 */
export async function searchPlaceNear(
  query: string,
  nearCoords: { lat: number; lng: number },
  limit: number = 3
): Promise<EnrichedPlaceData[]> {
  // Try Photon first
  let places = await searchPhoton(query, { near: nearCoords, limit });

  if (places.length === 0) {
    // Fallback to Nominatim
    places = await searchNominatim(query, { near: nearCoords, limit });
  }

  // Cache all results
  places.forEach(place => {
    cachePlace(place.name, place);
  });

  return places;
}
