// Category-Aware Recommendations - Dynamic search, no hardcoded data
import type { ExtractedPlace } from '../ai/types';
import type { Coords, PlaceCategory, PlaceRecommendation } from './types';
import type { PlaceKnowledge } from './place-research.types';
import { mapToPlaceCategory } from './time-optimizer';
import { haversineDistance, calculateCentroid } from './route-optimizer';
import { searchPlace } from './web-search';
import { searchPlace as geocodePlace } from '../ai/search/nominatim.service';

// Required categories for a complete trip
const REQUIRED_CATEGORIES: PlaceCategory[] = [
  'accommodation',
  'restaurant',
];

// Recommended categories for variety
const RECOMMENDED_CATEGORIES: PlaceCategory[] = [
  'beach',
  'landmark',
  'activity',
];

/**
 * Detect missing categories in the extracted places
 */
export function detectMissingCategories(places: ExtractedPlace[]): PlaceCategory[] {
  const presentCategories = new Set<PlaceCategory>();

  for (const place of places) {
    presentCategories.add(mapToPlaceCategory(place));
  }

  const missing: PlaceCategory[] = [];

  // Check required categories
  for (const cat of REQUIRED_CATEGORIES) {
    if (!presentCategories.has(cat)) {
      missing.push(cat);
    }
  }

  // Check recommended categories (at least one of them)
  const hasRecommended = RECOMMENDED_CATEGORIES.some(cat => presentCategories.has(cat));
  if (!hasRecommended && places.length >= 2) {
    // Suggest a beach if no recommended categories present
    missing.push('beach');
  }

  return missing;
}

/**
 * Detect category imbalance (too many of one type)
 */
export function detectCategoryImbalance(places: ExtractedPlace[]): {
  category: PlaceCategory;
  count: number;
  suggestion: string;
}[] {
  const categoryCount: Record<string, number> = {};

  for (const place of places) {
    const cat = mapToPlaceCategory(place);
    categoryCount[cat] = (categoryCount[cat] || 0) + 1;
  }

  const imbalances: { category: PlaceCategory; count: number; suggestion: string }[] = [];

  // If more than 3 forts/landmarks, suggest variety
  if ((categoryCount['fort'] || 0) + (categoryCount['landmark'] || 0) > 3) {
    if (!categoryCount['beach']) {
      imbalances.push({
        category: 'landmark' as PlaceCategory,
        count: (categoryCount['fort'] || 0) + (categoryCount['landmark'] || 0),
        suggestion: 'Lots of historical sites! Consider adding a beach for variety.',
      });
    }
  }

  // If no nightlife but has nightlife-friendly location names
  if (!categoryCount['nightlife'] && places.some(p =>
    p.name.toLowerCase().includes('baga') ||
    p.name.toLowerCase().includes('anjuna') ||
    p.name.toLowerCase().includes('calangute') ||
    p.name.toLowerCase().includes('candolim')
  )) {
    imbalances.push({
      category: 'nightlife' as PlaceCategory,
      count: 0,
      suggestion: "You're near popular nightlife spots! Consider exploring the local bar scene.",
    });
  }

  return imbalances;
}

/**
 * Dynamically search for recommendations for a category
 * Uses web search instead of hardcoded lists
 */
