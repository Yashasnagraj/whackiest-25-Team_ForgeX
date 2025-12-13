// Demo Simulator for Safety Sentinel
// Provides realistic demo data for hackathon judges

import { HAMPI_CENTER, offsetCoordinate } from './geo-utils';

export interface DemoMember {
  id: string;
  name: string;
  avatar: string;
  location: { lat: number; lng: number };
  accuracy: number;
  battery: number;
  signal: number; // 0-4
  isMoving: boolean;
  lastSeen: Date;
  status: 'safe' | 'warning' | 'danger';
}

// Team ForgeX members with Hampi locations
const INITIAL_MEMBERS: DemoMember[] = [
  {
    id: '1',
    name: 'Yashas',
    avatar: 'YN',
    location: offsetCoordinate(HAMPI_CENTER, 0.0008, 0.0005),
    accuracy: 8,
    battery: 85,
    signal: 4,
    isMoving: false,
    lastSeen: new Date(),
    status: 'safe',
  },
  {
    id: '2',
    name: 'Naveen',
    avatar: 'NP',
    location: offsetCoordinate(HAMPI_CENTER, -0.0005, 0.0008),
    accuracy: 12,
    battery: 67,
    signal: 3,
    isMoving: true,
    lastSeen: new Date(Date.now() - 2 * 60 * 1000), // 2 mins ago
    status: 'safe',
  },
  {
    id: '3',
    name: 'Jeeth',
    avatar: 'JK',
    location: offsetCoordinate(HAMPI_CENTER, 0.001, -0.0008),
    accuracy: 15,
    battery: 45,
    signal: 4,
    isMoving: false,
    lastSeen: new Date(Date.now() - 5 * 60 * 1000), // 5 mins ago
    status: 'safe',
  },
  {
    id: '4',
    name: 'Shrajan',
    avatar: 'SP',
    location: offsetCoordinate(HAMPI_CENTER, -0.0003, -0.0004),
    accuracy: 6,
    battery: 92,
    signal: 4,
    isMoving: true,
    lastSeen: new Date(),
    status: 'safe',
  },
];

/**
 * Generate initial demo members at Hampi
 */
export function generateDemoMembers(): DemoMember[] {
  return INITIAL_MEMBERS.map((m) => ({ ...m, lastSeen: new Date() }));
}

/**
 * Simulation step data for the "Jeeth getting separated" scenario
 */
interface SimulationStep {
  timestamp: number; // ms from start
  memberId: string;
  updates: Partial<DemoMember>;
  alert?: {
    type: 'info' | 'warning' | 'danger';
    title: string;
    message: string;
  };
}

const SEPARATION_SIMULATION: SimulationStep[] = [
  // Step 1: Jeeth starts drifting (2s)
  {
    timestamp: 2000,
    memberId: '3',
    updates: {
      location: offsetCoordinate(HAMPI_CENTER, 0.003, -0.002),
      isMoving: true,
      status: 'safe',
    },
  },
  // Step 2: Jeeth is moving away (4s)
  {
    timestamp: 4000,
    memberId: '3',
    updates: {
      location: offsetCoordinate(HAMPI_CENTER, 0.005, -0.003),
      lastSeen: new Date(Date.now() - 10 * 60 * 1000),
      status: 'warning',
    },
    alert: {
      type: 'warning',
      title: 'Distance Alert',
      message: 'Jeeth is 800m away from the group',
    },
  },
  // Step 3: Jeeth is stationary in remote area (6s)
  {
    timestamp: 6000,
    memberId: '3',
    updates: {
      location: offsetCoordinate(HAMPI_CENTER, 0.007, -0.004),
      lastSeen: new Date(Date.now() - 25 * 60 * 1000),
      battery: 23,
      signal: 1,
      isMoving: false,
      status: 'warning',
    },
    alert: {
      type: 'warning',
      title: 'Stationary Alert',
      message: 'Jeeth has been stationary for 15 minutes in a remote area',
    },
  },
  // Step 4: Critical - Jeeth unreachable (8s)
  {
    timestamp: 8000,
    memberId: '3',
    updates: {
      location: offsetCoordinate(HAMPI_CENTER, 0.008, -0.005),
      lastSeen: new Date(Date.now() - 45 * 60 * 1000),
      battery: 12,
      signal: 0,
      accuracy: 500,
      status: 'danger',
    },
    alert: {
      type: 'danger',
      title: 'CRITICAL: Member Unreachable',
      message:
        'Jeeth has been stationary for 45 minutes with no signal. Last known location: Hemakuta Hill ruins. Immediate check recommended.',
    },
  },
];

