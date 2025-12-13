// ============================================================
// TRIP CHAT - Zustand Store
// State management for real-time group chat with extraction
// ============================================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  ChatMessage,
  ChatMember,
  ChatSession,
  LiveExtractionState,
  DbChatGroup,
} from '../services/chat/types';
import type { ChatExtractionResult } from '../services/ai/types';

// ==================== Types ====================

export interface ChatState {
  // Session State
  isInSession: boolean;
  session: ChatSession | null;

  // UI State
  view: 'setup' | 'chat' | 'extraction';
  isSetupModalOpen: boolean;
  setupMode: 'create' | 'join' | null;

  // Messages
  messages: ChatMessage[];
  isLoadingMessages: boolean;
  hasMoreMessages: boolean;

  // Members
  members: ChatMember[];
  typingMembers: string[]; // Member IDs who are typing

  // Reply
  replyingTo: ChatMessage | null;

  // Extraction
  liveExtraction: LiveExtractionState | null;
  showExtractionPanel: boolean;

  // Recent Groups (for quick rejoin)
  recentGroups: DbChatGroup[];

  // User Info (cached)
  userName: string;

  // Actions - Session
  setSession: (session: ChatSession | null) => void;
  startSession: (session: ChatSession) => void;
  endSession: () => void;

  // Actions - UI
  setView: (view: 'setup' | 'chat' | 'extraction') => void;
  openSetupModal: (mode: 'create' | 'join') => void;
  closeSetupModal: () => void;
  toggleExtractionPanel: () => void;

  // Actions - Messages
  setMessages: (messages: ChatMessage[]) => void;
  addMessage: (message: ChatMessage) => void;
  updateMessage: (messageId: string, updates: Partial<ChatMessage>) => void;
  removeMessage: (messageId: string) => void;
  prependMessages: (messages: ChatMessage[]) => void;
  setLoadingMessages: (loading: boolean) => void;
  setHasMoreMessages: (hasMore: boolean) => void;

  // Actions - Reply
  setReplyingTo: (message: ChatMessage | null) => void;

  // Actions - Members
  setMembers: (members: ChatMember[]) => void;
  updateMember: (memberId: string, updates: Partial<ChatMember>) => void;
  setTypingMembers: (memberIds: string[]) => void;
  addTypingMember: (memberId: string) => void;
  removeTypingMember: (memberId: string) => void;

  // Actions - Extraction
  setLiveExtraction: (extraction: LiveExtractionState | null) => void;
  updateExtraction: (extraction: ChatExtractionResult) => void;
  addRecommendedPlace: (place: { name: string; type: string }) => void;

  // Actions - User
  setUserName: (name: string) => void;

  // Actions - Recent Groups
  addRecentGroup: (group: DbChatGroup) => void;
  removeRecentGroup: (groupId: string) => void;

  // Reset
  reset: () => void;
}

// ==================== Initial State ====================

const initialState = {
  isInSession: false,
  session: null,
  view: 'setup' as const,
  isSetupModalOpen: false,
  setupMode: null,
  messages: [] as ChatMessage[],
  isLoadingMessages: false,
  hasMoreMessages: true,
  members: [] as ChatMember[],
  typingMembers: [] as string[],
  replyingTo: null,
  liveExtraction: null,
  showExtractionPanel: true,
  recentGroups: [] as DbChatGroup[],
  userName: 'Traveler',
};

// ==================== Store ====================

