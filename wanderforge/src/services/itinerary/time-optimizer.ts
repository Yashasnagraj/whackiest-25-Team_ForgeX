// Time-of-Day Optimizer - Assign best time slots to activities
import type { ExtractedPlace } from '../ai/types';
import type {
  TimeSlot,
  TimePreference,
  PlaceCategory,
  ScheduledActivity,
} from './types';

// Time slot definitions (hours)
export const TIME_SLOTS: Record<TimeSlot, { start: number; end: number }> = {
  morning: { start: 6, end: 12 },
  afternoon: { start: 12, end: 17 },
  evening: { start: 17, end: 21 },
  night: { start: 21, end: 24 },
};

// Default visit durations by place type (minutes)
export const DEFAULT_DURATIONS: Record<PlaceCategory, number> = {
  accommodation: 30,   // Check-in/out
  beach: 120,          // 2 hours
  landmark: 60,        // 1 hour
  fort: 90,            // 1.5 hours (exploring)
  restaurant: 60,      // 1 hour meal
  nightlife: 180,      // 3 hours
  activity: 120,       // 2 hours (water sports, etc.)
  destination: 90,     // Default
};

// Time preferences for each place type
export const PLACE_TIME_PREFERENCES: Record<PlaceCategory, TimePreference> = {
  beach: {
    best: ['evening'],
    avoid: ['afternoon'],
    reason: 'Sunset views, avoid midday heat',
  },
  landmark: {
    best: ['morning'],
    avoid: ['afternoon'],
    reason: 'Morning light for photos, cooler weather',
  },
  fort: {
    best: ['morning', 'evening'],
    avoid: ['afternoon'],
    reason: 'Golden hour lighting, avoid heat',
  },
  restaurant: {
    best: ['afternoon', 'evening'],
    avoid: [],
    reason: 'Standard meal times',
  },
  nightlife: {
    best: ['night'],
    avoid: ['morning', 'afternoon'],
    reason: 'Opens after 9pm',
  },
  accommodation: {
    best: ['evening'],
    avoid: [],
    reason: 'Standard check-in 2-4pm',
  },
  activity: {
    best: ['morning', 'afternoon'],
    avoid: ['night'],
    reason: 'Daylight required for most activities',
  },
  destination: {
    best: ['morning', 'afternoon'],
    avoid: [],
    reason: 'Flexible timing',
  },
};

/**
 * Map place type from extraction to our categories
 */
export function mapToPlaceCategory(place: ExtractedPlace): PlaceCategory {
  const type = place.type?.toLowerCase() || '';
  const name = place.name.toLowerCase();

  // Check name patterns first
  if (name.includes('hostel') || name.includes('hotel') || name.includes('resort') || name.includes('stay')) {
    return 'accommodation';
  }
  if (name.includes('beach')) return 'beach';
  if (name.includes('fort')) return 'fort';
  if (name.includes('temple') || name.includes('church') || name.includes('mosque')) return 'landmark';
  if (name.includes('lane') || name.includes('club') || name.includes('pub') || name.includes('bar')) return 'nightlife';
  if (name.includes('cafe') || name.includes('restaurant') || name.includes('shack') || name.includes('dhaba')) return 'restaurant';

  // Map extraction types
  switch (type) {
    case 'hotel':
    case 'accommodation':
      return 'accommodation';
    case 'beach':
    case 'destination':
      return name.includes('beach') ? 'beach' : 'destination';
    case 'landmark':
      return 'landmark';
    case 'restaurant':
      return 'restaurant';
    case 'activity':
      return 'activity';
    case 'nightlife':
      return 'nightlife';
    default:
      return 'destination';
  }
}

/**
 * Get the best time slot for a place
 */
export function getBestTimeSlot(place: ExtractedPlace): {
  slot: TimeSlot;
  reason: string;
} {
  const category = mapToPlaceCategory(place);
  const pref = PLACE_TIME_PREFERENCES[category];

  return {
    slot: pref.best[0] || 'morning',
    reason: pref.reason,
  };
}

/**
 * Calculate start time for a slot
 */
function _getSlotStartTime(slot: TimeSlot, offset: number = 0): string {
  const slotDef = TIME_SLOTS[slot];
  const hours = slotDef.start + offset;
  return `${hours.toString().padStart(2, '0')}:00`;
}

/**
 * Format time from hours to string
 */