export async function searchRecommendationsForCategory(
  category: PlaceCategory,
  centroid: Coords,
  region: string = 'Goa, India'
): Promise<PlaceRecommendation[]> {
  const categorySearchTerms: Record<PlaceCategory, string> = {
    restaurant: 'best restaurants cafes',
    beach: 'best beaches',
    landmark: 'tourist attractions landmarks monuments',
    fort: 'historic forts',
    accommodation: 'best hotels resorts',
    nightlife: 'bars clubs nightlife',
    activity: 'adventure activities things to do',
    destination: 'places to visit',
  };

  const searchTerm = categorySearchTerms[category] || 'places to visit';
  const query = `${searchTerm} near ${centroid.lat.toFixed(4)},${centroid.lng.toFixed(4)} ${region}`;

  console.log(`[Recommendations] Searching: ${query}`);

  try {
    const searchResults = await searchPlace(query, region);
    const recommendations: PlaceRecommendation[] = [];

    for (const result of searchResults.results.slice(0, 5)) {
      // Extract place name from search result
      const placeName = extractPlaceName(result.title, result.snippet);
      if (!placeName) continue;

      // Try to get coordinates using Photon fallback
      let coords: Coords = { lat: centroid.lat + 0.01, lng: centroid.lng + 0.01 }; // Fallback near centroid

      try {
        const geoResult = await geocodePlace(`${placeName}, ${region}`);
        if (geoResult.places.length > 0 && geoResult.places[0].coordinates) {
          coords = geoResult.places[0].coordinates;
        }
      } catch {
        // Use fallback coordinates
      }

      const distance = haversineDistance(centroid, coords);

      recommendations.push({
        name: placeName,
        type: category,
        coordinates: coords,
        distance: Math.round(distance * 10) / 10,
        reason: result.snippet.substring(0, 100),
        score: 0.8 - (recommendations.length * 0.1), // Decrease score for later results
        mapUrl: `https://www.openstreetmap.org/?mlat=${coords.lat}&mlon=${coords.lng}`,
        googleMapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(placeName + ' ' + region)}`,
      });

      // Rate limit
      await new Promise(r => setTimeout(r, 300));
    }

    return recommendations.sort((a, b) => a.distance - b.distance).slice(0, 3);
  } catch (error) {
    console.warn(`[Recommendations] Search failed for ${category}:`, error);
    return [];
  }
}

/**
 * Extract a clean place name from search result
 */
function extractPlaceName(title: string, snippet: string): string | null {
  // Clean up common patterns
  let name = title
    .replace(/\s*[-|]\s*.*/g, '') // Remove everything after - or |
    .replace(/\([^)]*\)/g, '')     // Remove parentheses content
    .replace(/^\d+\.\s*/, '')      // Remove numbered list prefix
    .trim();

  // If title is too generic, try snippet
  if (name.length < 3 || name.toLowerCase().includes('best') || name.toLowerCase().includes('top')) {
    const snippetMatch = snippet.match(/^([A-Z][a-zA-Z'\s]+?)(?:\s*[-,.]|$)/);
    if (snippetMatch) {
      name = snippetMatch[1].trim();
    }
  }

  return name.length >= 3 && name.length <= 50 ? name : null;
}

/**
 * Get recommendations for missing categories (sync fallback)
 * Uses nearby places from existing PlaceKnowledge when available
 */
export function getRecommendationsFromKnowledge(
  knowledge: PlaceKnowledge[],
  missingCategories: PlaceCategory[]
): PlaceRecommendation[] {
  const recommendations: PlaceRecommendation[] = [];

  // Collect all nearby restaurants and attractions from researched places
  const allNearbyRestaurants = knowledge.flatMap(k => k.nearbyRestaurants);
  const allNearbyAttractions = knowledge.flatMap(k => k.nearbyAttractions);

  for (const category of missingCategories) {
    if (category === 'restaurant' && allNearbyRestaurants.length > 0) {
      const restaurant = allNearbyRestaurants[0];
      recommendations.push({
        name: restaurant.name,
        type: 'restaurant',
        coordinates: restaurant.coordinates,
        distance: restaurant.distance,
        reason: 'Discovered during place research - popular nearby restaurant',
        score: restaurant.rating ? restaurant.rating / 5 : 0.7,
        mapUrl: `https://www.openstreetmap.org/?mlat=${restaurant.coordinates.lat}&mlon=${restaurant.coordinates.lng}`,
        googleMapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(restaurant.name)}`,
      });
    }

    if ((category === 'landmark' || category === 'beach' || category === 'activity') && allNearbyAttractions.length > 0) {
      const attraction = allNearbyAttractions[0];
      recommendations.push({
        name: attraction.name,
        type: category,
        coordinates: attraction.coordinates,
        distance: attraction.distance,
        reason: 'Discovered during place research - nearby attraction',
        score: attraction.rating ? attraction.rating / 5 : 0.7,
        mapUrl: `https://www.openstreetmap.org/?mlat=${attraction.coordinates.lat}&mlon=${attraction.coordinates.lng}`,
        googleMapsUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(attraction.name)}`,
      });
    }
  }

  return recommendations;
}

/**
 * Get all recommendations for a trip (async version with dynamic search)
 */
export async function getAllRecommendationsAsync(
  places: ExtractedPlace[],
  knowledge: PlaceKnowledge[],
  region: string = 'Goa, India'
): Promise<{
  missing: PlaceRecommendation[];
  variety: PlaceRecommendation[];
  imbalances: { category: PlaceCategory; count: number; suggestion: string }[];
}> {
  const centroid = calculateCentroid(places);
  const missing = detectMissingCategories(places);
  const imbalances = detectCategoryImbalance(places);

  // First try to get recommendations from existing knowledge
  const missingRecs = getRecommendationsFromKnowledge(knowledge, missing);

  // If not enough recommendations, do dynamic search
  if (missingRecs.length < missing.length) {
    for (const cat of missing) {
      if (!missingRecs.some(r => r.type === cat)) {
        const searchRecs = await searchRecommendationsForCategory(cat, centroid, region);
        missingRecs.push(...searchRecs.map(r => ({
          ...r,
          reason: `Missing ${cat}: ${r.reason}`,
        })));
      }
    }
  }

  // Get variety recommendations for imbalances
  const varietyRecs: PlaceRecommendation[] = [];
  for (const imb of imbalances) {
    if (imb.category === 'landmark' || imb.category === 'fort') {
      const beachRecs = await searchRecommendationsForCategory('beach', centroid, region);
      varietyRecs.push(...beachRecs);
    }
    if (imb.category === 'nightlife') {
      const nightlifeRecs = await searchRecommendationsForCategory('nightlife', centroid, region);
      varietyRecs.push(...nightlifeRecs.map(r => ({
        ...r,
        reason: imb.suggestion,
      })));
    }
  }

  return {
    missing: missingRecs,
    variety: varietyRecs,
    imbalances,
  };
}

/**
 * Sync version for backward compatibility (uses knowledge only)
 */
export function getAllRecommendations(
  places: ExtractedPlace[],
  knowledge: PlaceKnowledge[] = []
): {
  missing: PlaceRecommendation[];
  variety: PlaceRecommendation[];
  imbalances: { category: PlaceCategory; count: number; suggestion: string }[];
} {
  const missing = detectMissingCategories(places);
  const imbalances = detectCategoryImbalance(places);

  const missingRecs = getRecommendationsFromKnowledge(knowledge, missing);

  return {
    missing: missingRecs,
    variety: [],
    imbalances,
  };
}

/**
 * Check if places cover both North and South Goa
 */
export function checkRegionalCoverage(places: ExtractedPlace[]): {
  hasNorth: boolean;
  hasSouth: boolean;
  suggestion?: string;
} {
  // North Goa is roughly above latitude 15.4
  // South Goa is roughly below latitude 15.4
  const DIVIDING_LAT = 15.4;

  let hasNorth = false;
  let hasSouth = false;

  for (const place of places) {
    if (place.coordinates) {
      if (place.coordinates.lat > DIVIDING_LAT) hasNorth = true;
      else hasSouth = true;
    }
  }

  let suggestion: string | undefined;

  if (hasNorth && !hasSouth && places.length >= 3) {
    suggestion = 'All places are in North Goa. Consider exploring South Goa for a quieter experience.';
  } else if (hasSouth && !hasNorth && places.length >= 3) {
    suggestion = 'All places are in South Goa. Consider North Goa for more vibrant beaches and nightlife.';
  }

  return { hasNorth, hasSouth, suggestion };
}

/**
 * Smart recommendation insertion into itinerary
 */
export async function suggestMealPlacement(
  dayActivities: { startTime: string; endTime: string; type: string }[],
  centroid: Coords,
  region: string = 'Goa, India'
): Promise<PlaceRecommendation | null> {
  // Check if there's a lunch gap (11:30 - 14:00 without a meal)
  const hasLunch = dayActivities.some(
    a => a.type === 'meal' && parseInt(a.startTime) >= 11 && parseInt(a.startTime) <= 14
  );

  if (!hasLunch && dayActivities.length >= 3) {
    const restaurants = await searchRecommendationsForCategory('restaurant', centroid, region);
    if (restaurants.length > 0) {
      return {
        ...restaurants[0],
        reason: 'No lunch spot planned - add a restaurant around midday',
      };
    }
  }

  return null;
}
