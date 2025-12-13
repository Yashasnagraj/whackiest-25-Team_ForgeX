// Fatigue-Aware Scheduler - Balance activity intensity across days
import type { ExtractedPlace } from '../ai/types';
import type {
  ScheduledActivity,
  DayItinerary,
  FatigueConfig,
} from './types';
import { mapToPlaceCategory } from './time-optimizer';

// Default fatigue configuration
export const DEFAULT_FATIGUE_CONFIG: FatigueConfig = {
  costs: {
    accommodation: -20,  // Recovery
    beach: 20,           // Relaxing
    landmark: 40,        // Walking, exploring
    fort: 50,            // Climbing, walking in heat
    restaurant: 10,      // Restful
    nightlife: 35,       // Fun but tiring (late night)
    activity: 60,        // Water sports, trekking
    destination: 30,     // Default exploration
  },
  travelFatiguePer30Min: 5,
  dailyBudget: 100,
  restRecovery: 25,
};

/**
 * Calculate fatigue impact for a single activity
 */
export function calculateActivityFatigue(
  activity: ScheduledActivity,
  config: FatigueConfig = DEFAULT_FATIGUE_CONFIG
): number {
  // For meals and rest, use fixed values
  if (activity.type === 'meal') return 10;
  if (activity.type === 'rest') return -config.restRecovery;
  if (activity.type === 'travel') {
    const travelTime = activity.duration;
    return Math.ceil(travelTime / 30) * config.travelFatiguePer30Min;
  }

  // For visits, calculate based on place type and duration
  const category = mapToPlaceCategory(activity.place);
  const baseFatigue = config.costs[category] || 30;

  // Scale by duration (base is 60 min)
  const durationFactor = activity.duration / 60;

  return Math.round(baseFatigue * durationFactor);
}

/**
 * Calculate total fatigue for a day
 */
export function calculateDayFatigue(
  activities: ScheduledActivity[],
  config: FatigueConfig = DEFAULT_FATIGUE_CONFIG
): number {
  return activities.reduce((total, activity) => {
    return total + calculateActivityFatigue(activity, config);
  }, 0);
}

/**
 * Apply fatigue values to activities
 */
export function applyFatigueValues(
  activities: ScheduledActivity[],
  config: FatigueConfig = DEFAULT_FATIGUE_CONFIG
): ScheduledActivity[] {
  return activities.map(activity => ({
    ...activity,
    fatigueImpact: calculateActivityFatigue(activity, config),
  }));
}

/**
 * Check if a day exceeds the fatigue budget
 */
export function isDayOverBudget(
  activities: ScheduledActivity[],
  config: FatigueConfig = DEFAULT_FATIGUE_CONFIG
): boolean {
  const totalFatigue = calculateDayFatigue(activities, config);
  return totalFatigue > config.dailyBudget;
}

/**
 * Insert rest breaks when cumulative fatigue gets too high
 */
export function insertRestBreaks(
  activities: ScheduledActivity[],
  config: FatigueConfig = DEFAULT_FATIGUE_CONFIG
): ScheduledActivity[] {
  const result: ScheduledActivity[] = [];
  let cumulativeFatigue = 0;
  const FATIGUE_THRESHOLD = 70; // Insert rest when reaching 70%

  for (const activity of activities) {
    const activityFatigue = calculateActivityFatigue(activity, config);

    // Check if we need a rest break before this activity
    if (cumulativeFatigue >= FATIGUE_THRESHOLD && activity.type === 'visit') {
      // Insert a rest break
      const restActivity: ScheduledActivity = {
        id: Math.random().toString(36).substring(2, 9),
        place: { name: 'Rest Break', type: 'hotel' } as ExtractedPlace,
        day: activity.day,
        timeSlot: activity.timeSlot,
        startTime: activity.startTime, // Will need adjustment
        endTime: activity.startTime,
        duration: 30,
        type: 'rest',
        fatigueImpact: -config.restRecovery,
        bestTimeReason: 'Take a breather to recharge',
      };

      result.push(restActivity);
      cumulativeFatigue -= config.restRecovery;
    }

    result.push({
      ...activity,
      fatigueImpact: activityFatigue,
    });

    cumulativeFatigue += activityFatigue;
  }

  return result;
}

/**
 * Balance fatigue across multiple days
 * Move activities from heavy days to lighter days
 */
