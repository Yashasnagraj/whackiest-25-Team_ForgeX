// ============================================================
// CHAT MESSAGE COMPONENT
// Single message bubble with reactions and reply support
// ============================================================

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Reply, MoreHorizontal, Smile, Check, CheckCheck } from 'lucide-react';
import type { ChatMessage as ChatMessageType } from '../../services/chat/types';
import { ChatReactionPicker } from './ChatReactionPicker';
import { ChatReactionDisplay } from './ChatReactionDisplay';
import { ChatImagePreview } from './ChatImagePreview';
import { ChatRecommendationCard } from './ChatRecommendationCard';
import { useChatStore } from '../../stores/chat.store';

interface Props {
  message: ChatMessageType;
  onReply: (message: ChatMessageType) => void;
  onReact: (messageId: string, emoji: string) => void;
  showAvatar?: boolean;
}

export function ChatMessage({ message, onReply, onReact, showAvatar = true }: Props) {
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const addRecommendedPlace = useChatStore((state) => state.addRecommendedPlace);

  const isSystem = message.type === 'system';
  const isRecommendation = message.type === 'recommendation';
  const isOwn = message.isOwn;

  // System messages
  if (isSystem) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-center py-2"
      >
        <span className="text-xs text-gray-500 bg-dark-700/50 px-3 py-1 rounded-full">
          {message.content}
        </span>
      </motion.div>
    );
  }

  // AI Recommendation messages
  if (isRecommendation && message.recommendationData) {
    return (
      <ChatRecommendationCard
        destination={message.recommendationData.detectedPlace}
        recommendations={message.recommendationData.recommendations}
        onAddToTrip={(item) => {
          console.log('[ChatMessage] Adding to trip:', item);
          addRecommendedPlace(item);
        }}
      />
    );
  }

  // Format time
  const time = message.createdAt.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-3 group ${isOwn ? 'flex-row-reverse' : ''}`}
    >
      {/* Avatar */}
      {showAvatar && !isOwn && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-accent-cyan to-accent-purple flex items-center justify-center text-white text-xs font-bold">
          {message.senderAvatar}
        </div>
      )}
      {!showAvatar && !isOwn && <div className="w-8" />}

      {/* Message Content */}
      <div className={`max-w-[75%] ${isOwn ? 'items-end' : 'items-start'}`}>
        {/* Sender name (for others) */}
        {showAvatar && !isOwn && (
          <span className="text-xs text-gray-400 mb-1 block">{message.senderName}</span>
        )}

        {/* Reply preview */}
        {message.parentPreview && (
          <div
            className={`text-xs text-gray-400 mb-1 pl-2 border-l-2 ${
              isOwn ? 'border-accent-cyan' : 'border-gray-600'
            }`}
          >
            {message.parentPreview}
          </div>
        )}

        {/* Bubble */}
        <div
          className={`relative rounded-2xl px-4 py-2 ${
            isOwn
              ? 'bg-gradient-to-r from-accent-cyan to-accent-purple text-white rounded-br-md'
              : 'bg-dark-700 text-white rounded-bl-md'
          }`}
        >
          {/* Image */}
          {message.type === 'image' && message.mediaUrl && (
            <ChatImagePreview
              url={message.mediaUrl}
              metadata={message.mediaMetadata}
            />
          )}

          {/* Text content */}
          <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>

          {/* Time and status */}
          <div
            className={`flex items-center gap-1 mt-1 ${
              isOwn ? 'justify-end' : 'justify-start'
            }`}
          >
            <span className="text-[10px] text-white/60">{time}</span>
            {message.editedAt && (
              <span className="text-[10px] text-white/40">(edited)</span>
            )}
            {isOwn && (
              <span className="text-white/60">
                {message.readBy.length > 0 ? (
                  <CheckCheck className="w-3 h-3" />
                ) : (
                  <Check className="w-3 h-3" />
                )}
              </span>
            )}
          </div>

          {/* Hover actions */}
          <div
            className={`absolute top-0 ${
              isOwn ? 'left-0 -translate-x-full pr-2' : 'right-0 translate-x-full pl-2'
            } opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1`}
          >
            <button
              onClick={() => setShowReactionPicker(true)}
              className="p-1.5 bg-dark-700 hover:bg-dark-600 rounded-lg transition-colors"
            >
              <Smile className="w-4 h-4 text-gray-400" />
            </button>
            <button
              onClick={() => onReply(message)}
              className="p-1.5 bg-dark-700 hover:bg-dark-600 rounded-lg transition-colors"
            >
              <Reply className="w-4 h-4 text-gray-400" />
            </button>
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1.5 bg-dark-700 hover:bg-dark-600 rounded-lg transition-colors"
            >
              <MoreHorizontal className="w-4 h-4 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Reactions */}
        {message.reactions.length > 0 && (
          <ChatReactionDisplay
            reactions={message.reactions}
            onReact={(emoji) => onReact(message.id, emoji)}
          />
        )}

        {/* Reaction Picker */}
        {showReactionPicker && (
          <ChatReactionPicker
            onSelect={(emoji) => {
              onReact(message.id, emoji);
              setShowReactionPicker(false);
            }}
            onClose={() => setShowReactionPicker(false)}
          />
        )}
      </div>
    </motion.div>
  );
}
