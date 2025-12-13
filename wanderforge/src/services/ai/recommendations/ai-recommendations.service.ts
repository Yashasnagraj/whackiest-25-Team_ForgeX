// AI Recommendations Service
// Provides intelligent place suggestions during and after trip planning

import { LLMProviderManager } from '../providers';
import { searchPlace } from '../../itinerary/web-search';
import { searchPlace as geocodePlace } from '../search/nominatim.service';
import type {
  RegionSuggestion,
  PlaceSuggestion,
  MissedRecommendation,
  InterestCategory,
} from '../../itinerary/direct-input.types';
import { generatePlaceId } from '../../itinerary/direct-input.types';
import type { PlaceCategory } from '../../itinerary/types';
import {
  getRegionSuggestionsPrompt,
  getPopularPlacesPrompt,
  getMissedRecommendationsPrompt,
  getPlaceDetailsPrompt,
  getTripSummaryPrompt,
} from './prompts';

// Create LLM manager instance
const llmManager = new LLMProviderManager();

// Cache for region suggestions to avoid repeated API calls
const regionCache = new Map<string, RegionSuggestion[]>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const popularPlacesCache = new Map<string, CacheEntry<PlaceSuggestion[]>>();

/**
 * Get region suggestions based on partial input (autocomplete)
 */
export async function getRegionSuggestions(
  partialInput: string
): Promise<RegionSuggestion[]> {
  if (!partialInput || partialInput.length < 2) {
    return [];
  }

  const cacheKey = partialInput.toLowerCase().trim();

  // Check cache
  if (regionCache.has(cacheKey)) {
    return regionCache.get(cacheKey)!;
  }

  try {
    const prompt = getRegionSuggestionsPrompt(partialInput);
    const response = await llmManager.executeWithFallback(prompt);

    if (response.success && response.data?.suggestions) {
      const suggestions = response.data.suggestions as RegionSuggestion[];

      // Cache the results
      regionCache.set(cacheKey, suggestions);

      // Clean old cache entries
      setTimeout(() => regionCache.delete(cacheKey), CACHE_TTL);

      return suggestions;
    }

    return [];
  } catch (error) {
    console.error('Error getting region suggestions:', error);
    return [];
  }
}

/**
 * Get popular places in a region based on interests ("People also visit...")
 */
export async function getPopularPlacesInRegion(
  region: string,
  interests: InterestCategory[]
): Promise<PlaceSuggestion[]> {
  if (!region) return [];

  const cacheKey = `${region.toLowerCase()}_${interests.sort().join('_')}`;

  // Check cache
  const cached = popularPlacesCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  try {
    // First, do a web search for popular places
    const searchQueries = [
      `popular tourist places ${region}`,
      `must visit ${region} ${interests[0] || ''}`.trim(),
    ];

    const searchResults = await Promise.all(
      searchQueries.map(q => searchPlace(q, region, interests as string[]).catch(() => []))
    );

    const webResultsText = searchResults
      .flat()
      .slice(0, 10)
      .map(r => `- ${r.name}: ${r.description || ''}`)
      .join('\n');

    // Use LLM to extract and rank places
    const prompt = getPopularPlacesPrompt(region, interests, webResultsText);
    const response = await llmManager.executeWithFallback(prompt);

    if (response.success && response.data?.places) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const places: PlaceSuggestion[] = (response.data.places as any[]).map((p, _i) => ({
        id: generatePlaceId(),
        name: p.name,
        type: mapToPlaceCategory(p.type),
        reason: p.reason || 'Popular attraction',
        description: p.description,
        confidence: p.confidence || 70,
        source: 'web_search' as const,
      }));

      // Geocode the top places using Photon fallback
      const geocodedPlaces = await Promise.all(
        places.slice(0, 8).map(async (place) => {
          try {
            const geoResult = await geocodePlace(`${place.name}, ${region}`);
            if (geoResult.places.length > 0 && geoResult.places[0].coordinates) {
              place.coordinates = geoResult.places[0].coordinates;
            }
          } catch {
            // Geocoding failed, continue without coordinates
          }
          return place;
        })
      );

      // Cache results
      popularPlacesCache.set(cacheKey, {
        data: geocodedPlaces,
        timestamp: Date.now(),
      });

      return geocodedPlaces;
    }

    return [];
  } catch (error) {
    console.error('Error getting popular places:', error);
    return [];
  }
}

/**
 * Search for places in a region (real-time search)
 */
export async function searchPlacesInRegion(
  query: string,
  region: string
): Promise<PlaceSuggestion[]> {
  if (!query || query.length < 2 || !region) return [];

  try {
    // Parallel search: Geocoding (Photon fallback) + web search
    const [geoResult, webResults] = await Promise.all([
      geocodePlace(`${query}, ${region}`).catch(() => ({ places: [], source: 'nominatim' as const, cached: false })),
      searchPlace(query, region, []).catch(() => []),
    ]);

    // Combine and deduplicate
    const suggestions: PlaceSuggestion[] = [];
    const seenNames = new Set<string>();

    // Add geocoding results first (more accurate geo)
    for (const result of geoResult.places.slice(0, 4)) {
      const name = result.name;
      if (!seenNames.has(name.toLowerCase())) {
        seenNames.add(name.toLowerCase());
        suggestions.push({
          id: generatePlaceId(),
          name,
          type: mapNominatimType(result.types?.[0] || 'place'),
          reason: 'Found in map search',
          description: result.formattedAddress,
          coordinates: result.coordinates,
          confidence: 80,
          source: 'web_search',
        });
      }
    }

    // Add web search results
    for (const result of webResults.slice(0, 4)) {
      if (!seenNames.has(result.name.toLowerCase())) {
        seenNames.add(result.name.toLowerCase());
        suggestions.push({
          id: generatePlaceId(),
          name: result.name,
          type: result.type as PlaceCategory || 'landmark',
          reason: result.reason || 'Found in web search',
          description: result.description,
          coordinates: result.coordinates,
          confidence: 70,
          source: 'web_search',
        });
      }
    }

    return suggestions.slice(0, 6);
  } catch (error) {
    console.error('Error searching places:', error);
    return [];
  }
}

