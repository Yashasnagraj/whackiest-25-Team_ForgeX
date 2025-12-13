// ============================================================
// TRIP CHAT PAGE
// Main chat page with real-time messaging and extraction
// ============================================================

import { useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Users, MessageSquare, ArrowRight } from 'lucide-react';
import { useChatStore } from '../stores/chat.store';
import {
  ChatGroupSetupModal,
  ChatHeader,
  ChatMessageList,
  ChatInput,
  ChatExtractionPreview,
} from '../components/chat';
import {
  getMessages,
  sendMessage,
  sendSystemMessage,
  addReaction,
  uploadImage,
  formatMessages,
  onMessage,
  onMember,
  onReaction,
  onTyping,
  getGroupMembers,
  getReactionsBatch,
  initExtractionService,
  cleanupExtractionService,
  triggerExtraction,
  stopChatSession,
} from '../services/chat';
import type { DbChatMessage, DbChatMember, DbChatReaction } from '../services/chat/types';

export default function TripChat() {
  const {
    session,
    isInSession,
    isSetupModalOpen,
    setupMode,
    messages,
    replyingTo,
    showExtractionPanel,
    recentGroups,
    openSetupModal,
    closeSetupModal,
    setMessages,
    addMessage,
    updateMessage,
    removeMessage,
    prependMessages,
    setLoadingMessages,
    setHasMoreMessages,
    setReplyingTo,
    setMembers,
    addTypingMember,
    removeTypingMember,
    setLiveExtraction,
    toggleExtractionPanel,
  } = useChatStore();

  // Load initial messages when session starts
  useEffect(() => {
    if (!session) return;

    const loadMessages = async () => {
      setLoadingMessages(true);
      try {
        const dbMessages = await getMessages(session.groupId);
        const members = await getGroupMembers(session.groupId);
        const messageIds = dbMessages.map((m) => m.id);
        const reactions = await getReactionsBatch(messageIds);

        // TODO: Get read receipts
        const readReceipts = new Map<string, string[]>();

        const formatted = formatMessages(
          dbMessages,
          members,
          reactions,
          readReceipts,
          session.myMemberId
        );

        setMessages(formatted);
        setMembers(
          members.map((m) => ({
            id: m.id,
            name: m.name,
            avatar: m.avatar,
            role: m.role,
            isOnline: true,
            isTyping: false,
            lastSeen: new Date(m.joined_at),
          }))
        );

        setHasMoreMessages(dbMessages.length >= 50);
      } finally {
        setLoadingMessages(false);
      }
    };

    loadMessages();
  }, [session?.groupId]);

  // Subscribe to real-time events
  useEffect(() => {
    if (!session) return;

    // Message events
    onMessage(
      // Insert
      async (dbMessage: DbChatMessage) => {
        const members = await getGroupMembers(session.groupId);
        const reactions = await getReactionsBatch([dbMessage.id]);
        const readReceipts = new Map<string, string[]>();

        const [formatted] = formatMessages(
          [dbMessage],
          members,
          reactions,
          readReceipts,
          session.myMemberId
        );

        addMessage(formatted);

        // Trigger extraction on new message
        triggerExtraction(session.groupId);
      },
      // Update
      async (dbMessage: DbChatMessage) => {
        updateMessage(dbMessage.id, {
          content: dbMessage.content,
          editedAt: dbMessage.edited_at ? new Date(dbMessage.edited_at) : null,
        });
      },
      // Delete
      (messageId: string) => {
        removeMessage(messageId);
      }
    );

    // Member events
    onMember(
      // Join
      async (dbMember: DbChatMember) => {
        setMembers([
          ...useChatStore.getState().members,
          {
            id: dbMember.id,
            name: dbMember.name,
            avatar: dbMember.avatar,
            role: dbMember.role,
            isOnline: true,
            isTyping: false,
            lastSeen: new Date(dbMember.joined_at),
          },
        ]);

        // Send system message
        if (dbMember.id !== session.myMemberId) {
          await sendSystemMessage(session.groupId, `${dbMember.name} joined the chat`);
        }
      },
      // Leave
      (memberId: string) => {
        setMembers(useChatStore.getState().members.filter((m) => m.id !== memberId));
      }
    );

    // Reaction events
    onReaction((reaction: DbChatReaction, type: 'add' | 'remove') => {
      // Refresh message reactions
      const message = messages.find((m) => m.id === reaction.message_id);
      if (message) {
        // Update reactions
        let newReactions = [...message.reactions];
        const existingIndex = newReactions.findIndex((r) => r.emoji === reaction.emoji);

        if (type === 'add') {
          if (existingIndex >= 0) {
            newReactions[existingIndex].count++;
            newReactions[existingIndex].memberIds.push(reaction.member_id);
            if (reaction.member_id === session.myMemberId) {
              newReactions[existingIndex].hasReacted = true;
            }
          } else {
            newReactions.push({
              emoji: reaction.emoji,
              count: 1,
              memberIds: [reaction.member_id],
              hasReacted: reaction.member_id === session.myMemberId,
            });
          }
        } else {
          if (existingIndex >= 0) {
            newReactions[existingIndex].count--;
            newReactions[existingIndex].memberIds = newReactions[existingIndex].memberIds.filter(
              (id) => id !== reaction.member_id
            );
            if (reaction.member_id === session.myMemberId) {
              newReactions[existingIndex].hasReacted = false;
            }
            if (newReactions[existingIndex].count === 0) {
              newReactions = newReactions.filter((r) => r.emoji !== reaction.emoji);
            }
          }
        }

        updateMessage(message.id, { reactions: newReactions });
      }
    });

    // Typing events
    onTyping((event) => {
      if (event.isTyping) {
        addTypingMember(event.memberId);
      } else {
        removeTypingMember(event.memberId);
      }
    });

    // Cleanup on unmount
    return () => {
      // Unsubscribe handled by stopChatSession
    };
  }, [session?.groupId]);

  // Initialize extraction service
  useEffect(() => {
    if (!session) return;

    initExtractionService(
      (state) => setLiveExtraction(state),
      (progress) => {
        // Could show progress indicator
        console.log('[TripChat] Extraction progress:', progress);
      }
    );

    return () => {
      cleanupExtractionService();
    };
  }, [session?.groupId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isInSession) {
        stopChatSession();
      }
    };
  }, []);

  // Handle send message
  const handleSendMessage = useCallback(
    async (content: string) => {
      if (!session) return;

      await sendMessage(
        session.groupId,
        session.myMemberId,
        content,
        'text',
        replyingTo?.id
      );

      setReplyingTo(null);
    },
    [session, replyingTo]
  );

  // Handle image upload
  const handleImageUpload = useCallback(
    async (file: File) => {
      if (!session) return;

      const result = await uploadImage(file, session.groupId, session.myMemberId);
      if (result) {
        await sendMessage(
          session.groupId,
          session.myMemberId,
          '',
          'image',
          replyingTo?.id,
          result.url,
          result.metadata
        );
        setReplyingTo(null);
      }
    },
    [session, replyingTo]
  );

  // Handle reaction
  const handleReaction = useCallback(
    async (messageId: string, emoji: string) => {
      if (!session) return;
      await addReaction(messageId, session.myMemberId, emoji);
    },
    [session]
  );

  // Handle load more
  const handleLoadMore = useCallback(async () => {
    if (!session || messages.length === 0) return;

    setLoadingMessages(true);
    try {
      const firstMessageId = messages[0].id;
      const dbMessages = await getMessages(session.groupId, 50, firstMessageId);
      const members = await getGroupMembers(session.groupId);
      const messageIds = dbMessages.map((m) => m.id);
      const reactions = await getReactionsBatch(messageIds);
      const readReceipts = new Map<string, string[]>();

      const formatted = formatMessages(
        dbMessages,
        members,
        reactions,
        readReceipts,
        session.myMemberId
      );

      prependMessages(formatted);
      setHasMoreMessages(dbMessages.length >= 50);
    } finally {
      setLoadingMessages(false);
    }
  }, [session, messages]);

  // Setup view
  if (!isInSession) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md space-y-6"
        >
          {/* Header */}
          <div className="text-center space-y-3">
            <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-accent-cyan to-accent-purple flex items-center justify-center">
              <MessageSquare className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-display font-bold text-white">
              Trip Chat
            </h1>
            <p className="text-gray-400">
              Chat with your travel group and let AI extract trip details
            </p>
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <button
              onClick={() => openSetupModal('create')}
              className="w-full py-4 bg-gradient-to-r from-accent-cyan to-accent-purple text-white font-semibold rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Create New Group
            </button>

            <button
              onClick={() => openSetupModal('join')}
              className="w-full py-4 bg-dark-700 border border-white/10 text-white font-semibold rounded-xl hover:bg-dark-600 transition-colors flex items-center justify-center gap-2"
            >
              <Users className="w-5 h-5" />
              Join Existing Group
            </button>
          </div>

          {/* Recent groups */}
          {recentGroups.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-400">Recent Groups</h3>
              <div className="space-y-2">
                {recentGroups.map((group) => (
                  <button
                    key={group.id}
                    onClick={() => {
                      // Quick rejoin by code
                      openSetupModal('join');
                    }}
                    className="w-full flex items-center justify-between p-3 bg-dark-700/50 border border-white/5 rounded-xl hover:bg-dark-700 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-dark-600 flex items-center justify-center text-gray-400">
                        <MessageSquare className="w-5 h-5" />
                      </div>
                      <div className="text-left">
                        <p className="text-white font-medium">{group.name}</p>
                        <p className="text-xs text-gray-500 font-mono">{group.code}</p>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-500" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </motion.div>

        {/* Setup modal */}
        <ChatGroupSetupModal
          isOpen={isSetupModalOpen}
          mode={setupMode}
          onClose={closeSetupModal}
        />
      </div>
    );
  }

  // Chat view
  return (
    <div className="h-screen bg-dark-900 flex flex-col">
      {/* Header */}
      <ChatHeader
        onToggleExtraction={toggleExtractionPanel}
        showExtractionPanel={showExtractionPanel}
      />

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Messages */}
        <div className="flex-1 flex flex-col">
          <ChatMessageList
            messages={messages}
            onReply={(message) => setReplyingTo(message)}
            onReact={handleReaction}
            onLoadMore={handleLoadMore}
          />

          <ChatInput
            onSend={handleSendMessage}
            onImageSelect={handleImageUpload}
            replyingTo={replyingTo}
            onCancelReply={() => setReplyingTo(null)}
          />
        </div>

        {/* Extraction panel */}
        <AnimatePresence>
          {showExtractionPanel && session && (
            <ChatExtractionPreview
              groupId={session.groupId}
              memberId={session.myMemberId}
              onClose={toggleExtractionPanel}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
