// Trip Safety Context Hook
// Provides unified trip context for the Safety Sentinel page
// Pulls data from TripPlanner, Itinerary, and Signal-Cleanse stores

import { useMemo } from 'react';
import { useItineraryStore } from '../stores/itinerary.store';
import { useTripPlannerStore } from '../stores/trip-planner.store';
import type { Coords } from '../services/itinerary/types';

export interface TripPlace {
  id: string;
  name: string;
  type: string;
  coordinates: Coords | null;
  scheduledDay?: number;
  scheduledTime?: string;
}

export interface TripMember {
  id: string;
  name: string;
  avatar: string;
  phoneNumber: string | null;
}

export interface TripSafetyContext {
  // Trip info
  hasActiveTrip: boolean;
  tripName: string;
  destination: string;
  destinationCoordinates: Coords | null;

  // Dates
  startDate: string | null;
  endDate: string | null;
  tripDays: number;

  // Places from itinerary
  places: TripPlace[];
  todayPlaces: TripPlace[];

  // Team members (extracted from chat or manual)
  members: TripMember[];

  // Map center (based on trip destination)
  mapCenter: Coords;

  // Source info
  source: 'trip-planner' | 'signal-cleanse' | 'none';
}

// Default center (Hampi) when no trip is active
const DEFAULT_CENTER: Coords = { lat: 15.335, lng: 76.462 };