export const useChatStore = create<ChatState>()(
  persist(
    (set, _get) => ({
      ...initialState,

      // Session Actions
      setSession: (session) =>
        set({
          session,
          isInSession: session !== null,
        }),

      startSession: (session) =>
        set({
          session,
          isInSession: true,
          view: 'chat',
          isSetupModalOpen: false,
          setupMode: null,
          messages: [],
          hasMoreMessages: true,
        }),

      endSession: () =>
        set({
          session: null,
          isInSession: false,
          view: 'setup',
          messages: [],
          members: [],
          typingMembers: [],
          replyingTo: null,
          liveExtraction: null,
        }),

      // UI Actions
      setView: (view) => set({ view }),

      openSetupModal: (mode) =>
        set({
          isSetupModalOpen: true,
          setupMode: mode,
        }),

      closeSetupModal: () =>
        set({
          isSetupModalOpen: false,
          setupMode: null,
        }),

      toggleExtractionPanel: () =>
        set((state) => ({
          showExtractionPanel: !state.showExtractionPanel,
        })),

      // Message Actions
      setMessages: (messages) => set({ messages }),

      addMessage: (message) =>
        set((state) => ({
          messages: [...state.messages, message],
        })),

      updateMessage: (messageId, updates) =>
        set((state) => ({
          messages: state.messages.map((m) =>
            m.id === messageId ? { ...m, ...updates } : m
          ),
        })),

      removeMessage: (messageId) =>
        set((state) => ({
          messages: state.messages.filter((m) => m.id !== messageId),
        })),

      prependMessages: (messages) =>
        set((state) => ({
          messages: [...messages, ...state.messages],
        })),

      setLoadingMessages: (loading) => set({ isLoadingMessages: loading }),

      setHasMoreMessages: (hasMore) => set({ hasMoreMessages: hasMore }),

      // Reply Actions
      setReplyingTo: (message) => set({ replyingTo: message }),

      // Member Actions
      setMembers: (members) => set({ members }),

      updateMember: (memberId, updates) =>
        set((state) => ({
          members: state.members.map((m) =>
            m.id === memberId ? { ...m, ...updates } : m
          ),
        })),

      setTypingMembers: (memberIds) => set({ typingMembers: memberIds }),

      addTypingMember: (memberId) =>
        set((state) => ({
          typingMembers: state.typingMembers.includes(memberId)
            ? state.typingMembers
            : [...state.typingMembers, memberId],
        })),

      removeTypingMember: (memberId) =>
        set((state) => ({
          typingMembers: state.typingMembers.filter((id) => id !== memberId),
        })),

      // Extraction Actions
      setLiveExtraction: (extraction) => set({ liveExtraction: extraction }),

      updateExtraction: (extraction) =>
        set((state) => ({
          liveExtraction: state.liveExtraction
            ? {
                ...state.liveExtraction,
                extraction,
                lastExtractedAt: new Date(),
                messagesSinceExtraction: 0,
                isExtracting: false,
              }
            : {
                isExtracting: false,
                lastExtractedAt: new Date(),
                messagesSinceExtraction: 0,
                extraction,
                confidence: 80,
              },
        })),

      addRecommendedPlace: (place) =>
        set((state) => {
          // Map recommendation type to extraction type
          const typeMap: Record<string, 'destination' | 'restaurant' | 'hotel' | 'activity' | 'landmark'> = {
            place: 'destination',
            hotel: 'hotel',
            restaurant: 'restaurant',
            activity: 'activity',
          };

          const newPlace = {
            name: place.name,
            type: typeMap[place.type] || 'destination',
            votes: 1,
            status: 'confirmed' as const,
            mentionedBy: ['AI Recommendation'],
            source: 'ai' as const,
            confidence: 90,
          };

          // If no extraction exists, create one
          if (!state.liveExtraction) {
            return {
              liveExtraction: {
                isExtracting: false,
                lastExtractedAt: new Date(),
                messagesSinceExtraction: 0,
                extraction: {
                  dates: [],
                  budget: null,
                  places: [newPlace],
                  tasks: [],
                  decisions: [],
                  openQuestions: [],
                  stats: {
                    totalMessages: 0,
                    relevantMessages: 0,
                    mediaFiltered: 0,
                    extractedItems: 1,
                    processingTimeMs: 0,
                    providersUsed: [],
                  },
                },
                confidence: 80,
              },
            };
          }

          // If extraction exists, add to places
          const existingPlaces = state.liveExtraction.extraction?.places || [];

          // Check if place already exists
          const exists = existingPlaces.some(
            (p) => p.name.toLowerCase() === place.name.toLowerCase()
          );

          if (exists) {
            return state; // Don't add duplicate
          }

          return {
            liveExtraction: {
              ...state.liveExtraction,
              extraction: state.liveExtraction.extraction
                ? {
                    ...state.liveExtraction.extraction,
                    places: [...existingPlaces, newPlace],
                  }
                : {
                    dates: [],
                    budget: null,
                    places: [newPlace],
                    tasks: [],
                    decisions: [],
                    openQuestions: [],
                    stats: {
                      totalMessages: 0,
                      relevantMessages: 0,
                      mediaFiltered: 0,
                      extractedItems: 1,
                      processingTimeMs: 0,
                      providersUsed: [],
                    },
                  },
            },
          };
        }),

      // User Actions
      setUserName: (name) => set({ userName: name }),

      // Recent Groups Actions
      addRecentGroup: (group) =>
        set((state) => {
          // Remove if already exists, then add to front
          const filtered = state.recentGroups.filter((g) => g.id !== group.id);
          return {
            recentGroups: [group, ...filtered].slice(0, 5), // Keep max 5
          };
        }),

      removeRecentGroup: (groupId) =>
        set((state) => ({
          recentGroups: state.recentGroups.filter((g) => g.id !== groupId),
        })),

      // Reset
      reset: () => set(initialState),
    }),
    {
      name: 'wanderforge-chat',
      partialize: (state) => ({
        userName: state.userName,
        recentGroups: state.recentGroups,
        showExtractionPanel: state.showExtractionPanel,
      }),
    }
  )
);

// ==================== Selectors ====================

export const selectIsTyping = (state: ChatState): boolean =>
  state.typingMembers.length > 0;

export const selectTypingMemberNames = (state: ChatState): string[] => {
  const typingMemberNames: string[] = [];
  for (const memberId of state.typingMembers) {
    const member = state.members.find((m) => m.id === memberId);
    if (member) {
      typingMemberNames.push(member.name);
    }
  }
  return typingMemberNames;
};

export const selectHasExtraction = (state: ChatState): boolean =>
  state.liveExtraction !== null && state.liveExtraction.extraction !== null;

export const selectExtractionSummary = (
  state: ChatState
): {
  dates: number;
  budget: boolean;
  places: number;
  tasks: number;
  decisions: number;
} => {
  const extraction = state.liveExtraction?.extraction;
  if (!extraction) {
    return { dates: 0, budget: false, places: 0, tasks: 0, decisions: 0 };
  }

  return {
    dates: extraction.dates.length,
    budget: extraction.budget !== null,
    places: extraction.places.filter((p) => p.status !== 'rejected').length,
    tasks: extraction.tasks.length,
    decisions: extraction.decisions.filter((d) => d.confirmed).length,
  };
};

export const selectUnreadCount = (state: ChatState): number => {
  if (!state.session) return 0;

  const myMemberId = state.session.myMemberId;
  return state.messages.filter(
    (m) => !m.isOwn && !m.readBy.includes(myMemberId)
  ).length;
};

export const selectOnlineMembers = (state: ChatState): ChatMember[] =>
  state.members.filter((m) => m.isOnline);

export const selectMemberCount = (state: ChatState): number =>
  state.members.length;
