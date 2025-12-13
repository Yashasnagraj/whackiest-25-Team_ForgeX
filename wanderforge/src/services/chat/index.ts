// ============================================================
// TRIP CHAT - Service Exports
// Barrel export for all chat services
// ============================================================

// Types
export * from './types';

// Group Management
export {
  getDeviceId,
  generateGroupCode,
  isValidGroupCode,
  createChatGroup,
  joinChatGroup,
  leaveChatGroup,
  getGroupById,
  getGroupByCode,
  getGroupMembers,
  getMemberById,
  updateLastRead,
  updateGroupSettings,
  getMyGroups,
  getMyMembership,
} from './chat-groups.service';

// Messages
export {
  sendMessage,
  sendSystemMessage,
  editMessage,
  deleteMessage,
  getMessages,
  getMessageById,
  getAllMessages,
  addReaction,
  removeReaction,
  getReactions,
  getReactionsBatch,
  markAsRead,
  getReadReceipts,
  formatMessages,
  getMessageCount,
  getUnreadCount,
} from './chat-messages.service';

// Real-Time
export {
  startChatSession,
  stopChatSession,
  getCurrentSession,
  isInSession,
  onMessage,
  onMember,
  onReaction,
  onTyping,
  sendTypingIndicator,
  getTypingMembers,
  getSessionMembers,
  getSessionMember,
  getMyMemberId,
  getGroupCode,
  getGroupName,
} from './chat-realtime.service';

// Media
export {
  uploadImage,
  uploadImageFromDataUrl,
  deleteImage,
  createThumbnail,
  isValidImageFile,
  formatFileSize,
  compressImage,
} from './chat-media.service';

// Extraction
export {
  initExtractionService,
  cleanupExtractionService,
  triggerExtraction,
  forceExtraction,
  finalizeExtraction,
  getLatestSnapshot,
  getAllSnapshots,
  getExtractionState,
  isExtracting,
  getExtractionSummary,
} from './chat-extraction.service';
