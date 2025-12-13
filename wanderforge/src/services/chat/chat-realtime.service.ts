// ============================================================
// TRIP CHAT - Real-Time Service
// Supabase Realtime subscriptions for live chat updates
// ============================================================

import { RealtimeChannel } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import type {
  DbChatMessage,
  DbChatMember,
  DbChatReaction,
  ChatSession,
  ChatMember,
  TypingEvent,
} from './types';
import { getGroupMembers } from './chat-groups.service';

// ==================== Session State ====================

let currentSession: ChatSession | null = null;
let messagesChannel: RealtimeChannel | null = null;
let membersChannel: RealtimeChannel | null = null;
let reactionsChannel: RealtimeChannel | null = null;
let typingChannel: RealtimeChannel | null = null;

// Callbacks
let onMessageInsert: ((message: DbChatMessage) => void) | null = null;
let onMessageUpdate: ((message: DbChatMessage) => void) | null = null;
let onMessageDelete: ((messageId: string) => void) | null = null;
let onMemberJoin: ((member: DbChatMember) => void) | null = null;
let onMemberLeave: ((memberId: string) => void) | null = null;
let onReactionChange: ((reaction: DbChatReaction, type: 'add' | 'remove') => void) | null = null;
let onTypingChange: ((event: TypingEvent) => void) | null = null;

// Typing state
let typingTimeout: ReturnType<typeof setTimeout> | null = null;
let isCurrentlyTyping = false;

// ==================== Session Management ====================

/**
 * Start a real-time chat session
 */
export async function startChatSession(
  groupId: string,
  memberId: string,
  groupCode: string,
  groupName: string,
  isAdmin: boolean
): Promise<ChatSession | null> {
  console.log('[ChatRealtime] Starting session for group:', groupCode);

  if (!isSupabaseConfigured() || !supabase) {
    console.error('[ChatRealtime] Supabase not configured');
    return null;
  }

  try {
    // Load existing members
    const dbMembers = await getGroupMembers(groupId);
    const members = new Map<string, ChatMember>();

    for (const m of dbMembers) {
      members.set(m.id, {
        id: m.id,
        name: m.name,
        avatar: m.avatar,
        role: m.role,
        isOnline: true, // Will be updated by presence
        isTyping: false,
        lastSeen: new Date(m.joined_at),
      });
    }

    // Initialize session
    currentSession = {
      groupId,
      groupCode,
      groupName,
      myMemberId: memberId,
      members,
      isAdmin,
    };

    // Subscribe to channels
    await subscribeToMessages(groupId);
    await subscribeToMembers(groupId);
    await subscribeToReactions(groupId);
    await subscribeToTyping(groupId, memberId);

    console.log('[ChatRealtime] Session started with', members.size, 'members');
    return currentSession;
  } catch (error) {
    console.error('[ChatRealtime] Error starting session:', error);
    return null;
  }
}

/**
 * Stop the current chat session
 */
export async function stopChatSession(): Promise<void> {
  console.log('[ChatRealtime] Stopping session');

  // Stop typing indicator
  if (typingTimeout) {
    clearTimeout(typingTimeout);
    typingTimeout = null;
  }

  // Unsubscribe from all channels
  if (messagesChannel) {
    await messagesChannel.unsubscribe();
    messagesChannel = null;
  }

  if (membersChannel) {
    await membersChannel.unsubscribe();
    membersChannel = null;
  }

  if (reactionsChannel) {
    await reactionsChannel.unsubscribe();
    reactionsChannel = null;
  }

  if (typingChannel) {
    await typingChannel.unsubscribe();
    typingChannel = null;
  }

  // Clear session
  currentSession = null;
  onMessageInsert = null;
  onMessageUpdate = null;
  onMessageDelete = null;
  onMemberJoin = null;
  onMemberLeave = null;
  onReactionChange = null;
  onTypingChange = null;
}

/**
 * Get current session
 */
export function getCurrentSession(): ChatSession | null {
  return currentSession;
}

/**
 * Check if in active session
 */
export function isInSession(): boolean {
  return currentSession !== null;
}

// ==================== Channel Subscriptions ====================

/**
 * Subscribe to message changes
 */
async function subscribeToMessages(groupId: string): Promise<void> {
  if (!supabase) return;

  messagesChannel = supabase
    .channel(`chat_messages:${groupId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `group_id=eq.${groupId}`,
      },
      (payload) => {
        console.log('[ChatRealtime] Message INSERT:', payload.new);
        if (onMessageInsert) {
          onMessageInsert(payload.new as DbChatMessage);
        }
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'chat_messages',
        filter: `group_id=eq.${groupId}`,
      },
      (payload) => {
        console.log('[ChatRealtime] Message UPDATE:', payload.new);
        const msg = payload.new as DbChatMessage;
        if (msg.is_deleted && onMessageDelete) {
          onMessageDelete(msg.id);
        } else if (onMessageUpdate) {
          onMessageUpdate(msg);
        }
      }
    )
    .subscribe((status) => {
      console.log('[ChatRealtime] Messages channel status:', status);
    });
}

/**
 * Subscribe to member changes
 */
async function subscribeToMembers(groupId: string): Promise<void> {
  if (!supabase) return;

  membersChannel = supabase
    .channel(`chat_members:${groupId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_members',
        filter: `group_id=eq.${groupId}`,
      },
      (payload) => {
        console.log('[ChatRealtime] Member JOIN:', payload.new);
        const member = payload.new as DbChatMember;
        if (currentSession && !currentSession.members.has(member.id)) {
          currentSession.members.set(member.id, {
            id: member.id,
            name: member.name,
            avatar: member.avatar,
            role: member.role,
            isOnline: true,
            isTyping: false,
            lastSeen: new Date(member.joined_at),
          });
          if (onMemberJoin) {
            onMemberJoin(member);
          }
        }
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'chat_members',
        filter: `group_id=eq.${groupId}`,
      },
      (payload) => {
        console.log('[ChatRealtime] Member UPDATE:', payload.new);
        const member = payload.new as DbChatMember;
        if (!member.is_active && currentSession) {
          currentSession.members.delete(member.id);
          if (onMemberLeave) {
            onMemberLeave(member.id);
          }
        }
      }
    )
    .subscribe((status) => {
      console.log('[ChatRealtime] Members channel status:', status);
    });
}

