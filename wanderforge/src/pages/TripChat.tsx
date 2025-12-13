// ============================================================
// TRIP CHAT PAGE
// Main chat page with real-time messaging and extraction
// ============================================================

import { useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Users,
  MessageSquare,
  ArrowRight,
  Trash2,
  Plane,
  Compass,
  Camera,
  MapPin,
  Sparkles,
  Zap,
  Globe,
  TreePalm,
  Cloud,
} from 'lucide-react';
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
  processMessageForRecommendations,
} from '../services/chat';
import type { DbChatMessage, DbChatMember, DbChatReaction, ChatMessage } from '../services/chat/types';

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
    removeRecentGroup,
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

        // Check for place mentions and generate AI recommendations
        if (dbMessage.message_type === 'text' && dbMessage.content) {
          processMessageForRecommendations(dbMessage.content, session.groupId)
            .then((result) => {
              if (result.shouldRespond && result.recommendations) {
                // Add recommendation as a special message
                const recommendationMessage: ChatMessage = {
                  id: `rec-${Date.now()}`,
                  senderId: 'assistant',
                  senderName: 'WanderForge Assistant',
                  senderAvatar: '🤖',
                  parentId: null,
                  parentPreview: null,
                  content: `Recommendations for ${result.detectedPlace}`,
                  type: 'recommendation',
                  mediaUrl: null,
                  mediaMetadata: null,
                  recommendationData: {
                    detectedPlace: result.detectedPlace!,
                    recommendations: result.recommendations,
                    triggerMessageId: dbMessage.id,
                  },
                  reactions: [],
                  readBy: [],
                  createdAt: new Date(),
                  editedAt: null,
                  isDeleted: false,
                  isOwn: false,
                };
                addMessage(recommendationMessage);
              }
            })
            .catch((error) => {
              console.error('[TripChat] Recommendation error:', error);
            });
        }
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

  // Floating icons configuration
  const floatingIcons = [
    { Icon: Plane, x: '8%', y: '15%', delay: 0, size: 'w-8 h-8', rotate: -15 },
    { Icon: MapPin, x: '88%', y: '12%', delay: 0.5, size: 'w-6 h-6', rotate: 10 },
    { Icon: Compass, x: '12%', y: '75%', delay: 1, size: 'w-7 h-7', rotate: -5 },
    { Icon: TreePalm, x: '85%', y: '70%', delay: 1.5, size: 'w-9 h-9', rotate: 8 },
    { Icon: Camera, x: '5%', y: '45%', delay: 2, size: 'w-6 h-6', rotate: -12 },
    { Icon: Globe, x: '92%', y: '45%', delay: 2.5, size: 'w-7 h-7', rotate: 5 },
    { Icon: Cloud, x: '25%', y: '8%', delay: 0.8, size: 'w-10 h-10', rotate: 0 },
    { Icon: Cloud, x: '70%', y: '5%', delay: 1.2, size: 'w-8 h-8', rotate: 0 },
  ];

  // Feature badges
  const features = [
    { label: 'AI-Powered', icon: Sparkles, color: 'from-accent-purple to-accent-purple/50' },
    { label: 'Real-time', icon: Zap, color: 'from-accent-cyan to-accent-cyan/50' },
    { label: 'Smart', icon: Globe, color: 'from-journey-success to-journey-success/50' },
  ];

  // Setup view
  if (!isInSession) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center p-4 overflow-hidden relative">
        {/* Floating Background Icons */}
        {floatingIcons.map((icon, index) => (
          <motion.div
            key={index}
            className="absolute pointer-events-none"
            style={{ left: icon.x, top: icon.y }}
            initial={{ opacity: 0, scale: 0 }}
            animate={{
              opacity: [0.15, 0.25, 0.15],
              scale: 1,
              y: [0, -15, 0],
              rotate: [icon.rotate, icon.rotate + 10, icon.rotate - 10, icon.rotate],
            }}
            transition={{
              duration: 5 + index * 0.5,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: icon.delay,
            }}
          >
            <icon.Icon className={`${icon.size} text-white/20`} />
          </motion.div>
        ))}

        {/* Decorative blur circles */}
        <div className="absolute top-1/4 -left-20 w-60 h-60 bg-accent-cyan/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-20 w-60 h-60 bg-accent-purple/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-journey-dream/5 rounded-full blur-3xl" />

        {/* Main Content Card */}
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="w-full max-w-md relative z-10"
        >
          {/* Glass Card */}
          <div className="bg-dark-800/60 backdrop-blur-2xl border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
            {/* Card glow effect */}
            <div className="absolute -top-20 -right-20 w-40 h-40 bg-accent-cyan/20 rounded-full blur-3xl" />
            <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-accent-purple/20 rounded-full blur-3xl" />

            {/* Content */}
            <div className="relative z-10 space-y-6">
              {/* Icon and Title */}
              <div className="text-center space-y-4">
                <motion.div
                  className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-accent-cyan via-accent-purple to-journey-dream flex items-center justify-center shadow-lg shadow-accent-purple/20"
                  animate={{
                    boxShadow: [
                      '0 10px 40px rgba(155, 81, 224, 0.2)',
                      '0 10px 60px rgba(6, 147, 227, 0.3)',
                      '0 10px 40px rgba(155, 81, 224, 0.2)',
                    ],
                  }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <MessageSquare className="w-10 h-10 text-white" />
                </motion.div>

                <div>
                  <h1 className="text-3xl font-display font-bold">
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-white to-gray-300">
                      Plan Together,
                    </span>
                    <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-cyan to-accent-purple">
                      Travel Forever
                    </span>
                  </h1>
                  <p className="text-gray-400 mt-3 text-sm leading-relaxed">
                    Chat with your travel crew and let AI turn your conversations into unforgettable adventures
                  </p>
                </div>

                {/* Feature badges */}
                <div className="flex items-center justify-center gap-2 flex-wrap">
                  {features.map((feature, index) => (
                    <motion.div
                      key={feature.label}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 + index * 0.1 }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r ${feature.color} bg-opacity-20 border border-white/10`}
                    >
                      <feature.icon className="w-3.5 h-3.5 text-white/80" />
                      <span className="text-xs font-medium text-white/80">{feature.label}</span>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-3 pt-2">
                <motion.button
                  onClick={() => openSetupModal('create')}
                  className="w-full py-4 bg-gradient-to-r from-accent-cyan to-accent-purple text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-accent-purple/25 transition-all flex items-center justify-center gap-2 group"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />
                  Create New Group
                </motion.button>

                <motion.button
                  onClick={() => openSetupModal('join')}
                  className="w-full py-4 bg-dark-700/50 border border-white/10 text-white font-semibold rounded-xl hover:bg-dark-700 hover:border-white/20 transition-all flex items-center justify-center gap-2"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Users className="w-5 h-5" />
                  Join Existing Group
                </motion.button>
              </div>

              {/* Recent groups */}
              {recentGroups.length > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="space-y-3 pt-2"
                >
                  <div className="flex items-center gap-2">
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                    <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider">Recent Adventures</h3>
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                  </div>
                  <div className="space-y-2">
                    {recentGroups.map((group, index) => (
                      <motion.div
                        key={group.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 + index * 0.1 }}
                        className="w-full flex items-center justify-between p-3 bg-dark-700/30 backdrop-blur-sm border border-white/5 rounded-xl hover:bg-dark-700/50 hover:border-white/10 transition-all group cursor-pointer"
                        whileHover={{ scale: 1.01 }}
                      >
                        <button
                          onClick={() => openSetupModal('join')}
                          className="flex items-center gap-3 flex-1"
                        >
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-dark-600 to-dark-700 flex items-center justify-center text-gray-400 group-hover:from-accent-cyan/20 group-hover:to-accent-purple/20 transition-all">
                            <MessageSquare className="w-5 h-5" />
                          </div>
                          <div className="text-left">
                            <p className="text-white font-medium text-sm">{group.name}</p>
                            <p className="text-xs text-gray-500 font-mono">{group.code}</p>
                          </div>
                        </button>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm(`Delete "${group.name}" from recent groups?`)) {
                                removeRecentGroup(group.id);
                              }
                            }}
                            className="p-2 opacity-0 group-hover:opacity-100 hover:bg-red-500/20 rounded-lg transition-all"
                            title="Delete group"
                          >
                            <Trash2 className="w-4 h-4 text-red-400" />
                          </button>
                          <ArrowRight className="w-4 h-4 text-gray-500 group-hover:text-accent-cyan group-hover:translate-x-1 transition-all" />
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </div>
          </div>

          {/* Bottom tagline */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="text-center mt-6"
          >
            <p className="text-gray-500 text-sm flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4 text-accent-purple" />
              <span>Every journey begins with a conversation</span>
              <Sparkles className="w-4 h-4 text-accent-cyan" />
            </p>
          </motion.div>
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
    <div className="h-screen bg-dark-900 flex flex-col relative overflow-hidden">
      {/* Background gradient effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-accent-cyan/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent-purple/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-0 w-64 h-64 bg-journey-dream/5 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <ChatHeader
        onToggleExtraction={toggleExtractionPanel}
        showExtractionPanel={showExtractionPanel}
      />

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden relative z-10">
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
