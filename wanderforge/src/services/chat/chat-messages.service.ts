// ============================================================
// TRIP CHAT - Messages Service
// CRUD operations for chat messages
// ============================================================

import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import type {
  DbChatMessage,
  DbChatReaction,
  DbChatMember,
  ChatMessage,
  MessageReaction,
  MessageType,
  MediaMetadata,
} from './types';

// ==================== Constants ====================

const MESSAGES_PAGE_SIZE = 50;

// ==================== Message CRUD ====================

/**
 * Send a new message to a group
 */
export async function sendMessage(
  groupId: string,
  senderId: string,
  content: string,
  type: MessageType = 'text',
  parentId?: string,
  mediaUrl?: string,
  mediaMetadata?: MediaMetadata
): Promise<DbChatMessage | null> {
  if (!isSupabaseConfigured() || !supabase) {
    console.error('[ChatMessages] Supabase not configured');
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('chat_messages')
      .insert({
        group_id: groupId,
        sender_id: senderId,
        parent_id: parentId || null,
        content: content,
        message_type: type,
        media_url: mediaUrl || null,
        media_metadata: mediaMetadata || null,
        is_deleted: false,
      })
      .select()
      .single();

    if (error || !data) {
      console.error('[ChatMessages] Failed to send message:', error);
      return null;
    }

    console.log('[ChatMessages] Sent message:', data.id);
    return data as DbChatMessage;
  } catch (error) {
    console.error('[ChatMessages] Error sending message:', error);
    return null;
  }
}

/**
 * Send a system message (e.g., "John joined the group")
 */
export async function sendSystemMessage(
  groupId: string,
  content: string
): Promise<DbChatMessage | null> {
  if (!isSupabaseConfigured() || !supabase) {
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('chat_messages')
      .insert({
        group_id: groupId,
        sender_id: 'system',
        parent_id: null,
        content: content,
        message_type: 'system',
        media_url: null,
        media_metadata: null,
        is_deleted: false,
      })
      .select()
      .single();

    if (error || !data) {
      console.error('[ChatMessages] Failed to send system message:', error);
      return null;
    }

    return data as DbChatMessage;
  } catch (error) {
    console.error('[ChatMessages] Error sending system message:', error);
    return null;
  }
}

/**
 * Edit a message (only by sender)
 */
