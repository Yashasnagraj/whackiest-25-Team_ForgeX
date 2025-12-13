// SMS Reminder Service for Safety Sentinel
// Simulated for hackathon demo - real Twilio integration would need backend

import { generateGoogleMapsLink } from './geo-utils';

export interface CheckInMessage {
  to: string;
  type: 'check_in' | 'warning' | 'emergency';
  userName: string;
  location?: { lat: number; lng: number };
  mapLink?: string;
}

export interface SMSLog {
  id: string;
  to: string;
  message: string;
  type: 'check_in' | 'warning' | 'emergency';
  timestamp: Date;
  status: 'sent' | 'delivered' | 'failed';
}

export interface ReminderState {
  isActive: boolean;
  phoneNumber: string | null;
  intervalMinutes: number;
  lastCheckIn: Date | null;
  nextCheckIn: Date | null;
  escalationLevel: 0 | 1 | 2 | 3;
  smsLogs: SMSLog[];
}

// Global reminder state (would be in store in production)
let reminderState: ReminderState = {
  isActive: false,
  phoneNumber: null,
  intervalMinutes: 30,
  lastCheckIn: null,
  nextCheckIn: null,
  escalationLevel: 0,
  smsLogs: [],
};

let reminderInterval: NodeJS.Timeout | null = null;
let escalationTimeout: NodeJS.Timeout | null = null;

// Callback for UI updates
type ReminderCallback = (state: ReminderState) => void;
let onStateChange: ReminderCallback | null = null;

/**
 * Get message templates for different escalation levels
 */
function getMessageTemplate(type: 'check_in' | 'warning' | 'emergency', userName: string, mapLink?: string): string {
  switch (type) {
    case 'check_in':
      return `WanderForge Safety Check-In\n\nHey ${userName}! Just checking in. Are you safe?\n\nReply OK to confirm.`;
    case 'warning':
      return `WanderForge ALERT\n\n${userName}, we haven't heard from you. Please respond ASAP!\n\nReply OK if you're safe.\n\n${mapLink ? `Last known location: ${mapLink}` : ''}`;
    case 'emergency':
      return `EMERGENCY SOS - WanderForge\n\n${userName} has not responded to safety check-ins and may be in distress.\n\n${mapLink ? `Last known location: ${mapLink}` : ''}\n\nPlease check on them immediately!`;
    default:
      return '';
  }
}

/**
 * Simulate sending an SMS (would use Twilio in production)
 */
