// Itinerary Generator Types
import type { ExtractedPlace, ExtractedDate, ExtractedBudget } from '../ai/types';

// Coordinates type
export interface Coords {
  lat: number;
  lng: number;
}

// Input from Signal-Cleanse extraction
export interface ItineraryInput {
  places: ExtractedPlace[];
  dates: {
    start: string;  // ISO date string "2025-01-24"
    end: string;
  };
  budget: {
    total: number;
    currency: string;
    perPerson: boolean;
  } | null;
  members: string[];
}

// Time slots for scheduling
export type TimeSlot = 'morning' | 'afternoon' | 'evening' | 'night';

// Activity types in itinerary
export type ActivityType = 'visit' | 'meal' | 'travel' | 'rest' | 'checkin' | 'checkout';

// Place types for optimization (extended from extraction)
export type PlaceCategory =
  | 'accommodation'
  | 'beach'
  | 'landmark'
  | 'fort'
  | 'restaurant'
  | 'nightlife'
  | 'activity'
  | 'destination';

// Travel mode options
export type TravelMode = 'bike' | 'car' | 'walk' | 'auto';

// Crowd level indicators
export type CrowdLevel = 'low' | 'medium' | 'high';

// Travel information between places
export interface TravelInfo {
  distance: number;     // km
  duration: number;     // minutes
  mode: TravelMode;
}

// A scheduled activity in the itinerary
export interface ScheduledActivity {
  id: string;
  place: ExtractedPlace;
  day: number;
  timeSlot: TimeSlot;
  startTime: string;    // "09:00"
  endTime: string;      // "11:00"
  duration: number;     // minutes
  type: ActivityType;
  travelFromPrev?: TravelInfo;
  fatigueImpact: number;  // 0-100
  crowdLevel?: CrowdLevel;
  bestTimeReason?: string;  // "Sunset view", "Avoid crowds"
  estimatedCost?: number;
}

// Place recommendation for missing categories
export interface PlaceRecommendation {
  name: string;
  type: PlaceCategory;
  coordinates: Coords;
  distance: number;     // km from center
  reason: string;       // "No restaurant in your plan"
  score: number;        // 0-1 relevance score
  mapUrl?: string;      // OpenStreetMap link
  googleMapsUrl?: string; // Google Maps link
}

// Single day itinerary
export interface DayItinerary {
  day: number;
  date: string;         // ISO date string
  activities: ScheduledActivity[];
  totalFatigue: number;
  totalCost: number;
  travelDistance: number;  // total km traveled
  recommendations: PlaceRecommendation[];
}

// Summary statistics
export interface ItinerarySummary {
  totalDays: number;
  totalCost: number;
  placesVisited: number;
  distanceTraveled: number;  // km
  averageFatiguePerDay: number;
  missingCategories: string[];
}

// Complete generated itinerary
export interface GeneratedItinerary {
  days: DayItinerary[];
  route: Coords[];      // Full route for map polyline
  summary: ItinerarySummary;
  generatedAt: string;  // ISO timestamp
}

// Time preference rules for place types
export interface TimePreference {
  best: TimeSlot[];
  avoid: TimeSlot[];
  reason: string;
}

// Fatigue configuration
export interface FatigueConfig {
  costs: Record<PlaceCategory, number>;
  travelFatiguePer30Min: number;
  dailyBudget: number;
  restRecovery: number;
}

// Route optimization result
export interface OptimizedRoute {
  places: ExtractedPlace[];
  totalDistance: number;
  segments: Array<{
    from: ExtractedPlace;
    to: ExtractedPlace;
    distance: number;
    duration: number;
  }>;
}

// Cluster of places for a day
export interface PlaceCluster {
  places: ExtractedPlace[];
  centroid: Coords;
  totalDistance: number;
}
