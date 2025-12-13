// Itinerary Builder - Main orchestration module (V3 with Research Pipeline)
import type { ExtractedPlace } from '../ai/types';
import type {
  ItineraryInput,
  GeneratedItinerary,
  DayItinerary,
  ScheduledActivity,
  Coords,
  PlaceRecommendation,
  ItinerarySummary,
  TravelMode,
} from './types';
import type { PlaceKnowledge, ResearchProgress } from './place-research.types';
import {
  clusterPlacesByProximity,
  optimizeVisitOrder,
  calculateCentroid,
  getPlaceCoords,
  haversineDistance,
  TRAVEL_SPEEDS,
  getDefaultTravelMode,
} from './route-optimizer';
import { assignTimeSlots, mapToPlaceCategory } from './time-optimizer';
import {
  applyFatigueValues,
  insertRestBreaks,
  balanceFatigueAcrossDays,
  adjustFirstDayFatigue,
  calculateDayFatigue,
  DEFAULT_FATIGUE_CONFIG,
} from './fatigue-scheduler';
import {
  getAllRecommendations,
  checkRegionalCoverage,
} from './recommendations';
import { researchPlacesAutoRegion } from './research-pipeline';
import { generateSmartItinerary } from './smart-builder';

/**
 * Calculate number of days between two date strings (inclusive)
 */
function daysBetween(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  // Handle invalid dates
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return 3; // Default to 3 days
  }
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
  return Math.max(1, diffDays + 1); // Include both start and end days
}

/**
 * Generate date string for a specific day number
 */
function getDateForDay(startDate: string, dayNumber: number): string {
  const date = new Date(startDate);
  if (isNaN(date.getTime())) {
    date.setTime(Date.now());
  }
  date.setDate(date.getDate() + dayNumber - 1);
  return date.toISOString().split('T')[0];
}

/**
 * Add minutes to a time string (HH:MM format)
 */
function addMinutesToTime(timeStr: string, minutes: number): string {
  const [hours, mins] = timeStr.split(':').map(Number);
  const totalMins = hours * 60 + mins + minutes;
  const newHours = Math.floor(totalMins / 60) % 24;
  const newMins = totalMins % 60;
  return `${newHours.toString().padStart(2, '0')}:${newMins.toString().padStart(2, '0')}`;
}

/**
 * Calculate travel time between two coordinates
 */
function calculateTravelTime(
  from: Coords,
  to: Coords,
  mode?: TravelMode
): { distance: number; duration: number; mode: TravelMode } {
  const distance = haversineDistance(from.lat, from.lng, to.lat, to.lng);
  const travelMode = mode || getDefaultTravelMode(distance);
  const duration = Math.ceil((distance / TRAVEL_SPEEDS[travelMode]) * 60);
  return { distance, duration, mode: travelMode };
}

/**
 * Add travel segments between consecutive visit activities
 */
function addTravelSegments(activities: ScheduledActivity[]): ScheduledActivity[] {
  if (activities.length < 2) return activities;

  const result: ScheduledActivity[] = [];
  let prevVisit: ScheduledActivity | null = null;

  for (const activity of activities) {
    // Find previous visit with coordinates
    if (activity.type === 'visit') {
      const currentCoords = getPlaceCoords(activity.place);

      if (prevVisit && currentCoords) {
        const prevCoords = getPlaceCoords(prevVisit.place);

        if (prevCoords) {
          const travel = calculateTravelTime(prevCoords, currentCoords);

          // Only add travel if > 5 minutes
          if (travel.duration > 5) {
            const travelStartTime = prevVisit.endTime;
            const travelEndTime = addMinutesToTime(travelStartTime, travel.duration);

            result.push({
              id: `travel-${Math.random().toString(36).substring(2, 9)}`,
              place: {
                name: `Travel to ${activity.place.name}`,
                type: 'travel',
              } as ExtractedPlace,
              day: activity.day,
              timeSlot: activity.timeSlot,
              startTime: travelStartTime,
              endTime: travelEndTime,
              duration: travel.duration,
              type: 'travel',
              fatigueImpact: Math.ceil(travel.duration / 30) * DEFAULT_FATIGUE_CONFIG.travelFatiguePer30Min,
              travelFromPrev: {
                distance: Math.round(travel.distance * 100) / 100,
                duration: travel.duration,
                mode: travel.mode,
              },
            });
          }
        }
      }

      prevVisit = activity;
    }

    result.push(activity);
  }

  return result;
}