export function balanceFatigueAcrossDays(
  days: DayItinerary[],
  config: FatigueConfig = DEFAULT_FATIGUE_CONFIG
): DayItinerary[] {
  if (days.length <= 1) return days;

  const result = [...days];

  // Calculate fatigue for each day
  const dayFatigue = result.map(day => calculateDayFatigue(day.activities, config));

  // Check if any day is significantly over budget
  for (let i = 0; i < result.length; i++) {
    if (dayFatigue[i] > config.dailyBudget) {
      // Find a lighter day to move an activity to
      const lighterDayIdx = dayFatigue.findIndex(
        (f, idx) => idx !== i && f < config.dailyBudget * 0.7
      );

      if (lighterDayIdx !== -1) {
        // Find a moveable activity (visits only, not meals/rest)
        const moveableIdx = result[i].activities.findIndex(
          a => a.type === 'visit' && mapToPlaceCategory(a.place) !== 'nightlife'
        );

        if (moveableIdx !== -1) {
          const activityToMove = result[i].activities.splice(moveableIdx, 1)[0];
          activityToMove.day = lighterDayIdx + 1;

          // Add to lighter day (before last activity)
          const insertIdx = Math.max(0, result[lighterDayIdx].activities.length - 2);
          result[lighterDayIdx].activities.splice(insertIdx, 0, activityToMove);

          // Recalculate fatigue
          dayFatigue[i] = calculateDayFatigue(result[i].activities, config);
          dayFatigue[lighterDayIdx] = calculateDayFatigue(result[lighterDayIdx].activities, config);
        }
      }
    }
  }

  // Update totalFatigue for each day
  return result.map((day, idx) => ({
    ...day,
    totalFatigue: dayFatigue[idx],
  }));
}

/**
 * Get fatigue level description
 */
export function getFatigueLevel(fatigue: number): {
  level: 'light' | 'moderate' | 'heavy' | 'exhausting';
  color: string;
  emoji: string;
} {
  if (fatigue < 50) {
    return { level: 'light', color: 'emerald', emoji: '😊' };
  }
  if (fatigue < 75) {
    return { level: 'moderate', color: 'amber', emoji: '😐' };
  }
  if (fatigue < 100) {
    return { level: 'heavy', color: 'orange', emoji: '😓' };
  }
  return { level: 'exhausting', color: 'red', emoji: '😫' };
}

/**
 * Suggest adjustments for over-budget days
 */
export function suggestAdjustments(
  day: DayItinerary,
  config: FatigueConfig = DEFAULT_FATIGUE_CONFIG
): string[] {
  const suggestions: string[] = [];
  const totalFatigue = calculateDayFatigue(day.activities, config);

  if (totalFatigue > config.dailyBudget) {
    const overBy = totalFatigue - config.dailyBudget;

    // Find high-fatigue activities
    const highFatigueActivities = day.activities
      .filter(a => a.type === 'visit')
      .sort((a, b) => b.fatigueImpact - a.fatigueImpact);

    if (highFatigueActivities.length > 0) {
      const highest = highFatigueActivities[0];
      suggestions.push(
        `Consider shortening or skipping ${highest.place.name} (saves ${highest.fatigueImpact} fatigue)`
      );
    }

    if (overBy > 30) {
      suggestions.push('Add a rest break in the afternoon');
    }

    // Check for consecutive high-intensity activities
    const visits = day.activities.filter(a => a.type === 'visit');
    if (visits.length >= 4) {
      suggestions.push('Consider moving one activity to another day');
    }
  }

  return suggestions;
}

/**
 * First day should be lighter (arrival fatigue)
 */
export function adjustFirstDayFatigue(
  days: DayItinerary[],
  config: FatigueConfig = DEFAULT_FATIGUE_CONFIG
): DayItinerary[] {
  if (days.length === 0) return days;

  const firstDay = days[0];
  const firstDayFatigue = calculateDayFatigue(firstDay.activities, config);

  // First day budget is 70% of normal (arrival fatigue)
  const firstDayBudget = config.dailyBudget * 0.7;

  if (firstDayFatigue > firstDayBudget && days.length > 1) {
    // Move activities to day 2
    const moveableActivities = firstDay.activities.filter(
      a => a.type === 'visit' && a.timeSlot !== 'night'
    );

    if (moveableActivities.length > 0) {
      // Move the highest fatigue activity
      const toMove = moveableActivities.sort((a, b) => b.fatigueImpact - a.fatigueImpact)[0];
      const idx = firstDay.activities.indexOf(toMove);

      if (idx !== -1) {
        firstDay.activities.splice(idx, 1);
        toMove.day = 2;
        days[1].activities.push(toMove);

        // Re-sort day 2 activities
        days[1].activities.sort((a, b) => {
          const timeA = parseInt(a.startTime.replace(':', ''));
          const timeB = parseInt(b.startTime.replace(':', ''));
          return timeA - timeB;
        });
      }
    }
  }

  // Update fatigue totals
  return days.map(day => ({
    ...day,
    totalFatigue: calculateDayFatigue(day.activities, config),
  }));
}
