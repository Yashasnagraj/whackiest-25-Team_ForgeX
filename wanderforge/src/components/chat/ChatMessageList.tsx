// ============================================================
// CHAT MESSAGE LIST
// Scrollable message list with load more
// ============================================================

import { useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';
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
      className="flex-1 overflow-y-auto px-4 py-4 space-y-2"
      onScroll={handleScroll}
    >
      {/* Loading indicator */}
      {isLoadingMessages && (
        <div className="flex justify-center py-4">
          <Loader2 className="w-6 h-6 text-gray-400 animate-spin" />
        </div>
      )}

      {/* Messages */}
      <AnimatePresence mode="popLayout">
        {messages.map((message, index) => (
          <div key={message.id}>
            {/* Date separator */}
            {shouldShowDate(index) && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-center py-4"
              >
                <span className="text-xs text-gray-500 bg-dark-700/50 px-3 py-1 rounded-full">
                  {getDateLabel(message.createdAt)}
                </span>
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
