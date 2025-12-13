// Search API Manager
// Uses Photon as primary geocoder with Nominatim fallback (avoids CORS issues)
import type { ExtractedPlace } from '../types';
import {
  searchPlace,
  searchPlaceNear,
  searchPhoton,
  searchNominatim,
  getCachedPlace,
  cachePlace,
  clearPlaceCache,
} from './nominatim.service';

// Re-export all geocoding functions
export {
  searchPlace,        // Primary: Cache → Photon → Nominatim fallback
  searchPlaceNear,    // With location bias
  searchPhoton,       // Direct Photon API (fast, lenient)
  searchNominatim,    // Direct Nominatim API (may have CORS issues)
  getCachedPlace,
  cachePlace,
  clearPlaceCache,
};

// Known Indian travel destinations - add "India" or "Goa" suffix for better search
const GOA_PLACES = new Set([
  'baga', 'calangute', 'anjuna', 'vagator', 'palolem', 'colva', 'candolim',
  'aguada', 'chapora', 'panaji', 'margao', 'mapusa', 'dudhsagar', 'arambol',
  'morjim', 'ashwem', 'mandrem', 'sinquerim', 'dona paula', 'miramar',
]);

const INDIAN_DESTINATIONS = new Set([
  'coorg', 'munnar', 'ooty', 'kodaikanal', 'wayanad', 'alleppey', 'kovalam',
  'hampi', 'mysore', 'bangalore', 'chennai', 'hyderabad', 'mumbai', 'delhi',
  'jaipur', 'udaipur', 'jodhpur', 'rishikesh', 'manali', 'shimla', 'darjeeling',
]);

// Enhance search query with region context for better results
function enhanceSearchQuery(placeName: string): string {
  const lower = placeName.toLowerCase();

  // If it's a known Goa place, add "Goa, India"
  if (GOA_PLACES.has(lower)) {
    return `${placeName}, Goa, India`;
  }

  // If it's a known Indian destination, add "India"
  if (INDIAN_DESTINATIONS.has(lower)) {
    return `${placeName}, India`;
  }

  // If it contains beach/fort keywords, add "Goa, India" for Indian context
  if (/beach|fort|shack/i.test(placeName) && !/usa|america|europe|spain/i.test(placeName)) {
    return `${placeName}, Goa, India`;
  }

  return placeName;
}

/**
 * Enrich places with real location data
 * @param places - Array of extracted places
 * @param maxToEnrich - Maximum number of places to enrich (to avoid rate limits)
 */
export async function enrichPlaces(
  places: ExtractedPlace[],
  maxToEnrich: number = 5
): Promise<ExtractedPlace[]> {
  // Only enrich places that don't have coordinates yet
  const toEnrich = places
    .filter(p => !p.coordinates && p.status === 'confirmed')
    .slice(0, maxToEnrich);

  console.log(`[Search] Enriching ${toEnrich.length} places...`);

  const enrichedPromises = toEnrich.map(async (place) => {
    try {
      // Use enhanced query for better Indian location results
      const enhancedQuery = enhanceSearchQuery(place.name);
      const result = await searchPlace(enhancedQuery);

      if (result.places.length > 0) {
        const enrichedData = result.places[0];
        console.log(`[Search] Enriched "${place.name}" → ${enrichedData.formattedAddress}`);

        return {
          ...place,
          enrichedData,
          coordinates: enrichedData.coordinates,
        };
      }
    } catch (error) {
      console.error(`[Search] Failed to enrich "${place.name}":`, error);
    }

    return place;
  });

  const enrichedPlaces = await Promise.all(enrichedPromises);

  // Create a map of enriched places
  const enrichedMap = new Map(
    enrichedPlaces.map(p => [p.name.toLowerCase(), p])
  );

  // Merge enriched places back into original array
  return places.map(p =>
    enrichedMap.get(p.name.toLowerCase()) || p
  );
}