// Generate avatar initials from name
function getInitials(name: string): string {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

// Extract members from Signal-Cleanse extraction result
function extractMembersFromChat(extraction: any): TripMember[] {
  const memberNames = new Set<string>();

  // Get names from places mentionedBy
  if (extraction?.places) {
    for (const place of extraction.places) {
      if (place.mentionedBy) {
        for (const name of place.mentionedBy) {
          if (name && name.length > 1 && name.length < 30) {
            memberNames.add(name);
          }
        }
      }
    }
  }

  // Get names from tasks assignees
  if (extraction?.tasks) {
    for (const task of extraction.tasks) {
      if (task.assignee && task.assignee.length > 1) {
        memberNames.add(task.assignee);
      }
    }
  }

  // Get names from decisions decidedBy
  if (extraction?.decisions) {
    for (const decision of extraction.decisions) {
      if (decision.decidedBy && decision.decidedBy.length > 1) {
        memberNames.add(decision.decidedBy);
      }
    }
  }

  return Array.from(memberNames).map((name, idx) => ({
    id: `member-${idx}`,
    name,
    avatar: getInitials(name),
    phoneNumber: null,
  }));
}

// Calculate centroid of multiple coordinates
function calculateCentroid(places: TripPlace[]): Coords | null {
  const validPlaces = places.filter(p => p.coordinates);
  if (validPlaces.length === 0) return null;

  const sum = validPlaces.reduce(
    (acc, p) => ({
      lat: acc.lat + (p.coordinates?.lat || 0),
      lng: acc.lng + (p.coordinates?.lng || 0),
    }),
    { lat: 0, lng: 0 }
  );

  return {
    lat: sum.lat / validPlaces.length,
    lng: sum.lng / validPlaces.length,
  };
}

// Get today's day number in the trip
function getTodayDayNumber(startDate: string | null): number {
  if (!startDate) return 1;

  const start = new Date(startDate);
  const today = new Date();
  const diffTime = today.getTime() - start.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  return Math.max(1, diffDays + 1);
}

export function useTripSafetyContext(): TripSafetyContext {
  // Get data from stores
  const {
    generatedItinerary: itineraryGenerated,
    extractionSource,
  } = useItineraryStore();

  const {
    region,
    regionCoordinates,
    startDate: plannerStartDate,
    endDate: plannerEndDate,
    generatedItinerary: plannerGenerated,
    selectedPlaces,
  } = useTripPlannerStore();

  // Derive the active trip context
  return useMemo(() => {
    // Check Trip Planner first (most recent)
    if (plannerGenerated || (region && selectedPlaces.length > 0)) {
      const itinerary = plannerGenerated;

      // Extract places from itinerary or selected places
      const places: TripPlace[] = itinerary
        ? itinerary.days.flatMap((day, dayIdx) =>
            day.activities
              .filter(a => a.type === 'visit')
              .map(a => ({
                id: a.id,
                name: a.place.name,
                type: a.place.type || 'landmark',
                coordinates: a.place.coordinates || null,
                scheduledDay: dayIdx + 1,
                scheduledTime: a.startTime,
              }))
          )
        : selectedPlaces.map((p, idx) => ({
            id: p.id || `place-${idx}`,
            name: p.name,
            type: p.type || 'landmark',
            coordinates: p.coordinates || null,
          }));

      const todayDay = getTodayDayNumber(plannerStartDate);
      const todayPlaces = places.filter(p => p.scheduledDay === todayDay);

      // Calculate map center
      const center = regionCoordinates || calculateCentroid(places) || DEFAULT_CENTER;

      return {
        hasActiveTrip: true,
        tripName: `${region} Trip`,
        destination: region,
        destinationCoordinates: regionCoordinates,
        startDate: plannerStartDate,
        endDate: plannerEndDate,
        tripDays: itinerary?.days.length || Math.ceil(
          (new Date(plannerEndDate).getTime() - new Date(plannerStartDate).getTime()) / (1000 * 60 * 60 * 24)
        ) + 1,
        places,
        todayPlaces: todayPlaces.length > 0 ? todayPlaces : places.slice(0, 3),
        members: [], // Trip Planner doesn't have members
        mapCenter: center,
        source: 'trip-planner' as const,
      };
    }

    // Check Signal-Cleanse / Itinerary Store
    if (itineraryGenerated || extractionSource) {
      const itinerary = itineraryGenerated;

      // Extract places
      const places: TripPlace[] = itinerary
        ? itinerary.days.flatMap((day, dayIdx) =>
            day.activities
              .filter(a => a.type === 'visit')
              .map(a => ({
                id: a.id,
                name: a.place.name,
                type: a.place.type || 'landmark',
                coordinates: a.place.coordinates || null,
                scheduledDay: dayIdx + 1,
                scheduledTime: a.startTime,
              }))
          )
        : (extractionSource?.places || []).map((p, idx) => ({
            id: `extracted-${idx}`,
            name: p.name,
            type: p.type || 'landmark',
            coordinates: p.coordinates || null,
          }));

      // Extract members from chat
      const members = extractMembersFromChat(extractionSource);

      // Derive destination from extraction
      const destination = extractionSource?.destination ||
        (places[0]?.name ? `${places[0].name} Area` : 'Trip');

      const startDate = extractionSource?.dates?.start || null;
      const endDate = extractionSource?.dates?.end || null;

      const todayDay = getTodayDayNumber(startDate);
      const todayPlaces = places.filter(p => p.scheduledDay === todayDay);

      const center = calculateCentroid(places) || DEFAULT_CENTER;

      return {
        hasActiveTrip: true,
        tripName: `${destination} Trip`,
        destination,
        destinationCoordinates: center,
        startDate,
        endDate,
        tripDays: itinerary?.days.length ||
          (startDate && endDate
            ? Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1
            : 1),
        places,
        todayPlaces: todayPlaces.length > 0 ? todayPlaces : places.slice(0, 3),
        members,
        mapCenter: center,
        source: 'signal-cleanse' as const,
      };
    }

    // No active trip
    return {
      hasActiveTrip: false,
      tripName: 'No Active Trip',
      destination: '',
      destinationCoordinates: null,
      startDate: null,
      endDate: null,
      tripDays: 0,
      places: [],
      todayPlaces: [],
      members: [],
      mapCenter: DEFAULT_CENTER,
      source: 'none' as const,
    };
  }, [
    plannerGenerated,
    region,
    regionCoordinates,
    plannerStartDate,
    plannerEndDate,
    selectedPlaces,
    itineraryGenerated,
    extractionSource,
  ]);
}
