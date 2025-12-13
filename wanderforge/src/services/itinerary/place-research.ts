// Place Research Service - Extracts rich knowledge from web search results
import type { ExtractedPlace } from '../ai/types';
import type {
  PlaceKnowledge,
  NearbyPlace,
  ExtractedPlaceInfo,
} from './place-research.types';
import type { PlaceCategory, Coords } from './types';
import { searchPlace, searchNearbyFood } from './web-search';
import { searchPlace as geocodePlace } from '../ai/search/nominatim.service';
import { LLMProviderManager } from '../ai/providers';
import { haversineDistance } from './route-optimizer';

/**
 * Map extracted place type to our PlaceCategory
 */
export function mapToPlaceCategory(place: ExtractedPlace): PlaceCategory {
  const typeMap: Record<string, PlaceCategory> = {
    beach: 'beach',
    hotel: 'accommodation',
    hostel: 'accommodation',
    resort: 'accommodation',
    homestay: 'accommodation',
    accommodation: 'accommodation',
    restaurant: 'restaurant',
    cafe: 'restaurant',
    bar: 'nightlife',
    club: 'nightlife',
    nightlife: 'nightlife',
    fort: 'fort',
    church: 'landmark',
    temple: 'landmark',
    museum: 'landmark',
    landmark: 'landmark',
    monument: 'landmark',
    activity: 'activity',
    adventure: 'activity',
    waterfall: 'landmark',
    market: 'activity',
    shopping: 'activity',
  };

  const placeType = place.type?.toLowerCase() || 'destination';
  return typeMap[placeType] || 'destination';
}

/**
 * Extract structured place information using LLM
 */
async function extractPlaceInfoWithLLM(
  placeName: string,
  searchSnippets: string[],
  region: string
): Promise<ExtractedPlaceInfo> {
  const llmManager = new LLMProviderManager();

  const prompt = {
    system: `You are a travel information extractor. Analyze search results and extract accurate travel data.
Be conservative with ratings - only include if explicitly mentioned.
Return valid JSON only.`,
    user: `Extract travel information about "${placeName}" in ${region} from these search results:

${searchSnippets.slice(0, 5).join('\n\n')}

Return JSON with exactly these fields (use null for unknown values):
{
  "description": "2-3 sentence description of the place",
  "rating": 4.2,
  "reviewCount": 5000,
  "bestTimeToVisit": "Morning for photography, evening for sunset views",
  "typicalDuration": 90,
  "openingHours": { "open": "09:00", "close": "18:00", "days": ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] },
  "entryFee": 100,
  "crowdPeakHours": ["10:00-12:00", "16:00-18:00"],
  "nearbyRestaurantNames": ["Restaurant 1", "Restaurant 2"],
  "nearbyAttractionNames": ["Attraction 1", "Attraction 2"],
  "parkingAvailable": true,
  "wheelchairAccessible": false
}

Guidelines:
- description: Summarize what makes this place special
- rating: 1-5 scale, null if not found
- typicalDuration: time in MINUTES (60-180 typical)
- openingHours: null if unknown or always open
- entryFee: in INR, null if free or unknown
- crowdPeakHours: typical busy times`
  };

  try {
    const response = await llmManager.executeWithFallback<ExtractedPlaceInfo>(prompt);

    if (response.success && response.data) {
      return response.data;
    }
  } catch (error) {
    console.warn(`[PlaceResearch] LLM extraction failed for ${placeName}:`, error);
  }

  // Return defaults if LLM fails
  return {
    description: `${placeName} is a popular destination in ${region}.`,
    rating: null,
    reviewCount: null,
    bestTimeToVisit: 'Morning or late afternoon recommended',
    typicalDuration: 60,
    openingHours: null,
    entryFee: null,
    crowdPeakHours: ['10:00-12:00', '16:00-18:00'],
    nearbyRestaurantNames: [],
    nearbyAttractionNames: [],
    parkingAvailable: true,
    wheelchairAccessible: false,
  };
}

/**
 * Known region coordinates for fallback
 */