function formatTime(hours: number): string {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

/**
 * Generate unique ID
 */
function generateId(): string {
  return Math.random().toString(36).substring(2, 9);
}

/**
 * Assign time slots to places for a single day
 */
export function assignTimeSlots(
  places: ExtractedPlace[],
  dayNumber: number,
  _travelTimes: number[] = []
): ScheduledActivity[] {
  const activities: ScheduledActivity[] = [];

  // Separate by time preference
  const morningPlaces: ExtractedPlace[] = [];
  const afternoonPlaces: ExtractedPlace[] = [];
  const eveningPlaces: ExtractedPlace[] = [];
  const nightPlaces: ExtractedPlace[] = [];
  const accommodation = places.find(p => mapToPlaceCategory(p) === 'accommodation');

  for (const place of places) {
    if (place === accommodation) continue;

    const { slot } = getBestTimeSlot(place);
    switch (slot) {
      case 'morning':
        morningPlaces.push(place);
        break;
      case 'afternoon':
        afternoonPlaces.push(place);
        break;
      case 'evening':
        eveningPlaces.push(place);
        break;
      case 'night':
        nightPlaces.push(place);
        break;
    }
  }

  // Build schedule
  let currentHour = 7; // Start at 7am

  // Morning breakfast slot
  activities.push({
    id: generateId(),
    place: { name: 'Breakfast', type: 'restaurant' } as ExtractedPlace,
    day: dayNumber,
    timeSlot: 'morning',
    startTime: formatTime(currentHour),
    endTime: formatTime(currentHour + 1),
    duration: 60,
    type: 'meal',
    fatigueImpact: 10,
    bestTimeReason: 'Start your day with a good meal',
  });
  currentHour += 1.5;

  // Morning activities (forts, temples)
  for (const place of morningPlaces) {
    const category = mapToPlaceCategory(place);
    const duration = DEFAULT_DURATIONS[category];
    const { reason } = getBestTimeSlot(place);

    activities.push({
      id: generateId(),
      place,
      day: dayNumber,
      timeSlot: 'morning',
      startTime: formatTime(currentHour),
      endTime: formatTime(currentHour + duration / 60),
      duration,
      type: 'visit',
      fatigueImpact: 0, // Will be set by fatigue scheduler
      bestTimeReason: reason,
    });
    currentHour += duration / 60 + 0.5; // Add 30min travel buffer
  }

  // Lunch slot (around 12:30-1:30)
  if (currentHour < 14) {
    const lunchStart = Math.max(currentHour, 12.5);
    activities.push({
      id: generateId(),
      place: { name: 'Lunch', type: 'restaurant' } as ExtractedPlace,
      day: dayNumber,
      timeSlot: 'afternoon',
      startTime: formatTime(lunchStart),
      endTime: formatTime(lunchStart + 1),
      duration: 60,
      type: 'meal',
      fatigueImpact: 10,
      bestTimeReason: 'Midday meal break',
    });
    currentHour = lunchStart + 1.5;
  }

  // Afternoon activities (flexible, or rest if hot)
  for (const place of afternoonPlaces) {
    const category = mapToPlaceCategory(place);
    const duration = DEFAULT_DURATIONS[category];
    const { reason } = getBestTimeSlot(place);

    activities.push({
      id: generateId(),
      place,
      day: dayNumber,
      timeSlot: 'afternoon',
      startTime: formatTime(currentHour),
      endTime: formatTime(currentHour + duration / 60),
      duration,
      type: 'visit',
      fatigueImpact: 0,
      bestTimeReason: reason,
    });
    currentHour += duration / 60 + 0.5;
  }

  // If no afternoon activities, add rest
  if (afternoonPlaces.length === 0 && currentHour < 16) {
    activities.push({
      id: generateId(),
      place: { name: 'Rest at accommodation', type: 'hotel' } as ExtractedPlace,
      day: dayNumber,
      timeSlot: 'afternoon',
      startTime: formatTime(Math.max(currentHour, 14)),
      endTime: formatTime(Math.max(currentHour, 14) + 1.5),
      duration: 90,
      type: 'rest',
      fatigueImpact: -30,
      bestTimeReason: 'Avoid peak afternoon heat',
    });
    currentHour = 16;
  }

  // Evening activities (beaches at sunset)
  for (const place of eveningPlaces) {
    const category = mapToPlaceCategory(place);
    const duration = DEFAULT_DURATIONS[category];
    const { reason } = getBestTimeSlot(place);

    // Beaches should be timed for sunset (around 6pm in Goa)
    const isBeach = category === 'beach';
    const startHour = isBeach ? 17 : Math.max(currentHour, 17);

    activities.push({
      id: generateId(),
      place,
      day: dayNumber,
      timeSlot: 'evening',
      startTime: formatTime(startHour),
      endTime: formatTime(startHour + duration / 60),
      duration,
      type: 'visit',
      fatigueImpact: 0,
      bestTimeReason: isBeach ? 'Catch the sunset!' : reason,
    });
    currentHour = startHour + duration / 60 + 0.5;
  }

  // Dinner slot (around 8pm)
  const dinnerStart = Math.max(currentHour, 19.5);
  activities.push({
    id: generateId(),
    place: { name: 'Dinner', type: 'restaurant' } as ExtractedPlace,
    day: dayNumber,
    timeSlot: 'evening',
    startTime: formatTime(dinnerStart),
    endTime: formatTime(dinnerStart + 1.5),
    duration: 90,
    type: 'meal',
    fatigueImpact: 10,
    bestTimeReason: 'Evening meal',
  });
  currentHour = dinnerStart + 2;

  // Night activities (nightlife)
  for (const place of nightPlaces) {
    const category = mapToPlaceCategory(place);
    const duration = DEFAULT_DURATIONS[category];
    const { reason } = getBestTimeSlot(place);

    activities.push({
      id: generateId(),
      place,
      day: dayNumber,
      timeSlot: 'night',
      startTime: formatTime(Math.max(currentHour, 21)),
      endTime: formatTime(Math.max(currentHour, 21) + duration / 60),
      duration,
      type: 'visit',
      fatigueImpact: 0,
      bestTimeReason: reason,
    });
    currentHour += duration / 60;
  }

  // Sort by start time
  activities.sort((a, b) => {
    const timeA = parseInt(a.startTime.replace(':', ''));
    const timeB = parseInt(b.startTime.replace(':', ''));
    return timeA - timeB;
  });

  return activities;
}

/**
 * Check if a time slot is available for a given activity
 */
export function isSlotAvailable(
  activities: ScheduledActivity[],
  startTime: string,
  duration: number
): boolean {
  const startMinutes = timeToMinutes(startTime);
  const endMinutes = startMinutes + duration;

  for (const activity of activities) {
    const actStart = timeToMinutes(activity.startTime);
    const actEnd = timeToMinutes(activity.endTime);

    // Check for overlap
    if (startMinutes < actEnd && endMinutes > actStart) {
      return false;
    }
  }

  return true;
}

/**
 * Convert time string to minutes since midnight
 */
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}