/**
 * Calculate total travel distance for a day using actual coordinates
 */
function calculateTravelDistance(activities: ScheduledActivity[]): number {
  let totalDistance = 0;

  // Sum up all travel segment distances
  for (const activity of activities) {
    if (activity.type === 'travel' && activity.travelFromPrev) {
      totalDistance += activity.travelFromPrev.distance;
    }
  }

  // If no travel segments, calculate from visit sequence
  if (totalDistance === 0) {
    const visits = activities.filter(a => a.type === 'visit');
    for (let i = 1; i < visits.length; i++) {
      const fromCoords = getPlaceCoords(visits[i - 1].place);
      const toCoords = getPlaceCoords(visits[i].place);
      if (fromCoords && toCoords) {
        totalDistance += haversineDistance(fromCoords.lat, fromCoords.lng, toCoords.lat, toCoords.lng);
      }
    }
  }

  return Math.round(totalDistance * 100) / 100;
}

/**
 * Fixed cost estimation with proper defaults
 */
function estimateActivityCost(activity: ScheduledActivity, budget: ItineraryInput['budget'], numDays: number): number {
  // Default costs in INR when no budget provided
  const DEFAULT_COSTS: Record<string, number> = {
    accommodation: 2000,
    restaurant: 400,
    meal: 400,
    activity: 1500,
    nightlife: 800,
    beach: 0,
    landmark: 100,
    fort: 100,
    destination: 50,
    travel: 0,
    rest: 0,
  };

  // For travel and rest, always return 0
  if (activity.type === 'travel' || activity.type === 'rest') {
    return 0;
  }

  // For meals
  if (activity.type === 'meal') {
    if (budget) {
      const dailyBudget = budget.total / Math.max(1, numDays);
      return Math.round(dailyBudget * 0.1); // 10% per meal
    }
    return DEFAULT_COSTS.meal;
  }

  // For visits
  const category = mapToPlaceCategory(activity.place);

  if (budget && budget.total > 0) {
    const dailyBudget = budget.total / Math.max(1, numDays);
    const costRatios: Record<string, number> = {
      accommodation: 0.35,
      restaurant: 0.1,
      activity: 0.2,
      nightlife: 0.15,
      beach: 0,
      landmark: 0.05,
      fort: 0.05,
      destination: 0.02,
    };
    const ratio = costRatios[category] ?? 0.05;
    return Math.round(dailyBudget * ratio);
  }

  return DEFAULT_COSTS[category] ?? 0;
}

/**
 * Apply cost estimates to all activities
 */
function applyCostEstimates(
  activities: ScheduledActivity[],
  budget: ItineraryInput['budget'],
  numDays: number
): ScheduledActivity[] {
  return activities.map(a => ({
    ...a,
    estimatedCost: estimateActivityCost(a, budget, numDays),
  }));
}

/**
 * Build route polyline from all places with coordinates
 */
function buildRoutePolyline(days: DayItinerary[]): Coords[] {
  const coords: Coords[] = [];

  for (const day of days) {
    for (const activity of day.activities) {
      if (activity.type === 'visit') {
        const placeCoords = getPlaceCoords(activity.place);
        if (placeCoords) {
          coords.push(placeCoords);
        }
      }
    }
  }

  return coords;
}

/**
 * Calculate total route distance from polyline
 */
function calculateRouteDistance(polyline: Coords[]): number {
  if (polyline.length < 2) return 0;

  let total = 0;
  for (let i = 1; i < polyline.length; i++) {
    total += haversineDistance(
      polyline[i - 1].lat,
      polyline[i - 1].lng,
      polyline[i].lat,
      polyline[i].lng
    );
  }

  return Math.round(total * 100) / 100;
}

/**
 * Enrich recommendations with distances and map links
 */
