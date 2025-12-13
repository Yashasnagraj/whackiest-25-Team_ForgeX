// ============================================================
// TRIP CHAT - Type Definitions
// TypeScript interfaces for real-time group chat with extraction
// ============================================================

import type { ChatExtractionResult } from '../ai/types';

// ==================== Database Types ====================
// These match the Supabase schema for chat tables

export interface DbChatGroup {
  id: string;
  code: string;
  name: string;
  creator_id: string;
  created_at: string;
  is_active: boolean;
  settings: ChatGroupSettings | null;
}

export interface ChatGroupSettings {
  allowMediaUpload: boolean;
  extractionEnabled: boolean;
  maxMembers: number;
}

export interface DbChatMember {
  id: string;
  group_id: string;
  device_id: string;
  user_id: string | null;
  name: string;
  avatar: string;
  role: 'admin' | 'member';
  joined_at: string;
  last_read_at: string | null;
  is_active: boolean;
}

export interface DbChatMessage {
  id: string;
  group_id: string;
  sender_id: string;
  parent_id: string | null; // For reply threads
  content: string;
  message_type: MessageType;
  media_url: string | null;
  media_metadata: MediaMetadata | null;
  created_at: string;
  edited_at: string | null;
  is_deleted: boolean;
}

export type MessageType = 'text' | 'image' | 'system';

export interface MediaMetadata {
  width: number;
  height: number;
  size: number;
  mimeType: string;
  thumbnailUrl?: string;
}

export interface DbChatReaction {
  id: string;
  message_id: string;
  member_id: string;
  emoji: string;
  created_at: string;
}

export interface DbChatReadReceipt {
  id: string;
  message_id: string;
  member_id: string;
  read_at: string;
}

export interface DbChatExtractionSnapshot {
  id: string;
  group_id: string;
  extraction_data: ChatExtractionResult;
  message_count: number;
  last_message_id: string | null;
  created_at: string;
  is_finalized: boolean;
  finalized_by: string | null;
  finalized_at: string | null;
}

// ==================== Insert Types ====================
// Omit auto-generated fields for inserts

export type ChatGroupInsert = Omit<DbChatGroup, 'id' | 'created_at'>;
export type ChatMemberInsert = Omit<DbChatMember, 'id' | 'joined_at' | 'last_read_at'>;
export type ChatMessageInsert = Omit<DbChatMessage, 'id' | 'created_at' | 'edited_at' | 'is_deleted'>;
export type ChatReactionInsert = Omit<DbChatReaction, 'id' | 'created_at'>;
export type ChatReadReceiptInsert = Omit<DbChatReadReceipt, 'id' | 'read_at'>;
export type ChatExtractionSnapshotInsert = Omit<DbChatExtractionSnapshot, 'id' | 'created_at' | 'finalized_at'>;

// ==================== UI Types ====================
// Enhanced types for frontend use

export interface ChatMember {
  id: string;
  name: string;
  avatar: string;
  role: 'admin' | 'member';
  isOnline: boolean;
  isTyping: boolean;
  lastSeen: Date;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  parentId: string | null;
  parentPreview: string | null; // Preview of parent message for replies
  content: string;
  type: MessageType;
  mediaUrl: string | null;
  mediaMetadata: MediaMetadata | null;
  reactions: MessageReaction[];
  readBy: string[]; // Member IDs who have read this message
  createdAt: Date;
  editedAt: Date | null;
  isDeleted: boolean;
  isOwn: boolean; // Is this message from the current user?
}

export interface MessageReaction {
  emoji: string;
  count: number;
  memberIds: string[];
  hasReacted: boolean; // Has current user reacted with this emoji?
}

export interface ChatGroup {
  id: string;
  code: string;
  name: string;
  creatorId: string;
  isAdmin: boolean;
  memberCount: number;
  unreadCount: number;
  lastMessage: string | null;
  lastMessageAt: Date | null;
  settings: ChatGroupSettings;
}

// ==================== Session Types ====================

export interface ChatSession {
  groupId: string;
  groupCode: string;
  groupName: string;
  myMemberId: string;
  members: Map<string, ChatMember>;
  isAdmin: boolean;
}

export interface CreateChatGroupResult {
  groupCode: string;
  groupId: string;
  memberId: string;
}

export interface JoinChatGroupResult {
  groupId: string;
  memberId: string;
  groupName: string;
  isNewMember: boolean;
}

// ==================== Event Types ====================

export interface TypingEvent {
  memberId: string;
  memberName: string;
  isTyping: boolean;
}

export interface MessageEvent {
  type: 'insert' | 'update' | 'delete';
  message: ChatMessage;
}

export interface ReactionEvent {
  type: 'add' | 'remove';
  messageId: string;
  emoji: string;
  memberId: string;
}

export interface MemberEvent {
  type: 'join' | 'leave' | 'update';
  member: ChatMember;
}

// ==================== Extraction Types ====================

export interface LiveExtractionState {
  isExtracting: boolean;
  lastExtractedAt: Date | null;
  messagesSinceExtraction: number;
  extraction: ChatExtractionResult | null;
  confidence: number;
}

export interface ExtractionProgress {
  stage: 'idle' | 'collecting' | 'extracting' | 'complete';
  progress: number;
  message: string;
}

// ==================== Callback Types ====================

export type OnMessagesUpdate = (messages: ChatMessage[]) => void;
export type OnMembersUpdate = (members: ChatMember[]) => void;
export type OnTypingUpdate = (typingMembers: ChatMember[]) => void;
export type OnExtractionUpdate = (extraction: LiveExtractionState) => void;
export type OnMemberJoin = (member: ChatMember) => void;
export type OnNewMessage = (message: ChatMessage) => void;
