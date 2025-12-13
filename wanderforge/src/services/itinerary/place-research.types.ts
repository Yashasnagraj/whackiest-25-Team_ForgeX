// Place Research Types - Rich Knowledge for Intelligent Planning
import type { Coords, PlaceCategory } from './types';

// Nearby place reference (restaurants, attractions)
export interface NearbyPlace {
  name: string;
  type: string;
  distance: number;     // km from main place
  coordinates: Coords;
  rating?: number;
  priceLevel?: 1 | 2 | 3 | 4;
}

// Opening hours structure
export interface OpeningHours {
  open: string;    // "09:00"
  close: string;   // "18:00"
  days: string[];  // ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
}

// Complete knowledge about a place from web research
export interface PlaceKnowledge {
  // Basic identification
  name: string;
  type: PlaceCategory;
  coordinates: Coords;

  // From Web Search - Rich Data
  description: string;           // "Historic Portuguese-era fort with panoramic sea views"
  rating: number;                // 4.5 (1-5 scale)
  reviewCount: number;           // 12,453 reviews
  priceLevel: 1 | 2 | 3 | 4;    // $ to $$$$ (1=budget, 4=luxury)

  // Timing Information
  openingHours: OpeningHours | null;
  bestTimeToVisit: string;       // "Morning for photos, evening for sunset"
  typicalDuration: number;       // minutes (e.g., 90)
  crowdPeakHours: string[];      // ["10:00-12:00", "16:00-18:00"]

  // Nearby Places (discovered during research)
  nearbyRestaurants: NearbyPlace[];
  nearbyAttractions: NearbyPlace[];

  // Logistics
  entryFee: number | null;       // INR (e.g., 50) or null if free
  parkingAvailable: boolean;
  wheelchairAccessible: boolean;

  // Source tracking
  sourceUrls: string[];
  lastUpdated: string;           // ISO timestamp

  // Research metadata
  researchConfidence: number;    // 0-1, how confident we are in the data
  rawSearchSnippets?: string[];  // Original search snippets for debugging
}

// Web search result structure
export interface WebSearchResult {
  title: string;
  url: string;
  snippet: string;
  displayUrl?: string;
}

// Aggregated search results for a place
export interface PlaceSearchResults {
  query: string;
  results: WebSearchResult[];
  totalResults: number;
  searchEngine: 'duckduckgo' | 'brave' | 'serper';
}

// LLM extraction result
export interface ExtractedPlaceInfo {
  description: string;
  rating: number | null;
  reviewCount: number | null;
  bestTimeToVisit: string;
  typicalDuration: number;
  openingHours: OpeningHours | null;
  entryFee: number | null;
  crowdPeakHours: string[];
  nearbyRestaurantNames: string[];
  nearbyAttractionNames: string[];
  parkingAvailable: boolean;
  wheelchairAccessible: boolean;
}

// Research progress callback
export interface ResearchProgress {
  stage: 'searching' | 'extracting' | 'geocoding' | 'findingNearby' | 'complete';
  placeName: string;
  placeIndex: number;
  totalPlaces: number;
  percent: number;
  message: string;
}

// Cache entry structure
export interface PlaceCacheEntry {
  data: PlaceKnowledge;
  timestamp: number;
  version: number;  // For cache invalidation on schema changes
}

// Research options
export interface ResearchOptions {
  region: string;              // e.g., "Goa, India"
  useCache: boolean;           // Default true
  maxNearbyPlaces: number;     // Default 3
  onProgress?: (progress: ResearchProgress) => void;
}

// Default values for places when research fails
export const DEFAULT_PLACE_VALUES: Partial<PlaceKnowledge> = {
  rating: 4.0,
  reviewCount: 0,
  priceLevel: 2,
  typicalDuration: 60,
  crowdPeakHours: ['10:00-12:00', '16:00-18:00'],
  nearbyRestaurants: [],
  nearbyAttractions: [],
  entryFee: null,
  parkingAvailable: true,
  wheelchairAccessible: false,
  researchConfidence: 0.3,
};

// Duration defaults by place type (when research fails)
export const DEFAULT_DURATIONS: Record<PlaceCategory, number> = {
  accommodation: 0,      // Not a "visit"
  beach: 180,           // 3 hours
  landmark: 90,         // 1.5 hours
  fort: 120,            // 2 hours
  restaurant: 60,       // 1 hour
  nightlife: 180,       // 3 hours
  activity: 120,        // 2 hours
  destination: 90,      // 1.5 hours
};

// Best time defaults by place type
export const DEFAULT_BEST_TIMES: Record<PlaceCategory, string> = {
  accommodation: 'Check-in typically after 14:00',
  beach: 'Early morning or late afternoon for fewer crowds and better light',
  landmark: 'Morning for best photos and fewer tourists',
  fort: 'Morning or late afternoon to avoid midday heat',
  restaurant: 'Lunch: 12:00-14:00, Dinner: 19:00-21:00',
  nightlife: 'After 21:00 when venues come alive',
  activity: 'Morning when energy levels are highest',
  destination: 'Depends on specific activities planned',
};
