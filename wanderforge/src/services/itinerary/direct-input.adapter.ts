// Direct Input Adapter
// Converts DirectTripInput to ItineraryInput for use with existing builder

import type { DirectTripInput, PlaceInput } from './direct-input.types';
import type { ItineraryInput, PlaceCategory } from './types';
import type { ExtractedPlace } from '../ai/types';
import { searchPlace as geocodePlace } from '../ai/search/nominatim.service';

/**
 * Map PlaceInput type to ExtractedPlace type
 */
function mapPlaceInputType(type?: string): ExtractedPlace['type'] {
  const typeMap: Record<string, ExtractedPlace['type']> = {
    beach: 'landmark',
    landmark: 'landmark',
    restaurant: 'restaurant',
    accommodation: 'hotel',
    hotel: 'hotel',
    activity: 'activity',
    temple: 'landmark',
    fort: 'landmark',
    nature: 'landmark',
    nightlife: 'activity',
    market: 'activity',
    destination: 'destination',
  };
  return typeMap[type?.toLowerCase() || ''] || 'destination';
}

/**
 * Map PlaceCategory to ExtractedPlace type
 */
function mapCategoryToExtractedType(category?: PlaceCategory): ExtractedPlace['type'] {
  const typeMap: Record<PlaceCategory, ExtractedPlace['type']> = {
    beach: 'landmark',
    landmark: 'landmark',
    restaurant: 'restaurant',
    accommodation: 'hotel',
    activity: 'activity',
    fort: 'landmark',
    nightlife: 'activity',
    destination: 'destination',
  };
  return category ? typeMap[category] || 'destination' : 'destination';
}

/**
 * Convert a PlaceInput to ExtractedPlace format
 */
function convertPlaceInput(place: PlaceInput): ExtractedPlace {
  return {
    name: place.name,
    type: mapPlaceInputType(place.type),
    votes: place.mustVisit ? 3 : 1,
    status: 'confirmed',
    mentionedBy: ['User'],
    coordinates: place.coordinates,
    source: place.suggestedByAI ? 'ai' : 'heuristic',
    confidence: place.confidence || (place.mustVisit ? 95 : 80),
  };
}

/**
 * Convert DirectTripInput to ItineraryInput
 * This allows using the existing itinerary builder with direct user input
 */
export function adaptDirectInputToItinerary(input: DirectTripInput): ItineraryInput {
  // Convert places
  const places: ExtractedPlace[] = input.selectedPlaces.map(convertPlaceInput);

  // Sort places: must-visit first, then by confidence
  places.sort((a, b) => {
    const aVotes = a.votes || 0;
    const bVotes = b.votes || 0;
    if (aVotes !== bVotes) return bVotes - aVotes;
    return (b.confidence || 0) - (a.confidence || 0);
  });

  return {
    places,
    dates: {
      start: input.startDate,
      end: input.endDate,
    },
    budget: {
      total: input.budget.amount,
      currency: input.budget.currency,
      perPerson: input.budget.perPerson,
    },
    members: ['User'], // Single user for direct input
  };
}

/**
 * Enrich places with coordinates from Nominatim
 * Returns the input with geocoded places
 */
export async function enrichPlacesWithCoordinates(
  input: DirectTripInput
): Promise<DirectTripInput> {
  const enrichedPlaces = await Promise.all(
    input.selectedPlaces.map(async (place) => {
      // Skip if already has coordinates
      if (place.coordinates) return place;

      try {
        // Use geocodePlace which has Photon → Nominatim fallback (avoids CORS)
        const result = await geocodePlace(`${place.name}, ${input.region}`);

        if (result.places.length > 0 && result.places[0].coordinates) {
          return {
            ...place,
            coordinates: result.places[0].coordinates,
          };
        }
      } catch (error) {
        console.warn(`Failed to geocode ${place.name}:`, error);
      }

      return place;
    })
  );

  return {
    ...input,
    selectedPlaces: enrichedPlaces,
  };
}

/**
 * Add destination marker to places if region is set
 * This helps the builder understand the general area
 */
export async function addRegionDestination(
  input: DirectTripInput
): Promise<DirectTripInput> {
  if (!input.region || !input.regionCoordinates) {
    // Try to geocode the region using Photon fallback
    try {
      const result = await geocodePlace(input.region);
      if (result.places.length > 0 && result.places[0].coordinates) {
        return {
          ...input,
          regionCoordinates: result.places[0].coordinates,
        };
      }
    } catch (error) {
      console.warn('Failed to geocode region:', error);
    }
  }

  return input;
}

/**
 * Validate that the input has minimum required data
 */
export function validateDirectInput(input: DirectTripInput): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!input.region || input.region.trim().length < 2) {
    errors.push('Please enter a destination region');
  }

  if (!input.startDate) {
    errors.push('Please select a start date');
  }

  if (!input.endDate) {
    errors.push('Please select an end date');
  }

  if (input.startDate && input.endDate) {
    const start = new Date(input.startDate);
    const end = new Date(input.endDate);
    if (end < start) {
      errors.push('End date must be after start date');
    }
  }

  if (input.selectedPlaces.length === 0) {
    errors.push('Please add at least one place to visit');
  }

  if (input.budget.amount <= 0) {
    errors.push('Please enter a valid budget');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Create a minimal DirectTripInput for quick testing
 */
export function createQuickTripInput(
  region: string,
  places: string[],
  days: number = 3
): DirectTripInput {
  const today = new Date();
  const startDate = today.toISOString().split('T')[0];
  const endDate = new Date(today.getTime() + (days - 1) * 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];

  return {
    region,
    startDate,
    endDate,
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
    selectedPlaces: places.map((name, i) => ({
      id: `place_${i}`,
      name,
      mustVisit: i === 0, // First place is must-visit
      suggestedByAI: false,
    })),
  };
}

/**
 * Estimate the number of activities possible per day based on travel mode
 */
export function getActivitiesPerDay(travelMode: DirectTripInput['travelMode']): number {
  switch (travelMode) {
    case 'relaxed':
      return 3;
    case 'moderate':
      return 5;
    case 'packed':
      return 7;
    default:
      return 5;
  }
}

/**
 * Check if user has enough places for the trip duration
 */
export function checkPlaceCoverage(input: DirectTripInput): {
  sufficient: boolean;
  recommended: number;
  current: number;
  message: string;
} {
  const days = Math.ceil(
    (new Date(input.endDate).getTime() - new Date(input.startDate).getTime()) /
      (1000 * 60 * 60 * 24)
  ) + 1;

  const activitiesPerDay = getActivitiesPerDay(input.travelMode);
  const recommended = days * activitiesPerDay;
  const current = input.selectedPlaces.length;

  if (current >= recommended) {
    return {
      sufficient: true,
      recommended,
      current,
      message: `You have enough places for your ${days}-day trip!`,
    };
  }

  const needed = recommended - current;
  return {
    sufficient: false,
    recommended,
    current,
    message: `Consider adding ${needed} more places for a ${input.travelMode} pace trip.`,
  };
}
