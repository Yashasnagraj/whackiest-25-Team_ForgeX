// SOS Service - Handles SOS alerts and email notifications
// Calls backend API to send email notifications when a member breaches the geofence

import type { RealtimeMember } from './realtime-tracker';

// SOS Configuration
export const SOS_CONFIG = {
  GEOFENCE_RADIUS_METERS: 10,  // 10m for testing, increase for production
  COOLDOWN_MS: 60000,          // 1 minute between alerts for same member
  ENABLED: true,
};

// Track which members have been notified (prevent spam)
const breachNotified = new Set<string>();
const lastNotificationTime = new Map<string, number>();

export interface SOSRecipient {
  name: string;
  email: string;
}

export interface SOSAlertPayload {
  memberName: string;
  memberEmail: string | null;
  location: { lat: number; lng: number } | null;
  recipients: SOSRecipient[];
  groupName: string;
}

/**
 * Send SOS alert to all group members
 */
export async function sendSOSAlert(payload: SOSAlertPayload): Promise<boolean> {
  if (!SOS_CONFIG.ENABLED) {
    console.log('[SOS] SOS alerts are disabled');
    return false;
  }

  if (payload.recipients.length === 0) {
    console.log('[SOS] No recipients with email to notify');
    return false;
  }

  console.log('[SOS] Sending alert for', payload.memberName, 'to', payload.recipients.length, 'recipients');

  try {
    const response = await fetch('http://localhost:8080/api/sos/alert', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('[SOS] Failed to send alert:', error);
      return false;
    }

    console.log('[SOS] Alert sent successfully');
    return true;
  } catch (error) {
    console.error('[SOS] Error sending alert:', error);
    return false;
  }
}

/**
 * Check if a member has breached the geofence
 * @param member The member to check
 * @param allMembers All members in the group
 * @returns true if member is outside the geofence radius
 */
export function checkGeofenceBreach(
  member: RealtimeMember,
  allMembers: RealtimeMember[]
): boolean {
  if (!member.location) return false;

  // Need at least one other member with location
  const othersWithLocation = allMembers.filter(
    m => m.id !== member.id && m.location !== null
  );

  if (othersWithLocation.length === 0) return false;

  // Use the already calculated distanceFromGroup
  return member.distanceFromGroup > SOS_CONFIG.GEOFENCE_RADIUS_METERS;
}

/**
 * Check if we should send a notification (cooldown logic)
 */
export function shouldNotify(memberId: string): boolean {
  // Check if already notified and within cooldown
  if (breachNotified.has(memberId)) {
    const lastTime = lastNotificationTime.get(memberId) || 0;
    if (Date.now() - lastTime < SOS_CONFIG.COOLDOWN_MS) {
      return false;
    }
  }
  return true;
}

/**
 * Mark member as notified
 */
export function markNotified(memberId: string): void {
  breachNotified.add(memberId);
  lastNotificationTime.set(memberId, Date.now());
}

/**
 * Clear breach status when member returns to safe zone
 */
export function clearBreachStatus(memberId: string): void {
  breachNotified.delete(memberId);
  lastNotificationTime.delete(memberId);
}

/**
 * Check if member is currently marked as breached
 */
export function isBreached(memberId: string): boolean {
  return breachNotified.has(memberId);
}

/**
 * Trigger SOS alert for a member who breached the geofence
 */
export async function triggerSOSAlert(
  breachedMember: RealtimeMember,
  allMembers: RealtimeMember[],
  groupName: string
): Promise<boolean> {
  // Get recipients (other members with email)
  const recipients: SOSRecipient[] = allMembers
    .filter(m => m.id !== breachedMember.id && m.email)
    .map(m => ({ name: m.name, email: m.email! }));

  if (recipients.length === 0) {
    console.log('[SOS] No recipients with email addresses');
    return false;
  }

  const payload: SOSAlertPayload = {
    memberName: breachedMember.name,
    memberEmail: breachedMember.email,
    location: breachedMember.location,
    recipients,
    groupName,
  };

  return await sendSOSAlert(payload);
}
