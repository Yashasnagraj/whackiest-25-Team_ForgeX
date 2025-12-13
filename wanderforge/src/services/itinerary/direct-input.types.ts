// Direct Trip Input Types - For the new Trip Planner page
// Allows users to plan trips directly without chat extraction

import type { Coords, PlaceCategory } from './types';

/**
 * Budget configuration for the trip
 */
export interface TripBudget {
  amount: number;
  currency: 'INR' | 'USD';
  perPerson: boolean;
}

/**
 * Daily timing preferences
 */
export interface TripTimings {
  wakeUpTime: string;  // HH:MM format, e.g., "08:00"
  sleepTime: string;   // HH:MM format, e.g., "22:00"
  flexibleTimings: boolean;
}

/**
 * A place input by the user or suggested by AI
 */
export interface PlaceInput {
  id: string;
  name: string;
  type?: PlaceCategory;
  coordinates?: Coords;
  description?: string;
  mustVisit: boolean;        // User marked as must-visit
  suggestedByAI: boolean;    // Was this suggested by AI?
  confidence?: number;       // AI confidence score (0-100)
}

/**
 * Predefined interest categories
 */
export const INTEREST_CATEGORIES = [
  'Beach',
  'Adventure',
  'Culture',
  'Food',
  'Nightlife',
  'Nature',
  'History',
  'Shopping',
  'Wellness',
  'Photography',
] as const;

export type InterestCategory = typeof INTEREST_CATEGORIES[number];

/**
 * Travel pace/mode
 */
export type TravelMode = 'relaxed' | 'moderate' | 'packed';

export const TRAVEL_MODE_CONFIG = {
  relaxed: {
    label: 'Relaxed',
    description: '2-3 activities per day, plenty of downtime',
    activitiesPerDay: 3,
    restBreaks: true,
  },
  moderate: {
    label: 'Moderate',
    description: '4-5 activities per day, balanced pace',
    activitiesPerDay: 5,
    restBreaks: true,
  },
  packed: {
    label: 'Packed',
    description: '6+ activities per day, maximize experiences',
    activitiesPerDay: 7,
    restBreaks: false,
  },
} as const;

/**
 * Main input structure for direct trip planning
 */
export interface DirectTripInput {
  // Location
  region: string;
  regionCoordinates?: Coords;

  // Dates
  startDate: string;  // YYYY-MM-DD
  endDate: string;    // YYYY-MM-DD

  // Budget
  budget: TripBudget;

  // Schedule
  timings: TripTimings;
  travelMode: TravelMode;

  // Preferences
  interests: InterestCategory[];
  customInterests: string[];

  // Places
  selectedPlaces: PlaceInput[];
}

/**
 * Region suggestion from AI
 */
export interface RegionSuggestion {
  name: string;
  state?: string;
  country: string;
  description: string;
  popularPlaces: string[];
  bestSeasons: string[];
  typicalDuration: string;  // e.g., "3-5 days"
  coordinates?: Coords;
}

/**
 * Place suggestion from AI (during planning)
 */
export interface PlaceSuggestion {
  id: string;
  name: string;
  type: PlaceCategory;
  reason: string;           // Why this place is suggested
  description?: string;
  coordinates?: Coords;
  distance?: number;        // Distance from region center in km
  confidence: number;       // 0-100
  source: 'web_search' | 'llm_knowledge' | 'popular';
}

/**
 * Missed recommendation (after plan generation)
 */
export interface MissedRecommendation {
  id: string;
  name: string;
  type: PlaceCategory;
  reason: string;           // Why user should consider this
  description: string;
  bestTimeToVisit?: string;
  estimatedDuration?: string;
  coordinates?: Coords;
  distance?: number;        // Distance from planned route
  source: 'web_search' | 'llm_knowledge' | 'gap_analysis';
  status: 'pending' | 'accepted' | 'rejected';
}

/**
 * Stage of the trip planner
 */
export type TripPlannerStage = 'planning' | 'generating' | 'result';

/**
 * Default values for a new trip
 */
export const DEFAULT_TRIP_INPUT: DirectTripInput = {
  region: '',
  startDate: '',
  endDate: '',
  budget: {
    amount: 10000,
    currency: 'INR',
    perPerson: true,
  },
  timings: {
    wakeUpTime: '08:00',
    sleepTime: '22:00',
    flexibleTimings: true,
  },
  travelMode: 'moderate',
  interests: [],
  customInterests: [],
  selectedPlaces: [],
};

/**
 * Calculate number of days from dates
 */
export function calculateTripDays(startDate: string, endDate: string): number {
  if (!startDate || !endDate) return 0;
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return 0;
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(1, diffDays + 1);
}

/**
 * Generate a unique ID for places
 */
export function generatePlaceId(): string {
  return `place_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
