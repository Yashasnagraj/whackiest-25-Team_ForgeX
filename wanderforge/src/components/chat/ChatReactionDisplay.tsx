// ============================================================
// CHAT REACTION DISPLAY
// Show reactions under a message
// ============================================================

import type { MessageReaction } from '../../services/chat/types';

interface Props {
  reactions: MessageReaction[];
  onReact: (emoji: string) => void;
}

export function ChatReactionDisplay({ reactions, onReact }: Props) {
  if (reactions.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {reactions.map((reaction) => (
        <button
          key={reaction.emoji}
          onClick={() => onReact(reaction.emoji)}
          className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs transition-colors ${
            reaction.hasReacted
              ? 'bg-accent-cyan/20 border border-accent-cyan/50 text-white'
              : 'bg-dark-600 hover:bg-dark-500 text-gray-300'
          }`}
        >
          <span>{reaction.emoji}</span>
          <span>{reaction.count}</span>
        </button>
      ))}
    </div>
  );
}