/**
 * Get missed recommendations after itinerary generation
 */
export async function getMissedRecommendations(
  region: string,
  selectedPlaces: string[],
  interests: InterestCategory[]
): Promise<MissedRecommendation[]> {
  if (!region || selectedPlaces.length === 0) return [];

  try {
    // Search for hidden gems and must-visit places
    const searchQueries = [
      `hidden gems ${region}`,
      `must visit ${region} tourists miss`,
      `local favorites ${region}`,
      `best ${interests[0] || 'attractions'} ${region}`,
    ];

    const searchResults = await Promise.all(
      searchQueries.map(q => searchPlace(q, region, []).catch(() => []))
    );

    const webResultsText = searchResults
      .flat()
      .filter(r => r && r.name && !selectedPlaces.some(p =>
        p && r.name.toLowerCase().includes(p.toLowerCase()) ||
        p && p.toLowerCase().includes(r.name.toLowerCase())
      ))
      .slice(0, 15)
      .map(r => `- ${r.name}: ${r.description || ''}`)
      .join('\n');

    // Use LLM to analyze gaps and suggest places
    const prompt = getMissedRecommendationsPrompt(
      region,
      selectedPlaces,
      interests,
      webResultsText
    );

    const response = await llmManager.executeWithFallback(prompt);

    if (response.success && response.data?.recommendations) {
      const recommendations: MissedRecommendation[] = await Promise.all(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (response.data.recommendations as any[]).map(async (r) => {
          const rec: MissedRecommendation = {
            id: generatePlaceId(),
            name: r.name,
            type: mapToPlaceCategory(r.type),
            reason: r.reason || 'Recommended based on your interests',
            description: r.description || '',
            bestTimeToVisit: r.bestTimeToVisit,
            estimatedDuration: r.estimatedDuration,
            source: r.source || 'gap_analysis',
            status: 'pending',
          };

          // Try to geocode using Photon fallback
          try {
            const geoResult = await geocodePlace(`${r.name}, ${region}`);
            if (geoResult.places.length > 0 && geoResult.places[0].coordinates) {
              rec.coordinates = geoResult.places[0].coordinates;
            }
          } catch {
            // Continue without coordinates
          }

          return rec;
        })
      );

      return recommendations;
    }

    return [];
  } catch (error) {
    console.error('Error getting missed recommendations:', error);
    return [];
  }
}

/**
 * Get detailed information about a place
 */
export async function getPlaceDetails(
  placeName: string,
  region: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any | null> {
  try {
    // Web search for place details
    const searchResults = await searchPlace(placeName, region, []).catch(() => []);
    const webResultsText = searchResults
      .slice(0, 5)
      .map(r => `- ${r.name}: ${r.description || ''}`)
      .join('\n');

    const prompt = getPlaceDetailsPrompt(placeName, region, webResultsText);
    const response = await llmManager.executeWithFallback(prompt);

    if (response.success && response.data) {
      return response.data;
    }

    return null;
  } catch (error) {
    console.error('Error getting place details:', error);
    return null;
  }
}

/**
 * Generate a trip summary/tagline
 */
export async function generateTripSummary(
  region: string,
  days: number,
  interests: InterestCategory[],
  places: string[]
): Promise<{ title: string; tagline: string; summary: string } | null> {
  try {
    const prompt = getTripSummaryPrompt(region, days, interests, places);
    const response = await llmManager.executeWithFallback(prompt);

    if (response.success && response.data) {
      return {
        title: response.data.title || `${days}-Day ${region} Trip`,
        tagline: response.data.tagline || 'Your personalized adventure awaits',
        summary: response.data.summary || '',
      };
    }

    return null;
  } catch (error) {
    console.error('Error generating trip summary:', error);
    return null;
  }
}

// Helper functions

function mapToPlaceCategory(type: string): PlaceCategory {
  const typeMap: Record<string, PlaceCategory> = {
    beach: 'beach',
    landmark: 'landmark',
    restaurant: 'restaurant',
    activity: 'activity',
    temple: 'temple',
    fort: 'fort',
    nature: 'nature',
    nightlife: 'nightlife',
    market: 'market',
    hotel: 'accommodation',
    accommodation: 'accommodation',
    shopping: 'market',
    museum: 'landmark',
    park: 'nature',
    waterfall: 'nature',
    lake: 'nature',
    viewpoint: 'landmark',
  };
  return typeMap[type?.toLowerCase()] || 'landmark';
}

function mapNominatimType(type: string): PlaceCategory {
  const typeMap: Record<string, PlaceCategory> = {
    tourism: 'landmark',
    attraction: 'landmark',
    beach: 'beach',
    restaurant: 'restaurant',
    hotel: 'accommodation',
    place_of_worship: 'temple',
    historic: 'landmark',
    castle: 'fort',
    park: 'nature',
    water: 'nature',
    natural: 'nature',
    shop: 'market',
    nightclub: 'nightlife',
    bar: 'nightlife',
  };
  return typeMap[type?.toLowerCase()] || 'landmark';
}

/**
 * Clear all caches (useful for testing or refresh)
 */
export function clearRecommendationCaches(): void {
  regionCache.clear();
  popularPlacesCache.clear();
}
