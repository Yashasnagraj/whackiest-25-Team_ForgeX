// Research Pipeline - Orchestrates place research with caching
import type { ExtractedPlace } from '../ai/types';
import type {
  PlaceKnowledge,
  PlaceCacheEntry,
  ResearchProgress,
  ResearchOptions,
} from './place-research.types';
import { researchSinglePlace, detectRegion } from './place-research';

// Cache configuration
const CACHE_KEY = 'wanderforge_place_knowledge_cache';
const CACHE_VERSION = 1; // Increment when schema changes
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

/**
 * Get cached knowledge for a place
 */
function getCachedKnowledge(placeName: string): PlaceKnowledge | null {
  try {
    const cacheStr = localStorage.getItem(CACHE_KEY);
    if (!cacheStr) return null;

    const cache: Record<string, PlaceCacheEntry> = JSON.parse(cacheStr);
    const entry = cache[placeName.toLowerCase()];

    if (!entry) return null;

    // Check version and TTL
    if (entry.version !== CACHE_VERSION) {
      console.log(`[Cache] Version mismatch for ${placeName}, will re-research`);
      return null;
    }

    if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
      console.log(`[Cache] Entry expired for ${placeName}, will re-research`);
      return null;
    }

    console.log(`[Cache] HIT for ${placeName}`);
    return entry.data;
  } catch (error) {
    console.warn('[Cache] Error reading cache:', error);
    return null;
  }
}

/**
 * Save knowledge to cache
 */
function setCachedKnowledge(placeName: string, knowledge: PlaceKnowledge): void {
  try {
    const cacheStr = localStorage.getItem(CACHE_KEY);
    const cache: Record<string, PlaceCacheEntry> = cacheStr ? JSON.parse(cacheStr) : {};

    cache[placeName.toLowerCase()] = {
      data: knowledge,
      timestamp: Date.now(),
      version: CACHE_VERSION,
    };

    localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
    console.log(`[Cache] Saved ${placeName}`);
  } catch (error) {
    console.warn('[Cache] Error saving to cache:', error);
  }
}

/**
 * Clear all cached place knowledge
 */
export function clearPlaceCache(): void {
  try {
    localStorage.removeItem(CACHE_KEY);
    console.log('[Cache] Cleared all place knowledge');
  } catch (error) {
    console.warn('[Cache] Error clearing cache:', error);
  }
}

/**
 * Get cache statistics
 */
export function getCacheStats(): { entries: number; oldestEntry: Date | null; totalSize: string } {
  try {
    const cacheStr = localStorage.getItem(CACHE_KEY);
    if (!cacheStr) return { entries: 0, oldestEntry: null, totalSize: '0 KB' };

    const cache: Record<string, PlaceCacheEntry> = JSON.parse(cacheStr);
    const entries = Object.keys(cache).length;

    let oldestTimestamp = Date.now();
    for (const entry of Object.values(cache)) {
      if (entry.timestamp < oldestTimestamp) {
        oldestTimestamp = entry.timestamp;
      }
    }

    const sizeKB = Math.round(cacheStr.length / 1024);

    return {
      entries,
      oldestEntry: entries > 0 ? new Date(oldestTimestamp) : null,
      totalSize: `${sizeKB} KB`,
    };
  } catch {
    return { entries: 0, oldestEntry: null, totalSize: '0 KB' };
  }
}

/**
 * Research multiple places with progress tracking and caching
 */
