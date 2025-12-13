// Safety Sentinel State Management
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { LocationFix } from '../services/safety/location-tracker';
import type { RealtimeMember } from '../services/safety/realtime-tracker';

export interface TrackedMember {
  id: string;
  name: string;
  avatar: string;
  phoneNumber: string | null;

  // Real-time data
  location: { lat: number; lng: number } | null;
  accuracy: number;
  lastSeen: Date;
  battery: number;
  isMoving: boolean;
  signal: number; // 0-4

  // Computed
  status: 'safe' | 'warning' | 'danger';
  riskScore: number;
  distanceFromGroup: number;
}

export interface SafetyAlert {
  id: string;
  type: 'info' | 'warning' | 'danger';
  title: string;
  message: string;
  memberId?: string;
  timestamp: Date;
  acknowledged: boolean;
}

export interface EmergencyContact {
  name: string;
  phone: string;
}

interface SafetyState {
  // Setup
  isSetupComplete: boolean;
  myPhoneNumber: string | null;
  myName: string;
  emergencyContacts: EmergencyContact[];

  // Tracking
  isTracking: boolean;
  myLocation: { lat: number; lng: number } | null;
  members: TrackedMember[];

  // Alerts
  alerts: SafetyAlert[];

  // View mode
  viewMode: 'radar' | 'map' | 'live';

  // Live Tracking (Supabase)
  trackingMode: 'demo' | 'live';
  groupId: string | null;
  groupCode: string | null;
  groupName: string | null;
  myMemberId: string | null;
  liveMembers: RealtimeMember[];

  // SMS Reminder
  isReminderActive: boolean;
  lastCheckIn: Date | null;
  nextCheckIn: Date | null;
  escalationLevel: 0 | 1 | 2 | 3;

  // Actions
  setPhoneNumber: (phone: string) => void;
  setMyName: (name: string) => void;
  addEmergencyContact: (contact: EmergencyContact) => void;
  removeEmergencyContact: (phone: string) => void;
  startTracking: () => void;
  stopTracking: () => void;
  updateMyLocation: (location: LocationFix) => void;
  setMembers: (members: TrackedMember[]) => void;
  updateMember: (memberId: string, updates: Partial<TrackedMember>) => void;
  addAlert: (alert: Omit<SafetyAlert, 'id' | 'timestamp' | 'acknowledged'>) => void;
  acknowledgeAlert: (alertId: string) => void;
  clearAlerts: () => void;
  setViewMode: (mode: 'radar' | 'map' | 'live') => void;
  completeSetup: () => void;
  setReminderActive: (active: boolean) => void;
  updateReminderState: (state: { lastCheckIn?: Date; nextCheckIn?: Date; escalationLevel?: 0 | 1 | 2 | 3 }) => void;

  // Live Tracking Actions
  setTrackingMode: (mode: 'demo' | 'live') => void;
  setGroupSession: (session: {
    groupId: string;
    groupCode: string;
    groupName: string;
    myMemberId: string;
  } | null) => void;
  setLiveMembers: (members: RealtimeMember[]) => void;
  clearGroupSession: () => void;

  reset: () => void;
}

const initialState = {
  isSetupComplete: false,
  myPhoneNumber: null,
  myName: 'Traveler',
  emergencyContacts: [],
  isTracking: false,
  myLocation: null,
  members: [],
  alerts: [],
  viewMode: 'radar' as const,
  // Live tracking
  trackingMode: 'demo' as const,
  groupId: null,
  groupCode: null,
  groupName: null,
  myMemberId: null,
  liveMembers: [] as RealtimeMember[],
  // SMS Reminder
  isReminderActive: false,
  lastCheckIn: null,
  nextCheckIn: null,
  escalationLevel: 0 as const,
};

export const useSafetyStore = create<SafetyState>()(
  persist(
    (set, _get) => ({
      ...initialState,

      setPhoneNumber: (phone) => set({ myPhoneNumber: phone }),

      setMyName: (name) => set({ myName: name }),

      addEmergencyContact: (contact) =>
        set((state) => ({
          emergencyContacts: [...state.emergencyContacts, contact],
        })),

      removeEmergencyContact: (phone) =>
        set((state) => ({
          emergencyContacts: state.emergencyContacts.filter((c) => c.phone !== phone),
        })),

      startTracking: () => set({ isTracking: true }),

      stopTracking: () => set({ isTracking: false }),

      updateMyLocation: (location) =>
        set({
          myLocation: { lat: location.lat, lng: location.lng },
        }),

      setMembers: (members) => set({ members }),

      updateMember: (memberId, updates) =>
        set((state) => ({
          members: state.members.map((m) =>
            m.id === memberId ? { ...m, ...updates } : m
          ),
        })),

      addAlert: (alert) =>
        set((state) => ({
          alerts: [
            {
              ...alert,
              id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
              timestamp: new Date(),
              acknowledged: false,
            },
            ...state.alerts,
          ].slice(0, 50), // Keep max 50 alerts
        })),

      acknowledgeAlert: (alertId) =>
        set((state) => ({
          alerts: state.alerts.map((a) =>
            a.id === alertId ? { ...a, acknowledged: true } : a
          ),
        })),

      clearAlerts: () => set({ alerts: [] }),

      setViewMode: (mode) => set({ viewMode: mode }),

      completeSetup: () => set({ isSetupComplete: true }),

      setReminderActive: (active) => set({ isReminderActive: active }),

      updateReminderState: (state) =>
        set((prev) => ({
          lastCheckIn: state.lastCheckIn ?? prev.lastCheckIn,
          nextCheckIn: state.nextCheckIn ?? prev.nextCheckIn,
          escalationLevel: state.escalationLevel ?? prev.escalationLevel,
        })),

      // Live Tracking Actions
      setTrackingMode: (mode) => set({ trackingMode: mode }),

      setGroupSession: (session) =>
        set(
          session
            ? {
                groupId: session.groupId,
                groupCode: session.groupCode,
                groupName: session.groupName,
                myMemberId: session.myMemberId,
                trackingMode: 'live' as const,
              }
            : {
                groupId: null,
                groupCode: null,
                groupName: null,
                myMemberId: null,
                trackingMode: 'demo' as const,
                liveMembers: [],
              }
        ),

      setLiveMembers: (members) => set({ liveMembers: members }),

      clearGroupSession: () =>
        set({
          groupId: null,
          groupCode: null,
          groupName: null,
          myMemberId: null,
          liveMembers: [],
          trackingMode: 'demo' as const,
        }),

      reset: () => set(initialState),
    }),
    {
      name: 'wanderforge-safety',
      partialize: (state) => ({
        isSetupComplete: state.isSetupComplete,
        myPhoneNumber: state.myPhoneNumber,
        myName: state.myName,
        emergencyContacts: state.emergencyContacts,
        viewMode: state.viewMode,
      }),
    }
  )
);

// Selectors
export const selectIsAnyDanger = (state: SafetyState): boolean =>
  state.members.some((m) => m.status === 'danger');

export const selectIsAnyWarning = (state: SafetyState): boolean =>
  state.members.some((m) => m.status === 'warning');

export const selectUnacknowledgedAlerts = (state: SafetyState): SafetyAlert[] =>
  state.alerts.filter((a) => !a.acknowledged);

export const selectDangerousMembers = (state: SafetyState): TrackedMember[] =>
  state.members.filter((m) => m.status === 'danger');