const REGION_COORDINATES: Record<string, Coords> = {
  'goa': { lat: 15.4909, lng: 73.8278 },
  'coorg': { lat: 12.4244, lng: 75.7382 },
  'kodagu': { lat: 12.4244, lng: 75.7382 },
  'mumbai': { lat: 19.0760, lng: 72.8777 },
  'delhi': { lat: 28.6139, lng: 77.2090 },
  'jaipur': { lat: 26.9124, lng: 75.7873 },
  'kerala': { lat: 10.8505, lng: 76.2711 },
  'bangalore': { lat: 12.9716, lng: 77.5946 },
  'bengaluru': { lat: 12.9716, lng: 77.5946 },
  'chennai': { lat: 13.0827, lng: 80.2707 },
  'hyderabad': { lat: 17.3850, lng: 78.4867 },
  'kolkata': { lat: 22.5726, lng: 88.3639 },
  'udaipur': { lat: 24.5854, lng: 73.7125 },
  'manali': { lat: 32.2396, lng: 77.1887 },
  'shimla': { lat: 31.1048, lng: 77.1734 },
  'rishikesh': { lat: 30.0869, lng: 78.2676 },
  'varanasi': { lat: 25.3176, lng: 82.9739 },
  'agra': { lat: 27.1767, lng: 78.0081 },
  'mysore': { lat: 12.2958, lng: 76.6394 },
  'mysuru': { lat: 12.2958, lng: 76.6394 },
  'ooty': { lat: 11.4102, lng: 76.6950 },
  'pondicherry': { lat: 11.9416, lng: 79.8083 },
  'puducherry': { lat: 11.9416, lng: 79.8083 },
};

/**
 * Get fallback coordinates based on place name or region
 */
function getFallbackCoordinates(placeName: string, region: string): Coords | null {
  const searchTerms = `${placeName} ${region}`.toLowerCase();

  for (const [key, coords] of Object.entries(REGION_COORDINATES)) {
    if (searchTerms.includes(key)) {
      console.log(`[PlaceResearch] Using fallback coordinates for ${key}`);
      return coords;
    }
  }

  return null;
}

/**
 * Get coordinates for a place using Nominatim
 */
async function getPlaceCoordinates(
  placeName: string,
  region: string,
  existingCoords?: Coords
): Promise<Coords> {
  // Use existing coordinates if available and valid
  if (existingCoords && existingCoords.lat !== 0 && existingCoords.lng !== 0) {
    return existingCoords;
  }

  try {
    // Use geocodePlace which has Photon → Nominatim fallback (avoids CORS issues)
    const result = await geocodePlace(`${placeName}, ${region}`);
    if (result.places.length > 0 && result.places[0].coordinates) {
      const coords = result.places[0].coordinates;
      console.log(`[PlaceResearch] Geocoded ${placeName} via ${result.source}: ${coords.lat}, ${coords.lng}`);
      return coords;
    }

    // Try with just the place name if region search failed
    const fallbackResult = await geocodePlace(placeName);
    if (fallbackResult.places.length > 0 && fallbackResult.places[0].coordinates) {
      const coords = fallbackResult.places[0].coordinates;
      console.log(`[PlaceResearch] Geocoded ${placeName} (no region) via ${fallbackResult.source}: ${coords.lat}, ${coords.lng}`);
      return coords;
    }
  } catch (error) {
    console.warn(`[PlaceResearch] Geocoding failed for ${placeName}:`, error);
  }

  // Try to get fallback coordinates based on place/region name
  const fallback = getFallbackCoordinates(placeName, region);
  if (fallback) {
    return fallback;
  }

  // Last resort - return null-island indicator so we know geocoding failed
  console.warn(`[PlaceResearch] No coordinates found for ${placeName}, using India center`);
  return { lat: 20.5937, lng: 78.9629 }; // Center of India
}

/**
 * Find nearby restaurants for a place
 */