function enrichRecommendations(
  recommendations: PlaceRecommendation[],
  centroid: Coords
): PlaceRecommendation[] {
  return recommendations.map(rec => {
    const distance = haversineDistance(
      centroid.lat,
      centroid.lng,
      rec.coordinates.lat,
      rec.coordinates.lng
    );

    return {
      ...rec,
      distance: Math.round(distance * 100) / 100,
      mapUrl: `https://www.openstreetmap.org/?mlat=${rec.coordinates.lat}&mlon=${rec.coordinates.lng}&zoom=16`,
      googleMapsUrl: `https://www.google.com/maps/search/?api=1&query=${rec.coordinates.lat},${rec.coordinates.lng}`,
    };
  });
}

/**
 * Distribute places across days more evenly
 */
function distributeAcrossDays(
  places: ExtractedPlace[],
  numDays: number
): ExtractedPlace[][] {
  if (places.length === 0) return Array(numDays).fill([]);
  if (numDays <= 1) return [places];

  // Find accommodation to include in each day
  const accommodation = places.find(p => mapToPlaceCategory(p) === 'accommodation');
  const nonAccommodation = places.filter(p => p !== accommodation);

  // Calculate places per day
  const placesPerDay = Math.max(1, Math.ceil(nonAccommodation.length / numDays));

  const days: ExtractedPlace[][] = [];

  for (let i = 0; i < numDays; i++) {
    const dayPlaces: ExtractedPlace[] = [];

    // Add accommodation to start of each day
    if (accommodation) {
      dayPlaces.push(accommodation);
    }

    // Add portion of non-accommodation places
    const start = i * placesPerDay;
    const end = Math.min(start + placesPerDay, nonAccommodation.length);
    dayPlaces.push(...nonAccommodation.slice(start, end));

    days.push(dayPlaces);
  }

  return days;
}

/**
 * Calculate summary statistics
 */
function calculateSummary(days: DayItinerary[], route: Coords[]): ItinerarySummary {
  const totalDays = days.length;
  const totalCost = days.reduce((sum, d) => sum + (d.totalCost || 0), 0);
  const placesVisited = days.reduce(
    (sum, d) => sum + d.activities.filter(a => a.type === 'visit').length,
    0
  );

  // Calculate distance from route polyline
  const distanceTraveled = calculateRouteDistance(route);

  const totalFatigue = days.reduce((sum, d) => sum + (d.totalFatigue || 0), 0);
  const averageFatiguePerDay = totalDays > 0 ? Math.round(totalFatigue / totalDays) : 0;

  // Collect missing categories
  const allMissingCategories = new Set<string>();
  days.forEach(d => {
    d.recommendations?.forEach(r => {
      if (r.reason?.startsWith('Missing')) {
        allMissingCategories.add(r.type);
      }
    });
  });

  return {
    totalDays,
    totalCost,
    placesVisited,
    distanceTraveled,
    averageFatiguePerDay,
    missingCategories: Array.from(allMissingCategories),
  };
}

/**
 * Main itinerary generator function
 */