export interface SimulationCallbacks {
  onMemberUpdate: (member: DemoMember) => void;
  onAlert: (alert: { type: 'info' | 'warning' | 'danger'; title: string; message: string }) => void;
}

/**
 * Start the demo simulation showing Jeeth getting separated
 * @returns Cleanup function to stop simulation
 */
export function startDemoSimulation(callbacks: SimulationCallbacks): () => void {
  const members = generateDemoMembers();
  let isRunning = true;
  const timeouts: NodeJS.Timeout[] = [];

  // Initial state
  members.forEach((m) => callbacks.onMemberUpdate(m));

  // Schedule simulation steps
  SEPARATION_SIMULATION.forEach((step) => {
    const timeout = setTimeout(() => {
      if (!isRunning) return;

      const memberIndex = members.findIndex((m) => m.id === step.memberId);
      if (memberIndex === -1) return;

      // Apply updates
      members[memberIndex] = {
        ...members[memberIndex],
        ...step.updates,
      };

      callbacks.onMemberUpdate(members[memberIndex]);

      if (step.alert) {
        callbacks.onAlert(step.alert);
      }
    }, step.timestamp);

    timeouts.push(timeout);
  });

  // Return cleanup function
  return () => {
    isRunning = false;
    timeouts.forEach((t) => clearTimeout(t));
  };
}

/**
 * Start continuous random movement simulation (for map demo)
 */
export function startLiveMapSimulation(
  onUpdate: (members: DemoMember[]) => void,
  intervalMs: number = 2000
): () => void {
  const members = generateDemoMembers();
  let isRunning = true;

  // Initial update
  onUpdate([...members]);

  const interval = setInterval(() => {
    if (!isRunning) return;

    // Add small random movements to each member
    members.forEach((member, index) => {
      if (member.isMoving) {
        const jitter = 0.0001;
        member.location = {
          lat: member.location.lat + (Math.random() - 0.5) * jitter,
          lng: member.location.lng + (Math.random() - 0.5) * jitter,
        };
      }

      // Update lastSeen
      member.lastSeen = new Date();

      // Random battery drain
      if (Math.random() > 0.9) {
        member.battery = Math.max(5, member.battery - 1);
      }

      members[index] = { ...member };
    });

    onUpdate([...members]);
  }, intervalMs);

  return () => {
    isRunning = false;
    clearInterval(interval);
  };
}

/**
 * Convert demo members to format compatible with existing SafetySentinel radar
 */
export function convertToRadarFormat(members: DemoMember[]): Array<{
  id: string;
  name: string;
  avatar: string;
  status: 'safe' | 'warning' | 'danger';
  battery: number;
  lastSeen: string;
  location: string;
  isMoving: boolean;
  signal: number;
  angle: number;
  distance: number;
}> {
  const center = HAMPI_CENTER;

  return members.map((member, index) => {
    // Calculate angle and distance for radar display
    const dx = member.location.lng - center.lng;
    const dy = member.location.lat - center.lat;
    const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
    const distance = Math.sqrt(dx * dx + dy * dy) * 100; // Scale for radar

    // Format lastSeen
    const msAgo = Date.now() - member.lastSeen.getTime();
    let lastSeenStr = 'Now';
    if (msAgo > 60000) {
      const mins = Math.floor(msAgo / 60000);
      lastSeenStr = `${mins} min ago`;
    }

    return {
      id: member.id,
      name: member.name,
      avatar: member.avatar,
      status: member.status,
      battery: member.battery,
      lastSeen: lastSeenStr,
      location: getLocationName(member, index),
      isMoving: member.isMoving,
      signal: member.signal,
      angle: angle,
      distance: Math.min(0.9, distance), // Cap at 0.9 for radar
    };
  });
}

/**
 * Get location name based on member position
 */
function getLocationName(member: DemoMember, index: number): string {
  const locations = [
    'Virupaksha Temple',
    'Near Hemakuta Hill',
    'Stone Chariot',
    'Vittala Temple',
  ];

  if (member.status === 'danger') {
    return 'Remote area - Hemakuta';
  }
  if (member.status === 'warning') {
    return 'Moving away from group';
  }

  return locations[index % locations.length];
}
