// Risk Scoring Engine for Safety Sentinel
// Based on guardian-sos-free-api-guide.md

export interface RiskFactors {
  silenceMinutes: number;      // Time since last heartbeat
  batteryPercent: number;      // Device battery level
  accuracyMeters: number;      // GPS accuracy
  isRemoteArea: boolean;       // Far from roads/buildings
  isStationary: boolean;       // Not moving for extended time
  isNightTime: boolean;        // Between 9pm-6am
  distanceFromGroup: number;   // Meters from group centroid
}

export interface RiskScore {
  total: number;               // 0-100
  level: 'safe' | 'warning' | 'danger';
  escalationLevel: 0 | 1 | 2 | 3;
  reasoning: string[];
  breakdown: {
    silence: number;
    battery: number;
    accuracy: number;
    remoteArea: number;
    movement: number;
    distance: number;
  };
}

// Risk weights (from guardian-sos guide)
const WEIGHTS = {
  silence: 0.35,
  battery: 0.15,
  accuracy: 0.10,
  remoteArea: 0.10,
  movement: 0.10,
  distance: 0.20,
} as const;

// Thresholds
const SILENCE_WINDOW_MINUTES = 15;
const ALERT_THRESHOLD = 40;
const ESCALATION_THRESHOLD = 75;

/**
 * Compute silence risk score (0-100)
 * Increases as silence duration grows
 */
function computeSilenceScore(silenceMinutes: number): number {
  if (silenceMinutes <= 0) return 0;
  if (silenceMinutes >= SILENCE_WINDOW_MINUTES) return 100;
  return (silenceMinutes / SILENCE_WINDOW_MINUTES) * 100;
}

/**
 * Compute battery risk score (0-100)
 * Higher risk at lower battery levels
 */
function computeBatteryScore(batteryPercent: number): number {
  if (batteryPercent > 30) return 0;
  if (batteryPercent >= 15) return 30;
  if (batteryPercent >= 5) return 80;
  return 100;
}

/**
 * Compute GPS accuracy risk score (0-100)
 * Poor accuracy suggests problems
 */
function computeAccuracyScore(accuracyMeters: number): number {
  if (!accuracyMeters || accuracyMeters <= 15) return 0;
  if (accuracyMeters <= 50) return ((accuracyMeters - 15) / 35) * 50;
  if (accuracyMeters <= 200) return 50 + ((accuracyMeters - 50) / 150) * 30;
  return 100;
}

/**
 * Compute remote area risk score (0-100)
 */
function computeRemoteAreaScore(isRemoteArea: boolean): number {
  return isRemoteArea ? 80 : 0;
}

/**
 * Compute movement risk score (0-100)
 * Stationary in remote area is risky
 */
function computeMovementScore(isStationary: boolean, isRemoteArea: boolean): number {
  if (!isStationary) return 0;
  return isRemoteArea ? 100 : 40;
}

/**
 * Compute distance from group risk score (0-100)
 */
function computeDistanceScore(distanceMeters: number): number {
  if (distanceMeters <= 200) return 0;
  if (distanceMeters <= 500) return ((distanceMeters - 200) / 300) * 50;
  if (distanceMeters <= 1000) return 50 + ((distanceMeters - 500) / 500) * 30;
  return 100;
}

/**
 * Compute time multiplier (night time is riskier)
 */
function computeTimeMultiplier(isNightTime: boolean): number {
  return isNightTime ? 1.2 : 1.0;
}

/**
 * Main risk scoring function
 */
export function computeRiskScore(factors: RiskFactors): RiskScore {
  // Compute individual scores
  const silenceScore = computeSilenceScore(factors.silenceMinutes);
  const batteryScore = computeBatteryScore(factors.batteryPercent);
  const accuracyScore = computeAccuracyScore(factors.accuracyMeters);
  const remoteAreaScore = computeRemoteAreaScore(factors.isRemoteArea);
  const movementScore = computeMovementScore(factors.isStationary, factors.isRemoteArea);
  const distanceScore = computeDistanceScore(factors.distanceFromGroup);

  // Weighted sum
  const rawScore =
    silenceScore * WEIGHTS.silence +
    batteryScore * WEIGHTS.battery +
    accuracyScore * WEIGHTS.accuracy +
    remoteAreaScore * WEIGHTS.remoteArea +
    movementScore * WEIGHTS.movement +
    distanceScore * WEIGHTS.distance;

  // Apply time multiplier
  const timeMultiplier = computeTimeMultiplier(factors.isNightTime);
  const adjustedScore = Math.min(100, rawScore * timeMultiplier);

  // Determine level and escalation
  let level: 'safe' | 'warning' | 'danger';
  let escalationLevel: 0 | 1 | 2 | 3;

  if (adjustedScore >= ESCALATION_THRESHOLD) {
    level = 'danger';
    escalationLevel = 3;
  } else if (adjustedScore >= ALERT_THRESHOLD) {
    level = 'warning';
    escalationLevel = Math.min(2, Math.floor((adjustedScore - ALERT_THRESHOLD) / 17.5) + 1) as 1 | 2;
  } else {
    level = 'safe';
    escalationLevel = 0;
  }

  // Generate reasoning
  const reasoning: string[] = [];
  if (silenceScore > 50) reasoning.push('prolonged silence');
  if (batteryScore > 50) reasoning.push('low battery');
  if (accuracyScore > 50) reasoning.push('poor GPS signal');
  if (remoteAreaScore > 50) reasoning.push('remote location');
  if (movementScore > 50) reasoning.push('stationary');
  if (distanceScore > 50) reasoning.push('separated from group');
  if (factors.isNightTime) reasoning.push('nighttime');

  return {
    total: Math.round(adjustedScore),
    level,
    escalationLevel,
    reasoning,
    breakdown: {
      silence: Math.round(silenceScore),
      battery: Math.round(batteryScore),
      accuracy: Math.round(accuracyScore),
      remoteArea: Math.round(remoteAreaScore),
      movement: Math.round(movementScore),
      distance: Math.round(distanceScore),
    },
  };
}

/**
 * Check if escalation is needed based on current state
 */
export function shouldEscalate(score: RiskScore, currentLevel: number): boolean {
  return score.escalationLevel > currentLevel;
}

/**
 * Get status color based on risk level
 */
export function getRiskStatusColor(level: 'safe' | 'warning' | 'danger'): string {
  switch (level) {
    case 'safe':
      return '#10b981'; // emerald-500
    case 'warning':
      return '#f59e0b'; // amber-500
    case 'danger':
      return '#ef4444'; // red-500
    default:
      return '#6b7280'; // gray-500
  }
}

/**
 * Format risk score for display
 */
export function formatRiskScore(score: RiskScore): string {
  const levelEmoji = {
    safe: '',
    warning: '',
    danger: '',
  };
  return `${levelEmoji[score.level]} Risk: ${score.total}/100 (${score.level.toUpperCase()})`;
}

/**
 * Get escalation message based on level
 */
export function getEscalationMessage(level: 0 | 1 | 2 | 3, memberName: string): string {
  switch (level) {
    case 1:
      return `Check-in request sent to ${memberName}`;
    case 2:
      return `Warning: ${memberName} has not responded. Sending final warning.`;
    case 3:
      return `CRITICAL: ${memberName} is unreachable. Notifying emergency contacts.`;
    default:
      return `${memberName} is safe`;
  }
}

/**
 * Check if it's night time (9 PM - 6 AM)
 */
export function isNightTime(date: Date = new Date()): boolean {
  const hour = date.getHours();
  return hour >= 21 || hour < 6;
}
