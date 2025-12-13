// ============================================================
// TRIP CHAT - Group Management Service
// Create, join, and manage chat groups
// ============================================================

import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import type {
  DbChatGroup,
  DbChatMember,
  ChatGroupSettings,
  CreateChatGroupResult,
  JoinChatGroupResult,
} from './types';

// ==================== Constants ====================

const DEVICE_ID_KEY = 'wanderforge_chat_device_id';
const GROUP_CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No confusing chars (0/O, 1/I/L)

const DEFAULT_GROUP_SETTINGS: ChatGroupSettings = {
  allowMediaUpload: true,
  extractionEnabled: true,
  maxMembers: 50,
};

// ==================== Device ID ====================

/**
 * Get or create a persistent device ID for chat
 */
export function getDeviceId(): string {
  let deviceId = localStorage.getItem(DEVICE_ID_KEY);
  if (!deviceId) {
    deviceId = crypto.randomUUID();
    localStorage.setItem(DEVICE_ID_KEY, deviceId);
  }
  return deviceId;
}

// ==================== Group Code ====================

/**
 * Generate a random 6-character group code
 */
export function generateGroupCode(): string {
  let code = '';
  const chars = GROUP_CODE_CHARS;
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

/**
 * Validate group code format
 */
export function isValidGroupCode(code: string): boolean {
  return /^[A-Z0-9]{6}$/i.test(code);
}

// ==================== Group Management ====================

/**
 * Create a new chat group
 */
export async function createChatGroup(
  groupName: string,
  userName: string,
  userId?: string
): Promise<CreateChatGroupResult | null> {
  if (!isSupabaseConfigured() || !supabase) {
    console.error('[ChatGroups] Supabase not configured');
    return null;
  }

  const deviceId = getDeviceId();
  const groupCode = generateGroupCode();
  const memberId = crypto.randomUUID();
  const avatar = userName.substring(0, 2).toUpperCase();

  try {
    // Create the group
    const { data: group, error: groupError } = await supabase
      .from('chat_groups')
      .insert({
        code: groupCode,
        name: groupName,
        creator_id: memberId,
        is_active: true,
        settings: DEFAULT_GROUP_SETTINGS,
      })
      .select()
      .single();

    if (groupError || !group) {
      console.error('[ChatGroups] Failed to create group:', groupError);
      return null;
    }

    // Add creator as first member (admin)
    const { data: member, error: memberError } = await supabase
      .from('chat_members')
      .insert({
        id: memberId,
        group_id: group.id,
        device_id: deviceId,
        user_id: userId || null,
        name: userName,
        avatar: avatar,
        role: 'admin',
        is_active: true,
      })
      .select()
      .single();

    if (memberError || !member) {
      console.error('[ChatGroups] Failed to add member:', memberError);
      // Cleanup: delete the group
      await supabase.from('chat_groups').delete().eq('id', group.id);
      return null;
    }

    console.log('[ChatGroups] Created group:', groupCode, 'with member:', memberId);

    return {
      groupCode: group.code,
      groupId: group.id,
      memberId: member.id,
    };
  } catch (error) {
    console.error('[ChatGroups] Error creating group:', error);
    return null;
  }
}

/**
 * Join an existing chat group by code
 */
export async function joinChatGroup(
  groupCode: string,
  userName: string,
  userId?: string
): Promise<JoinChatGroupResult | null> {
  if (!isSupabaseConfigured() || !supabase) {
    console.error('[ChatGroups] Supabase not configured');
    return null;
  }

  const deviceId = getDeviceId();
  const avatar = userName.substring(0, 2).toUpperCase();

  try {
    // Find the group by code
    const { data: group, error: groupError } = await supabase
      .from('chat_groups')
      .select()
      .eq('code', groupCode.toUpperCase())
      .eq('is_active', true)
      .single();

    if (groupError || !group) {
      console.error('[ChatGroups] Group not found:', groupError);
      return null;
    }

    // Check if already a member (same device)
    const { data: existingMember } = await supabase
      .from('chat_members')
      .select()
      .eq('group_id', group.id)
      .eq('device_id', deviceId)
      .eq('is_active', true)
      .single();

    if (existingMember) {
      // Already a member, return existing info
      console.log('[ChatGroups] Already a member of group:', groupCode);
      return {
        groupId: group.id,
        memberId: existingMember.id,
        groupName: group.name,
        isNewMember: false,
      };
    }

    // Check max members
    const settings = group.settings as ChatGroupSettings || DEFAULT_GROUP_SETTINGS;
    const { count } = await supabase
      .from('chat_members')
      .select('*', { count: 'exact', head: true })
      .eq('group_id', group.id)
      .eq('is_active', true);

    if (count && count >= settings.maxMembers) {
      console.error('[ChatGroups] Group is full');
      return null;
    }

    // Add as new member
    const memberId = crypto.randomUUID();
    const { data: member, error: memberError } = await supabase
      .from('chat_members')
      .insert({
        id: memberId,
        group_id: group.id,
        device_id: deviceId,
        user_id: userId || null,
        name: userName,
        avatar: avatar,
        role: 'member',
        is_active: true,
      })
      .select()
      .single();

    if (memberError || !member) {
      console.error('[ChatGroups] Failed to join group:', memberError);
      return null;
    }

    console.log('[ChatGroups] Joined group:', groupCode, 'as member:', memberId);

    return {
      groupId: group.id,
      memberId: member.id,
      groupName: group.name,
      isNewMember: true,
    };
  } catch (error) {
    console.error('[ChatGroups] Error joining group:', error);
    return null;
  }
}

/**
 * Leave a chat group
 */
export async function leaveChatGroup(
  groupId: string,
  memberId: string
): Promise<boolean> {
  if (!isSupabaseConfigured() || !supabase) {
    return false;
  }

  try {
    // Mark member as inactive
    const { error } = await supabase
      .from('chat_members')
      .update({ is_active: false })
      .eq('id', memberId)
      .eq('group_id', groupId);

    if (error) {
      console.error('[ChatGroups] Error leaving group:', error);
      return false;
    }

    console.log('[ChatGroups] Left group:', groupId);
    return true;
  } catch (error) {
    console.error('[ChatGroups] Error leaving group:', error);
    return false;
  }
}

/**
 * Get group details by ID
 */
export async function getGroupById(groupId: string): Promise<DbChatGroup | null> {
  if (!isSupabaseConfigured() || !supabase) {
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('chat_groups')
      .select()
      .eq('id', groupId)
      .eq('is_active', true)
      .single();

    if (error || !data) {
      return null;
    }

    return data as DbChatGroup;
  } catch (error) {
    console.error('[ChatGroups] Error getting group:', error);
    return null;
  }
}

/**
 * Get group details by code
 */
export async function getGroupByCode(code: string): Promise<DbChatGroup | null> {
  if (!isSupabaseConfigured() || !supabase) {
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('chat_groups')
      .select()
      .eq('code', code.toUpperCase())
      .eq('is_active', true)
      .single();

    if (error || !data) {
      return null;
    }

    return data as DbChatGroup;
  } catch (error) {
    console.error('[ChatGroups] Error getting group:', error);
    return null;
  }
}

/**
 * Get all members of a group
 */
export async function getGroupMembers(groupId: string): Promise<DbChatMember[]> {
  if (!isSupabaseConfigured() || !supabase) {
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('chat_members')
      .select()
      .eq('group_id', groupId)
      .eq('is_active', true)
      .order('joined_at', { ascending: true });

    if (error || !data) {
      return [];
    }

    return data as DbChatMember[];
  } catch (error) {
    console.error('[ChatGroups] Error getting members:', error);
    return [];
  }
}

/**
 * Get member by ID
 */
export async function getMemberById(memberId: string): Promise<DbChatMember | null> {
  if (!isSupabaseConfigured() || !supabase) {
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('chat_members')
      .select()
      .eq('id', memberId)
      .single();

    if (error || !data) {
      return null;
    }

    return data as DbChatMember;
  } catch (error) {
    console.error('[ChatGroups] Error getting member:', error);
    return null;
  }
}

/**
 * Update member's last read timestamp
 */
export async function updateLastRead(
  memberId: string,
  timestamp?: string
): Promise<boolean> {
  if (!isSupabaseConfigured() || !supabase) {
    return false;
  }

  try {
    const { error } = await supabase
      .from('chat_members')
      .update({ last_read_at: timestamp || new Date().toISOString() })
      .eq('id', memberId);

    return !error;
  } catch (error) {
    console.error('[ChatGroups] Error updating last read:', error);
    return false;
  }
}

/**
 * Update group settings (admin only)
 */
export async function updateGroupSettings(
  groupId: string,
  memberId: string,
  settings: Partial<ChatGroupSettings>
): Promise<boolean> {
  if (!isSupabaseConfigured() || !supabase) {
    return false;
  }

  try {
    // Check if member is admin
    const { data: member } = await supabase
      .from('chat_members')
      .select('role')
      .eq('id', memberId)
      .eq('group_id', groupId)
      .single();

    if (!member || member.role !== 'admin') {
      console.error('[ChatGroups] Not authorized to update settings');
      return false;
    }

    // Get current settings
    const { data: group } = await supabase
      .from('chat_groups')
      .select('settings')
      .eq('id', groupId)
      .single();

    const currentSettings = (group?.settings as ChatGroupSettings) || DEFAULT_GROUP_SETTINGS;

    // Update settings
    const { error } = await supabase
      .from('chat_groups')
      .update({
        settings: { ...currentSettings, ...settings },
      })
      .eq('id', groupId);

    return !error;
  } catch (error) {
    console.error('[ChatGroups] Error updating settings:', error);
    return false;
  }
}

/**
 * Get all groups the current device is a member of
 */
export async function getMyGroups(): Promise<DbChatGroup[]> {
  if (!isSupabaseConfigured() || !supabase) {
    return [];
  }

  const deviceId = getDeviceId();

  try {
    // Get member records for this device
    const { data: members, error: membersError } = await supabase
      .from('chat_members')
      .select('group_id')
      .eq('device_id', deviceId)
      .eq('is_active', true);

    if (membersError || !members || members.length === 0) {
      return [];
    }

    const groupIds = members.map((m) => m.group_id);

    // Get group details
    const { data: groups, error: groupsError } = await supabase
      .from('chat_groups')
      .select()
      .in('id', groupIds)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (groupsError || !groups) {
      return [];
    }

    return groups as DbChatGroup[];
  } catch (error) {
    console.error('[ChatGroups] Error getting my groups:', error);
    return [];
  }
}

/**
 * Get my member record for a specific group
 */
export async function getMyMembership(groupId: string): Promise<DbChatMember | null> {
  if (!isSupabaseConfigured() || !supabase) {
    return null;
  }

  const deviceId = getDeviceId();

  try {
    const { data, error } = await supabase
      .from('chat_members')
      .select()
      .eq('group_id', groupId)
      .eq('device_id', deviceId)
      .eq('is_active', true)
      .single();

    if (error || !data) {
      return null;
    }

    return data as DbChatMember;
  } catch (error) {
    console.error('[ChatGroups] Error getting membership:', error);
    return null;
  }
}