async function findNearbyRestaurants(
  placeName: string,
  placeCoords: Coords,
  region: string,
  extractedNames: string[]
): Promise<NearbyPlace[]> {
  const nearbyPlaces: NearbyPlace[] = [];

  // First, try to geocode restaurants mentioned in search results
  for (const name of extractedNames.slice(0, 3)) {
    try {
      const geoResult = await geocodePlace(`${name}, ${region}`);
      if (geoResult.places.length > 0 && geoResult.places[0].coordinates) {
        const coords = geoResult.places[0].coordinates;
        const distance = haversineDistance(
          placeCoords.lat,
          placeCoords.lng,
          coords.lat,
          coords.lng
        );

        // Only include if reasonably close (< 10km)
        if (distance < 10) {
          nearbyPlaces.push({
            name,
            type: 'restaurant',
            distance: Math.round(distance * 10) / 10,
            coordinates: coords,
            rating: 4.0, // Default rating
          });
        }
      }
    } catch (error) {
      console.warn(`[PlaceResearch] Failed to geocode restaurant ${name}:`, error);
    }

    // Rate limit
    await new Promise(r => setTimeout(r, 500));
  }

  // If we couldn't find any, do a dedicated search
  if (nearbyPlaces.length === 0) {
    try {
      const foodResults = await searchNearbyFood(placeName, region);
      // Extract restaurant names from search results and try to geocode
      for (const result of foodResults.slice(0, 2)) {
        // Extract potential restaurant name from snippet
        const nameMatch = result.snippet.match(/^([^,.-]+)/);
        if (nameMatch) {
          const restaurantName = nameMatch[1].trim();
          if (restaurantName.length > 3 && restaurantName.length < 50) {
            nearbyPlaces.push({
              name: restaurantName,
              type: 'restaurant',
              distance: 1.5, // Estimated
              coordinates: { lat: placeCoords.lat + 0.005, lng: placeCoords.lng + 0.005 },
              rating: 4.0,
            });
          }
        }
      }
    } catch (error) {
      console.warn('[PlaceResearch] Nearby food search failed:', error);
    }
  }

  return nearbyPlaces.slice(0, 3);
}

/**
 * Research a single place and build comprehensive knowledge
 */
export async function researchSinglePlace(
  place: ExtractedPlace,
  region: string
): Promise<PlaceKnowledge> {
  const placeName = place.name;
  const placeType = mapToPlaceCategory(place);

  console.log(`[PlaceResearch] Researching: ${placeName}`);

  // 1. Web search for place information
  const searchResults = await searchPlace(placeName, region, ['opening hours', 'best time', 'entry fee']);

  // 2. Get coordinates
  const coordinates = await getPlaceCoordinates(placeName, region, place.coordinates);

  // 3. Extract structured info using LLM
  const snippets = searchResults.results.map(r => r.snippet);
  const extractedInfo = await extractPlaceInfoWithLLM(placeName, snippets, region);

  // 4. Find nearby restaurants
  const nearbyRestaurants = await findNearbyRestaurants(
    placeName,
    coordinates,
    region,
    extractedInfo.nearbyRestaurantNames
  );

  // 5. Build the complete PlaceKnowledge object
  const knowledge: PlaceKnowledge = {
    name: placeName,
    type: placeType,
    coordinates,

    // From extraction
    description: extractedInfo.description,
    rating: extractedInfo.rating ?? 4.0,
    reviewCount: extractedInfo.reviewCount ?? 0,
    priceLevel: 2, // Default

    // Timing
    openingHours: extractedInfo.openingHours,
    bestTimeToVisit: extractedInfo.bestTimeToVisit || getDefaultBestTime(placeType),
    typicalDuration: extractedInfo.typicalDuration || getDefaultDuration(placeType),
    crowdPeakHours: extractedInfo.crowdPeakHours || ['10:00-12:00', '16:00-18:00'],

    // Nearby
    nearbyRestaurants,
    nearbyAttractions: [], // Could be expanded

    // Logistics
    entryFee: extractedInfo.entryFee,
    parkingAvailable: extractedInfo.parkingAvailable ?? true,
    wheelchairAccessible: extractedInfo.wheelchairAccessible ?? false,

    // Metadata
    sourceUrls: searchResults.results.map(r => r.url).filter(Boolean),
    lastUpdated: new Date().toISOString(),
    researchConfidence: searchResults.results.length > 3 ? 0.8 : 0.5,
    rawSearchSnippets: snippets,
  };

  console.log(`[PlaceResearch] Completed: ${placeName} (${knowledge.typicalDuration}min, ${knowledge.nearbyRestaurants.length} restaurants)`);

  return knowledge;
}

/**
 * Get default duration for a place type
 */
function getDefaultDuration(type: PlaceCategory): number {
  const defaults: Record<PlaceCategory, number> = {
    accommodation: 0,
    beach: 180,
    landmark: 90,
    fort: 120,
    restaurant: 60,
    nightlife: 180,
    activity: 120,
    destination: 90,
  };
  return defaults[type] || 60;
}

/**
 * Get default best time for a place type
 */
