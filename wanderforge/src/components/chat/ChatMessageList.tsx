// ============================================================
// CHAT MESSAGE LIST
// Scrollable message list with load more
// ============================================================

import { useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, MessageSquare, Sparkles } from 'lucide-react';
import { ChatMessage } from './ChatMessage';
import { ChatTypingIndicator } from './ChatTypingIndicator';
import type { ChatMessage as ChatMessageType } from '../../services/chat/types';
import { useChatStore } from '../../stores/chat.store';

interface Props {
  messages: ChatMessageType[];
  onReply: (message: ChatMessageType) => void;
  onReact: (messageId: string, emoji: string) => void;
  onLoadMore: () => void;
}

export function ChatMessageList({ messages, onReply, onReact, onLoadMore }: Props) {
  // Select primitives directly to avoid store subscription issues
  const isLoadingMessages = useChatStore((state) => state.isLoadingMessages);
  const hasMoreMessages = useChatStore((state) => state.hasMoreMessages);
  const containerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const isAtBottomRef = useRef(true);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (isAtBottomRef.current && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages.length]);

  // Check if user is at bottom
  const handleScroll = useCallback(() => {
    if (!containerRef.current) return;

    const { scrollTop, scrollHeight, clientHeight } = containerRef.current;
    isAtBottomRef.current = scrollHeight - scrollTop - clientHeight < 50;

    // Load more when near top
    if (scrollTop < 100 && hasMoreMessages && !isLoadingMessages) {
      onLoadMore();
    }
  }, [hasMoreMessages, isLoadingMessages, onLoadMore]);

  // Determine if we should show avatar (first message or different sender)
  const shouldShowAvatar = (index: number): boolean => {
    if (index === 0) return true;
    const prevMessage = messages[index - 1];
    const currentMessage = messages[index];

    // Different sender or system message
    if (prevMessage.senderId !== currentMessage.senderId) return true;
    if (currentMessage.type === 'system') return false;

    // More than 5 minutes apart
    const timeDiff = currentMessage.createdAt.getTime() - prevMessage.createdAt.getTime();
    if (timeDiff > 5 * 60 * 1000) return true;

    return false;
  };

  // Group messages by date
  const getDateLabel = (date: Date): string | null => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    });
  };

  const shouldShowDate = (index: number): boolean => {
    if (index === 0) return true;
    const prevDate = messages[index - 1].createdAt.toDateString();
    const currentDate = messages[index].createdAt.toDateString();
    return prevDate !== currentDate;
  };

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto px-4 py-4 space-y-2 scrollbar-thin scrollbar-thumb-dark-600 scrollbar-track-transparent"
      onScroll={handleScroll}
    >
      {/* Loading indicator */}
      {isLoadingMessages && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex justify-center py-4"
        >
          <div className="flex items-center gap-2 px-4 py-2 bg-dark-700/50 backdrop-blur-sm rounded-full">
            <Loader2 className="w-4 h-4 text-accent-cyan animate-spin" />
            <span className="text-sm text-gray-400">Loading messages...</span>
          </div>
        </motion.div>
      )}

      {/* Empty state */}
      {!isLoadingMessages && messages.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center h-full py-12"
        >
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-accent-cyan/20 to-accent-purple/20 flex items-center justify-center mb-4">
            <MessageSquare className="w-10 h-10 text-accent-cyan/60" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">Start the conversation</h3>
          <p className="text-gray-400 text-sm text-center max-w-xs mb-4">
            Send a message to start planning your trip together
          </p>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Sparkles className="w-4 h-4 text-accent-purple" />
            <span>Mention destinations for AI recommendations</span>
          </div>
        </motion.div>
      )}

      {/* Messages */}
      <AnimatePresence mode="popLayout">
        {messages.map((message, index) => (
          <div key={message.id}>
            {/* Date separator */}
            {shouldShowDate(index) && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center justify-center py-4 gap-3"
              >
                <div className="h-px flex-1 max-w-16 bg-gradient-to-r from-transparent to-white/10" />
                <span className="text-xs text-gray-400 bg-dark-700/70 backdrop-blur-sm px-4 py-1.5 rounded-full border border-white/5">
                  {getDateLabel(message.createdAt)}
                </span>
                <div className="h-px flex-1 max-w-16 bg-gradient-to-l from-transparent to-white/10" />
              </motion.div>
            )}

            <ChatMessage
              message={message}
              onReply={onReply}
              onReact={onReact}
              showAvatar={shouldShowAvatar(index)}
            />
          </div>
        ))}
      </AnimatePresence>

      {/* Typing indicator */}
      <ChatTypingIndicator />

      {/* Bottom anchor */}
      <div ref={bottomRef} />
    </div>
  );
}