/**
 * Subscribe to reaction changes
 */
async function subscribeToReactions(groupId: string): Promise<void> {
  if (!supabase) return;

  // We need to join reactions with messages to filter by group
  // For now, we'll subscribe to all reactions and filter client-side
  reactionsChannel = supabase
    .channel(`chat_reactions:${groupId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_reactions',
      },
      (payload) => {
        console.log('[ChatRealtime] Reaction INSERT:', payload.new);
        if (onReactionChange) {
          onReactionChange(payload.new as DbChatReaction, 'add');
        }
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'DELETE',
        schema: 'public',
        table: 'chat_reactions',
      },
      (payload) => {
        console.log('[ChatRealtime] Reaction DELETE:', payload.old);
        if (onReactionChange) {
          onReactionChange(payload.old as DbChatReaction, 'remove');
        }
      }
    )
    .subscribe((status) => {
      console.log('[ChatRealtime] Reactions channel status:', status);
    });
}

/**
 * Subscribe to typing indicators (broadcast channel)
 */
async function subscribeToTyping(groupId: string, myMemberId: string): Promise<void> {
  if (!supabase) return;

  typingChannel = supabase
    .channel(`chat_typing:${groupId}`, {
      config: {
        broadcast: { self: false }, // Don't receive own broadcasts
      },
    })
    .on('broadcast', { event: 'typing' }, (payload) => {
      const event = payload.payload as TypingEvent;
      console.log('[ChatRealtime] Typing event:', event);

      // Update member typing state
      if (currentSession && event.memberId !== myMemberId) {
        const member = currentSession.members.get(event.memberId);
        if (member) {
          member.isTyping = event.isTyping;
        }
        if (onTypingChange) {
          onTypingChange(event);
        }
      }
    })
    .subscribe((status) => {
      console.log('[ChatRealtime] Typing channel status:', status);
    });
}

// ==================== Event Handlers ====================

/**
 * Set message insert handler
 */
export function onMessage(
  insertHandler: (message: DbChatMessage) => void,
  updateHandler?: (message: DbChatMessage) => void,
  deleteHandler?: (messageId: string) => void
): void {
  onMessageInsert = insertHandler;
  onMessageUpdate = updateHandler || null;
  onMessageDelete = deleteHandler || null;
}

/**
 * Set member change handlers
 */
export function onMember(
  joinHandler: (member: DbChatMember) => void,
  leaveHandler: (memberId: string) => void
): void {
  onMemberJoin = joinHandler;
  onMemberLeave = leaveHandler;
}

/**
 * Set reaction change handler
 */
export function onReaction(
  handler: (reaction: DbChatReaction, type: 'add' | 'remove') => void
): void {
  onReactionChange = handler;
}

/**
 * Set typing change handler
 */
export function onTyping(handler: (event: TypingEvent) => void): void {
  onTypingChange = handler;
}

// ==================== Typing Indicator ====================

const TYPING_TIMEOUT = 3000; // 3 seconds

/**
 * Send typing indicator
 */
export async function sendTypingIndicator(isTyping: boolean): Promise<void> {
  if (!typingChannel || !currentSession) return;

  // Clear existing timeout
  if (typingTimeout) {
    clearTimeout(typingTimeout);
    typingTimeout = null;
  }

  // Only send if state changed
  if (isTyping === isCurrentlyTyping) return;
  isCurrentlyTyping = isTyping;

  const member = currentSession.members.get(currentSession.myMemberId);
  if (!member) return;

  const event: TypingEvent = {
    memberId: currentSession.myMemberId,
    memberName: member.name,
    isTyping,
  };

  await typingChannel.send({
    type: 'broadcast',
    event: 'typing',
    payload: event,
  });

  // Auto-stop typing after timeout
  if (isTyping) {
    typingTimeout = setTimeout(() => {
      sendTypingIndicator(false);
    }, TYPING_TIMEOUT);
  }
}

/**
 * Get typing members
 */
export function getTypingMembers(): ChatMember[] {
  if (!currentSession) return [];

  return Array.from(currentSession.members.values()).filter(
    (m) => m.isTyping && m.id !== currentSession!.myMemberId
  );
}

// ==================== Helpers ====================

/**
 * Get all members in session
 */
export function getSessionMembers(): ChatMember[] {
  if (!currentSession) return [];
  return Array.from(currentSession.members.values());
}

/**
 * Get member by ID
 */
export function getSessionMember(memberId: string): ChatMember | null {
  if (!currentSession) return null;
  return currentSession.members.get(memberId) || null;
}

/**
 * Get current member ID
 */
export function getMyMemberId(): string | null {
  return currentSession?.myMemberId || null;
}

/**
 * Get group code
 */
export function getGroupCode(): string | null {
  return currentSession?.groupCode || null;
}

/**
 * Get group name
 */
export function getGroupName(): string | null {
  return currentSession?.groupName || null;
}