function getDefaultBestTime(type: PlaceCategory): string {
  const defaults: Record<PlaceCategory, string> = {
    accommodation: 'Check-in typically after 14:00',
    beach: 'Early morning or late afternoon for fewer crowds',
    landmark: 'Morning for best photos and fewer tourists',
    fort: 'Morning or late afternoon to avoid heat',
    restaurant: 'Lunch: 12:00-14:00, Dinner: 19:00-21:00',
    nightlife: 'After 21:00 when venues come alive',
    activity: 'Morning when energy levels are highest',
    destination: 'Depends on specific activities planned',
  };
  return defaults[type] || 'Morning or afternoon recommended';
}

/**
 * Convert PlaceKnowledge back to ExtractedPlace for compatibility
 */
export function knowledgeToExtractedPlace(knowledge: PlaceKnowledge): ExtractedPlace {
  return {
    name: knowledge.name,
    type: knowledge.type,
    coordinates: knowledge.coordinates,
    confidence: knowledge.researchConfidence,
    raw: knowledge.name,
  };
}

/**
 * Region detection patterns - maps keywords to regions
 */
const REGION_PATTERNS: Record<string, string[]> = {
  'Goa, India': ['goa', 'aguada', 'baga', 'calangute', 'anjuna', 'panjim', 'panaji', 'candolim', 'chapora', 'vagator', 'arambol', 'palolem', 'colva', 'margao'],
  'Coorg, Karnataka, India': ['coorg', 'kodagu', 'madikeri', 'abbey falls', 'raja seat', 'talacauvery', 'dubare', 'nisargadhama'],
  'Mumbai, India': ['mumbai', 'gateway of india', 'marine drive', 'juhu', 'bandra', 'colaba', 'worli'],
  'Delhi, India': ['delhi', 'red fort', 'qutub', 'india gate', 'lotus temple', 'chandni chowk', 'connaught'],
  'Jaipur, India': ['jaipur', 'amber', 'hawa mahal', 'city palace jaipur', 'nahargarh', 'jal mahal'],
  'Kerala, India': ['kerala', 'alleppey', 'munnar', 'thekkady', 'kovalam', 'varkala', 'kochi', 'cochin', 'kumarakom', 'wayanad'],
  'Bangalore, Karnataka, India': ['bangalore', 'bengaluru', 'cubbon', 'lalbagh', 'mg road', 'koramangala', 'indiranagar'],
  'Mysore, Karnataka, India': ['mysore', 'mysuru', 'chamundi', 'mysore palace', 'brindavan gardens'],
  'Ooty, Tamil Nadu, India': ['ooty', 'ootacamund', 'nilgiri', 'botanical garden ooty', 'doddabetta'],
  'Pondicherry, India': ['pondicherry', 'puducherry', 'auroville', 'promenade beach', 'rock beach'],
  'Manali, Himachal Pradesh, India': ['manali', 'solang', 'rohtang', 'old manali', 'hadimba'],
  'Shimla, Himachal Pradesh, India': ['shimla', 'mall road shimla', 'kufri', 'jakhu'],
  'Udaipur, Rajasthan, India': ['udaipur', 'lake pichola', 'city palace udaipur', 'jagmandir'],
  'Agra, India': ['agra', 'taj mahal', 'agra fort', 'fatehpur sikri'],
};

/**
 * Detect the region from a list of places (for auto-detection)
 * Returns the most likely region based on place names
 */
export function detectRegion(places: ExtractedPlace[]): string {
  const placeNames = places.map(p => p.name.toLowerCase()).join(' ');

  // Count matches for each region
  const regionScores: Record<string, number> = {};

  for (const [region, keywords] of Object.entries(REGION_PATTERNS)) {
    let score = 0;
    for (const keyword of keywords) {
      if (placeNames.includes(keyword)) {
        score++;
      }
    }
    if (score > 0) {
      regionScores[region] = score;
    }
  }

  // Find the region with highest score
  let bestRegion = 'India';
  let bestScore = 0;

  for (const [region, score] of Object.entries(regionScores)) {
    if (score > bestScore) {
      bestScore = score;
      bestRegion = region;
    }
  }

  return bestRegion;
}

/**
 * Detect multiple regions from places (for multi-region trips)
 */
export function detectMultipleRegions(places: ExtractedPlace[]): string[] {
  const regions: Set<string> = new Set();

  for (const place of places) {
    const placeName = place.name.toLowerCase();

    for (const [region, keywords] of Object.entries(REGION_PATTERNS)) {
      for (const keyword of keywords) {
        if (placeName.includes(keyword)) {
          regions.add(region);
          break;
        }
      }
    }
  }

  return regions.size > 0 ? Array.from(regions) : ['India'];
}