export async function generateItinerary(
  input: ItineraryInput
): Promise<GeneratedItinerary> {
  // 1. Calculate number of days from dates
  const numDays = daysBetween(input.dates.start, input.dates.end);

  // 2. Filter places with coordinates
  const geoPlaces = input.places.filter(p => getPlaceCoords(p) !== null);

  // If no geo-places, return empty itinerary with suggestions
  if (geoPlaces.length === 0) {
    const defaultCentroid = { lat: 15.4909, lng: 73.8278 }; // Goa center
    const defaultRecs = getRecommendationsForCategory('beach', defaultCentroid);

    return {
      days: Array(numDays).fill(null).map((_, i) => ({
        day: i + 1,
        date: getDateForDay(input.dates.start, i + 1),
        activities: [],
        totalFatigue: 0,
        totalCost: 0,
        travelDistance: 0,
        recommendations: i === 0 ? enrichRecommendations(defaultRecs, defaultCentroid) : [],
      })),
      route: [],
      summary: {
        totalDays: numDays,
        totalCost: 0,
        placesVisited: 0,
        distanceTraveled: 0,
        averageFatiguePerDay: 0,
        missingCategories: ['accommodation', 'restaurant', 'beach'],
      },
      generatedAt: new Date().toISOString(),
    };
  }

  // 3. Distribute places across days (better than clustering for small sets)
  let dayPlaces: ExtractedPlace[][];

  if (geoPlaces.length <= numDays * 2) {
    // For small number of places, distribute evenly
    dayPlaces = distributeAcrossDays(geoPlaces, numDays);
  } else {
    // For larger sets, use proximity clustering
    const clusters = clusterPlacesByProximity(geoPlaces, numDays);
    dayPlaces = clusters.map(c => c.places);
  }

  // Ensure we have at least numDays arrays
  while (dayPlaces.length < numDays) {
    dayPlaces.push([]);
  }

  // 4. Optimize visit order within each day (TSP)
  const optimizedDays = dayPlaces.map(places => {
    if (places.length === 0) return [];
    const route = optimizeVisitOrder(places);
    return route.places;
  });

  // 5. Assign time slots based on place type
  const scheduledDays: DayItinerary[] = optimizedDays.map((places, i) => {
    const dayNumber = i + 1;
    const activities = places.length > 0 ? assignTimeSlots(places, dayNumber) : [];

    return {
      day: dayNumber,
      date: getDateForDay(input.dates.start, dayNumber),
      activities,
      totalFatigue: 0,
      totalCost: 0,
      travelDistance: 0,
      recommendations: [],
    };
  });

  // 6. Apply fatigue values to activities
  const withFatigue = scheduledDays.map(day => ({
    ...day,
    activities: day.activities.length > 0 ? applyFatigueValues(day.activities) : [],
  }));

  // 7. Insert rest breaks where needed
  const withRest = withFatigue.map(day => ({
    ...day,
    activities: day.activities.length > 0 ? insertRestBreaks(day.activities) : [],
  }));

  // 8. Balance fatigue across days
  const balanced = balanceFatigueAcrossDays(withRest);

  // 9. Adjust first day for arrival fatigue
  const adjusted = adjustFirstDayFatigue(balanced);

  // 10. Add travel segments between activities
  const withTravel = adjusted.map(day => ({
    ...day,
    activities: addTravelSegments(day.activities),
  }));

  // 11. Apply cost estimates
  const withCosts = withTravel.map(day => ({
    ...day,
    activities: applyCostEstimates(day.activities, input.budget, numDays),
  }));

  // 12. Calculate day totals
  const withTotals = withCosts.map(day => ({
    ...day,
    totalFatigue: calculateDayFatigue(day.activities),
    totalCost: day.activities.reduce((sum, a) => sum + (a.estimatedCost ?? 0), 0),
    travelDistance: calculateTravelDistance(day.activities),
  }));

  // 13. Get recommendations for missing categories
  const centroid = calculateCentroid(geoPlaces);
  const { missing, variety } = getAllRecommendations(geoPlaces);
  const regionalCoverage = checkRegionalCoverage(geoPlaces);

  // Enrich recommendations with distances and links
  const enrichedMissing = enrichRecommendations(missing, centroid);
  const enrichedVariety = enrichRecommendations(variety, centroid);
  const allRecs = [...enrichedMissing, ...enrichedVariety];

  // Distribute recommendations across days
  const recsPerDay = Math.max(1, Math.ceil(allRecs.length / numDays));

  const withRecommendations = withTotals.map((day, i) => {
    const dayRecs = allRecs.slice(i * recsPerDay, (i + 1) * recsPerDay);

    // Add regional suggestion to first day if applicable
    if (i === 0 && regionalCoverage.suggestion) {
      const regionalRec: PlaceRecommendation = {
        name: regionalCoverage.hasSouth ? 'North Goa Beaches' : 'South Goa Beaches',
        type: 'beach',
        coordinates: regionalCoverage.hasSouth
          ? { lat: 15.5553, lng: 73.7517 }
          : { lat: 15.0100, lng: 74.0230 },
        distance: 0,
        reason: regionalCoverage.suggestion,
        score: 0.7,
      };
      dayRecs.push(...enrichRecommendations([regionalRec], centroid));
    }

    return {
      ...day,
      recommendations: dayRecs,
    };
  });

  // 14. Build route polyline for map
  const route = buildRoutePolyline(withRecommendations);

  // 15. Calculate summary
  const summary = calculateSummary(withRecommendations, route);

  return {
    days: withRecommendations,
    route,
    summary,
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Quick estimate before full generation
 */
export function estimateItinerary(input: ItineraryInput): {
  numDays: number;
  numPlaces: number;
  hasAccommodation: boolean;
  estimatedDistance: number;
} {
  const numDays = daysBetween(input.dates.start, input.dates.end);
  const geoPlaces = input.places.filter(p => getPlaceCoords(p) !== null);

  const hasAccommodation = geoPlaces.some(
    p => mapToPlaceCategory(p) === 'accommodation'
  );

  // Quick distance estimate
  let estimatedDistance = 0;
  if (geoPlaces.length >= 2) {
    for (let i = 1; i < geoPlaces.length; i++) {
      const from = getPlaceCoords(geoPlaces[i - 1]);
      const to = getPlaceCoords(geoPlaces[i]);
      if (from && to) {
        estimatedDistance += haversineDistance(from.lat, from.lng, to.lat, to.lng);
      }
    }
  }

  return {
    numDays,
    numPlaces: geoPlaces.length,
    hasAccommodation,
    estimatedDistance: Math.round(estimatedDistance * 100) / 100,
  };
}

/**
 * Regenerate a single day while keeping others
 */
export function regenerateDay(
  itinerary: GeneratedItinerary,
  dayNumber: number,
  places: ExtractedPlace[]
): DayItinerary {
  const route = optimizeVisitOrder(places);
  const activities = assignTimeSlots(route.places, dayNumber);
  const withFatigue = applyFatigueValues(activities);
  const withRest = insertRestBreaks(withFatigue);
  const withTravel = addTravelSegments(withRest);

  const existingDay = itinerary.days.find(d => d.day === dayNumber);

  return {
    day: dayNumber,
    date: existingDay?.date || new Date().toISOString().split('T')[0],
    activities: withTravel,
    totalFatigue: calculateDayFatigue(withTravel),
    totalCost: 0,
    travelDistance: calculateTravelDistance(withTravel),
    recommendations: existingDay?.recommendations || [],
  };
}

// ============================================================================
// V3 RESEARCH-FIRST PIPELINE
// ============================================================================

/**
 * Generate itinerary using the new research-first pipeline
 * This is the recommended method for production use
 */
export async function generateItineraryWithResearch(
  input: ItineraryInput,
  onProgress?: (progress: ResearchProgress) => void
): Promise<{
  itinerary: GeneratedItinerary;
  knowledge: PlaceKnowledge[];
}> {
  console.log('[Builder] Starting research-first itinerary generation');

  // 1. Research all places to build knowledge
  const knowledge = await researchPlacesAutoRegion(input.places, onProgress);

  console.log(`[Builder] Research complete, ${knowledge.length} places researched`);

  // 2. Generate smart itinerary using the knowledge
  const itinerary = await generateSmartItinerary(
    knowledge,
    input.dates,
    input.budget,
    input.members
  );

  console.log(`[Builder] Itinerary generated: ${itinerary.days.length} days, ${itinerary.summary.placesVisited} visits`);

  return { itinerary, knowledge };
}

/**
 * Check if we should use research pipeline (based on place count and cache status)
 */
export function shouldUseResearchPipeline(places: ExtractedPlace[]): {
  recommended: boolean;
  reason: string;
  estimatedTime: string;
} {
  const placeCount = places.length;

  if (placeCount === 0) {
    return {
      recommended: false,
      reason: 'No places to research',
      estimatedTime: '0 seconds',
    };
  }

  // Estimate time: ~3 seconds per place for research
  const estimatedSeconds = placeCount * 3;
  const estimatedTime = estimatedSeconds < 60
    ? `${estimatedSeconds} seconds`
    : `${Math.ceil(estimatedSeconds / 60)} minutes`;

  return {
    recommended: true,
    reason: `Research ${placeCount} places for accurate timings, nearby restaurants, and best visit times`,
    estimatedTime,
  };
}

/**
 * Export the PlaceKnowledge type for use in stores/components
 */
export type { PlaceKnowledge, ResearchProgress } from './place-research.types';