export async function editMessage(
  messageId: string,
  senderId: string,
  newContent: string
): Promise<boolean> {
  if (!isSupabaseConfigured() || !supabase) {
    return false;
  }

  try {
    const { error } = await supabase
      .from('chat_messages')
      .update({
        content: newContent,
        edited_at: new Date().toISOString(),
      })
      .eq('id', messageId)
      .eq('sender_id', senderId) // Only sender can edit
      .eq('is_deleted', false);

    if (error) {
      console.error('[ChatMessages] Failed to edit message:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('[ChatMessages] Error editing message:', error);
    return false;
  }
}

/**
 * Delete a message (soft delete)
 */
export async function deleteMessage(
  messageId: string,
  senderId: string
): Promise<boolean> {
  if (!isSupabaseConfigured() || !supabase) {
    return false;
  }

  try {
    const { error } = await supabase
      .from('chat_messages')
      .update({
        is_deleted: true,
        content: '[Message deleted]',
      })
      .eq('id', messageId)
      .eq('sender_id', senderId); // Only sender can delete

    if (error) {
      console.error('[ChatMessages] Failed to delete message:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('[ChatMessages] Error deleting message:', error);
    return false;
  }
}

/**
 * Get messages for a group with pagination
 */
export async function getMessages(
  groupId: string,
  limit: number = MESSAGES_PAGE_SIZE,
  beforeId?: string
): Promise<DbChatMessage[]> {
  if (!isSupabaseConfigured() || !supabase) {
    return [];
  }

  try {
    let query = supabase
      .from('chat_messages')
      .select()
      .eq('group_id', groupId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (beforeId) {
      // Get the timestamp of the reference message
      const { data: refMessage } = await supabase
        .from('chat_messages')
        .select('created_at')
        .eq('id', beforeId)
        .single();

      if (refMessage) {
        query = query.lt('created_at', refMessage.created_at);
      }
    }

    const { data, error } = await query;

    if (error || !data) {
      console.error('[ChatMessages] Failed to get messages:', error);
      return [];
    }

    // Return in chronological order
    return (data as DbChatMessage[]).reverse();
  } catch (error) {
    console.error('[ChatMessages] Error getting messages:', error);
    return [];
  }
}

/**
 * Get a single message by ID
 */
export async function getMessageById(messageId: string): Promise<DbChatMessage | null> {
  if (!isSupabaseConfigured() || !supabase) {
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('chat_messages')
      .select()
      .eq('id', messageId)
      .single();

    if (error || !data) {
      return null;
    }

    return data as DbChatMessage;
  } catch (error) {
    console.error('[ChatMessages] Error getting message:', error);
    return null;
  }
}

/**
 * Get all messages for a group (for extraction)
 */
export async function getAllMessages(groupId: string): Promise<DbChatMessage[]> {
  if (!isSupabaseConfigured() || !supabase) {
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('chat_messages')
      .select()
      .eq('group_id', groupId)
      .eq('is_deleted', false)
      .neq('message_type', 'system')
      .order('created_at', { ascending: true });

    if (error || !data) {
      return [];
    }

    return data as DbChatMessage[];
  } catch (error) {
    console.error('[ChatMessages] Error getting all messages:', error);
    return [];
  }
}

// ==================== Reactions ====================

/**
 * Add a reaction to a message
 */
export async function addReaction(
  messageId: string,
  memberId: string,
  emoji: string
): Promise<boolean> {
  if (!isSupabaseConfigured() || !supabase) {
    return false;
  }

  try {
    // Check if already reacted with this emoji
    const { data: existing } = await supabase
      .from('chat_reactions')
      .select('id')
      .eq('message_id', messageId)
      .eq('member_id', memberId)
      .eq('emoji', emoji)
      .single();

    if (existing) {
      // Already reacted, remove it (toggle)
      return removeReaction(messageId, memberId, emoji);
    }

    const { error } = await supabase
      .from('chat_reactions')
      .insert({
        message_id: messageId,
        member_id: memberId,
        emoji: emoji,
      });

    if (error) {
      console.error('[ChatMessages] Failed to add reaction:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('[ChatMessages] Error adding reaction:', error);
    return false;
  }
}

/**
 * Remove a reaction from a message
 */
export async function removeReaction(
  messageId: string,
  memberId: string,
  emoji: string
): Promise<boolean> {
  if (!isSupabaseConfigured() || !supabase) {
    return false;
  }

  try {
    const { error } = await supabase
      .from('chat_reactions')
      .delete()
      .eq('message_id', messageId)
      .eq('member_id', memberId)
      .eq('emoji', emoji);

    if (error) {
      console.error('[ChatMessages] Failed to remove reaction:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('[ChatMessages] Error removing reaction:', error);
    return false;
  }
}

/**
 * Get reactions for a message
 */
export async function getReactions(messageId: string): Promise<DbChatReaction[]> {
  if (!isSupabaseConfigured() || !supabase) {
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('chat_reactions')
      .select()
      .eq('message_id', messageId);

    if (error || !data) {
      return [];
    }

    return data as DbChatReaction[];
  } catch (error) {
    console.error('[ChatMessages] Error getting reactions:', error);
    return [];
  }
}

/**
 * Get reactions for multiple messages (batch)
 */
export async function getReactionsBatch(
  messageIds: string[]
): Promise<Map<string, DbChatReaction[]>> {
  const result = new Map<string, DbChatReaction[]>();

  if (!isSupabaseConfigured() || !supabase || messageIds.length === 0) {
    return result;
  }

  try {
    const { data, error } = await supabase
      .from('chat_reactions')
      .select()
      .in('message_id', messageIds);

    if (error || !data) {
      return result;
    }

    // Group by message ID
    for (const reaction of data as DbChatReaction[]) {
      const existing = result.get(reaction.message_id) || [];
      existing.push(reaction);
      result.set(reaction.message_id, existing);
    }

    return result;
  } catch (error) {
    console.error('[ChatMessages] Error getting reactions batch:', error);
    return result;
  }
}

// ==================== Read Receipts ====================

/**
 * Mark a message as read
 */
export async function markAsRead(
  messageId: string,
  memberId: string
): Promise<boolean> {
  if (!isSupabaseConfigured() || !supabase) {
    return false;
  }

  try {
    // Use upsert to avoid duplicates
    const { error } = await supabase
      .from('chat_read_receipts')
      .upsert(
        {
          message_id: messageId,
          member_id: memberId,
        },
        {
          onConflict: 'message_id,member_id',
          ignoreDuplicates: true,
        }
      );

    if (error) {
      console.error('[ChatMessages] Failed to mark as read:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('[ChatMessages] Error marking as read:', error);
    return false;
  }
}

/**
 * Get read receipts for a message
 */
export async function getReadReceipts(messageId: string): Promise<string[]> {
  if (!isSupabaseConfigured() || !supabase) {
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('chat_read_receipts')
      .select('member_id')
      .eq('message_id', messageId);

    if (error || !data) {
      return [];
    }

    return data.map((r) => r.member_id);
  } catch (error) {
    console.error('[ChatMessages] Error getting read receipts:', error);
    return [];
  }
}

// ==================== Helpers ====================

/**
 * Convert database messages to UI format
 */
export function formatMessages(
  messages: DbChatMessage[],
  members: DbChatMember[],
  reactions: Map<string, DbChatReaction[]>,
  readReceipts: Map<string, string[]>,
  currentMemberId: string
): ChatMessage[] {
  const memberMap = new Map(members.map((m) => [m.id, m]));

  return messages.map((msg) => {
    const sender = memberMap.get(msg.sender_id);
    const msgReactions = reactions.get(msg.id) || [];

    // Group reactions by emoji
    const reactionGroups = new Map<string, { count: number; memberIds: string[] }>();
    for (const r of msgReactions) {
      const existing = reactionGroups.get(r.emoji) || { count: 0, memberIds: [] };
      existing.count++;
      existing.memberIds.push(r.member_id);
      reactionGroups.set(r.emoji, existing);
    }

    const formattedReactions: MessageReaction[] = Array.from(reactionGroups.entries()).map(
      ([emoji, data]) => ({
        emoji,
        count: data.count,
        memberIds: data.memberIds,
        hasReacted: data.memberIds.includes(currentMemberId),
      })
    );

    // Get parent message preview if this is a reply
    let parentPreview: string | null = null;
    if (msg.parent_id) {
      const parent = messages.find((m) => m.id === msg.parent_id);
      if (parent) {
        parentPreview = parent.content.slice(0, 50) + (parent.content.length > 50 ? '...' : '');
      }
    }

    return {
      id: msg.id,
      senderId: msg.sender_id,
      senderName: sender?.name || 'Unknown',
      senderAvatar: sender?.avatar || '??',
      parentId: msg.parent_id,
      parentPreview,
      content: msg.content,
      type: msg.message_type,
      mediaUrl: msg.media_url,
      mediaMetadata: msg.media_metadata,
      reactions: formattedReactions,
      readBy: readReceipts.get(msg.id) || [],
      createdAt: new Date(msg.created_at),
      editedAt: msg.edited_at ? new Date(msg.edited_at) : null,
      isDeleted: msg.is_deleted,
      isOwn: msg.sender_id === currentMemberId,
    };
  });
}

/**
 * Get message count for a group
 */
export async function getMessageCount(groupId: string): Promise<number> {
  if (!isSupabaseConfigured() || !supabase) {
    return 0;
  }

  try {
    const { count, error } = await supabase
      .from('chat_messages')
      .select('*', { count: 'exact', head: true })
      .eq('group_id', groupId)
      .eq('is_deleted', false);

    if (error) {
      return 0;
    }

    return count || 0;
  } catch (error) {
    console.error('[ChatMessages] Error getting message count:', error);
    return 0;
  }
}

/**
 * Get unread count for a member in a group
 */
export async function getUnreadCount(
  groupId: string,
  memberId: string,
  lastReadAt?: string
): Promise<number> {
  if (!isSupabaseConfigured() || !supabase) {
    return 0;
  }

  try {
    let query = supabase
      .from('chat_messages')
      .select('*', { count: 'exact', head: true })
      .eq('group_id', groupId)
      .eq('is_deleted', false)
      .neq('sender_id', memberId);

    if (lastReadAt) {
      query = query.gt('created_at', lastReadAt);
    }

    const { count, error } = await query;

    if (error) {
      return 0;
    }

    return count || 0;
  } catch (error) {
    console.error('[ChatMessages] Error getting unread count:', error);
    return 0;
  }
}