export async function sendCheckIn(message: CheckInMessage): Promise<{ success: boolean; messageId: string }> {
  const mapLink = message.location
    ? generateGoogleMapsLink(message.location.lat, message.location.lng)
    : message.mapLink;

  const messageText = getMessageTemplate(message.type, message.userName, mapLink);

  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  const log: SMSLog = {
    id: `sms-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    to: message.to,
    message: messageText,
    type: message.type,
    timestamp: new Date(),
    status: 'sent',
  };

  reminderState.smsLogs.push(log);

  // Simulate delivery after 1 second
  setTimeout(() => {
    log.status = 'delivered';
    notifyStateChange();
  }, 1000);

  notifyStateChange();

  // Log to console for demo visibility
  console.log(`[SMS ${message.type.toUpperCase()}] To: ${message.to}`);
  console.log(messageText);
  console.log('---');

  return { success: true, messageId: log.id };
}

/**
 * Start reminder loop
 */
export function scheduleReminder(
  phoneNumber: string,
  userName: string,
  intervalMinutes: number = 30,
  callback?: ReminderCallback
): void {
  if (callback) {
    onStateChange = callback;
  }

  // Stop existing reminder
  cancelReminder();

  reminderState = {
    isActive: true,
    phoneNumber,
    intervalMinutes,
    lastCheckIn: null,
    nextCheckIn: new Date(Date.now() + intervalMinutes * 60 * 1000),
    escalationLevel: 0,
    smsLogs: [],
  };

  // Send initial check-in
  sendCheckIn({
    to: phoneNumber,
    type: 'check_in',
    userName,
  });

  reminderState.lastCheckIn = new Date();

  // Schedule next check-in
  reminderInterval = setInterval(() => {
    if (!reminderState.isActive) return;

    reminderState.nextCheckIn = new Date(Date.now() + intervalMinutes * 60 * 1000);
    reminderState.lastCheckIn = new Date();

    sendCheckIn({
      to: phoneNumber,
      type: 'check_in',
      userName,
    });

    notifyStateChange();
  }, intervalMinutes * 60 * 1000);

  notifyStateChange();
}

/**
 * Cancel reminder loop
 */
export function cancelReminder(): void {
  if (reminderInterval) {
    clearInterval(reminderInterval);
    reminderInterval = null;
  }

  if (escalationTimeout) {
    clearTimeout(escalationTimeout);
    escalationTimeout = null;
  }

  reminderState.isActive = false;
  reminderState.nextCheckIn = null;
  notifyStateChange();
}

/**
 * Acknowledge check-in (user responded OK)
 */
export function acknowledgeCheckIn(): void {
  reminderState.escalationLevel = 0;
  reminderState.lastCheckIn = new Date();

  // Reset escalation timeout
  if (escalationTimeout) {
    clearTimeout(escalationTimeout);
    escalationTimeout = null;
  }

  notifyStateChange();
}

/**
 * Trigger escalation (no response from user)
 */
export function triggerEscalation(
  phoneNumber: string,
  userName: string,
  emergencyContacts: Array<{ name: string; phone: string }>,
  location?: { lat: number; lng: number }
): void {
  if (reminderState.escalationLevel >= 3) return;

  reminderState.escalationLevel = Math.min(3, reminderState.escalationLevel + 1) as 0 | 1 | 2 | 3;

  const mapLink = location ? generateGoogleMapsLink(location.lat, location.lng) : undefined;

  switch (reminderState.escalationLevel) {
    case 1:
      // Level 1: Warning to user
      sendCheckIn({
        to: phoneNumber,
        type: 'warning',
        userName,
        mapLink,
      });
      // Schedule next escalation in 5 mins (for demo: 10 seconds)
      escalationTimeout = setTimeout(() => {
        triggerEscalation(phoneNumber, userName, emergencyContacts, location);
      }, 10000);
      break;

    case 2:
      // Level 2: Final warning
      sendCheckIn({
        to: phoneNumber,
        type: 'warning',
        userName,
        mapLink,
      });
      // Schedule Level 3 in 5 mins (for demo: 10 seconds)
      escalationTimeout = setTimeout(() => {
        triggerEscalation(phoneNumber, userName, emergencyContacts, location);
      }, 10000);
      break;

    case 3:
      // Level 3: Notify emergency contacts
      emergencyContacts.forEach((contact) => {
        sendCheckIn({
          to: contact.phone,
          type: 'emergency',
          userName,
          mapLink,
        });
      });
      break;
  }

  notifyStateChange();
}

/**
 * Get current reminder state
 */
export function getReminderState(): ReminderState {
  return { ...reminderState };
}

/**
 * Set callback for state changes
 */
export function setReminderCallback(callback: ReminderCallback): void {
  onStateChange = callback;
}

/**
 * Notify state change to UI
 */
function notifyStateChange(): void {
  if (onStateChange) {
    onStateChange({ ...reminderState });
  }
}

/**
 * Format phone number for display
 */
export function formatPhoneNumber(phone: string): string {
  // Remove all non-digits
  const digits = phone.replace(/\D/g, '');

  // Format as Indian number if 10 digits
  if (digits.length === 10) {
    return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
  }

  // Format with country code
  if (digits.length === 12 && digits.startsWith('91')) {
    return `+${digits.slice(0, 2)} ${digits.slice(2, 7)} ${digits.slice(7)}`;
  }

  return phone;
}

/**
 * Validate phone number
 */
export function isValidPhoneNumber(phone: string): boolean {
  const digits = phone.replace(/\D/g, '');
  return digits.length >= 10 && digits.length <= 15;
}

/**
 * Get escalation level description
 */
export function getEscalationDescription(level: 0 | 1 | 2 | 3): string {
  switch (level) {
    case 0:
      return 'No alerts';
    case 1:
      return 'Check-in requested';
    case 2:
      return 'Final warning sent';
    case 3:
      return 'Emergency contacts notified';
    default:
      return 'Unknown';
  }
}