export async function researchPlaces(
  places: ExtractedPlace[],
  options: ResearchOptions
): Promise<PlaceKnowledge[]> {
  const { region, useCache = true, onProgress } = options;

  const knowledge: PlaceKnowledge[] = [];
  const totalPlaces = places.length;

  console.log(`[Pipeline] Starting research for ${totalPlaces} places in ${region}`);

  for (let i = 0; i < places.length; i++) {
    const place = places[i];
    const placeName = place.name;

    // Report progress: searching
    onProgress?.({
      stage: 'searching',
      placeName,
      placeIndex: i,
      totalPlaces,
      percent: (i / totalPlaces) * 100,
      message: `Searching for ${placeName}...`,
    });

    // Check cache first
    if (useCache) {
      const cached = getCachedKnowledge(placeName);
      if (cached) {
        knowledge.push(cached);
        onProgress?.({
          stage: 'complete',
          placeName,
          placeIndex: i,
          totalPlaces,
          percent: ((i + 1) / totalPlaces) * 100,
          message: `${placeName} (cached)`,
        });
        continue;
      }
    }

    // Research the place
    try {
      onProgress?.({
        stage: 'extracting',
        placeName,
        placeIndex: i,
        totalPlaces,
        percent: (i / totalPlaces) * 100 + (100 / totalPlaces) * 0.3,
        message: `Extracting info for ${placeName}...`,
      });

      const placeKnowledge = await researchSinglePlace(place, region);

      // Save to cache
      if (useCache) {
        setCachedKnowledge(placeName, placeKnowledge);
      }

      knowledge.push(placeKnowledge);

      onProgress?.({
        stage: 'complete',
        placeName,
        placeIndex: i,
        totalPlaces,
        percent: ((i + 1) / totalPlaces) * 100,
        message: `Completed ${placeName}`,
      });
    } catch (error) {
      console.error(`[Pipeline] Failed to research ${placeName}:`, error);

      // Create minimal knowledge on failure
      const fallbackKnowledge: PlaceKnowledge = {
        name: placeName,
        type: 'destination',
        coordinates: place.coordinates || { lat: 15.4909, lng: 73.8278 },
        description: `${placeName} in ${region}`,
        rating: 4.0,
        reviewCount: 0,
        priceLevel: 2,
        openingHours: null,
        bestTimeToVisit: 'Morning or afternoon recommended',
        typicalDuration: 60,
        crowdPeakHours: ['10:00-12:00', '16:00-18:00'],
        nearbyRestaurants: [],
        nearbyAttractions: [],
        entryFee: null,
        parkingAvailable: true,
        wheelchairAccessible: false,
        sourceUrls: [],
        lastUpdated: new Date().toISOString(),
        researchConfidence: 0.2,
      };

      knowledge.push(fallbackKnowledge);

      onProgress?.({
        stage: 'complete',
        placeName,
        placeIndex: i,
        totalPlaces,
        percent: ((i + 1) / totalPlaces) * 100,
        message: `${placeName} (limited data)`,
      });
    }

    // Rate limiting delay between places
    if (i < places.length - 1) {
      await new Promise(r => setTimeout(r, 500));
    }
  }

  console.log(`[Pipeline] Completed research for ${knowledge.length} places`);

  return knowledge;
}

/**
 * Quick estimate for places (without full research)
 * Used for preview before generating full itinerary
 */
export function estimatePlaces(places: ExtractedPlace[]): {
  totalDuration: number;
  hasAccommodation: boolean;
  hasMeals: boolean;
  needsResearch: number;
} {
  let totalDuration = 0;
  let hasAccommodation = false;
  let hasMeals = false;
  let needsResearch = 0;

  const durationMap: Record<string, number> = {
    beach: 180,
    fort: 120,
    landmark: 90,
    accommodation: 0,
    restaurant: 60,
    nightlife: 180,
    activity: 120,
    destination: 90,
  };

  for (const place of places) {
    const type = place.type?.toLowerCase() || 'destination';

    if (type === 'hotel' || type === 'accommodation' || type === 'resort') {
      hasAccommodation = true;
    }

    if (type === 'restaurant' || type === 'cafe') {
      hasMeals = true;
    }

    totalDuration += durationMap[type] || 60;

    // Check if we have cached data
    const cached = getCachedKnowledge(place.name);
    if (!cached) {
      needsResearch++;
    }
  }

  return {
    totalDuration,
    hasAccommodation,
    hasMeals,
    needsResearch,
  };
}

/**
 * Research places with auto-detected region
 */
export async function researchPlacesAutoRegion(
  places: ExtractedPlace[],
  onProgress?: (progress: ResearchProgress) => void
): Promise<PlaceKnowledge[]> {
  const region = detectRegion(places);
  console.log(`[Pipeline] Auto-detected region: ${region}`);

  return researchPlaces(places, {
    region,
    useCache: true,
    maxNearbyPlaces: 3,
    onProgress,
  });
}
