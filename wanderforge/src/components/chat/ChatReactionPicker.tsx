// ============================================================
// CHAT REACTION PICKER
// Emoji selector popup for reactions
// ============================================================

import { motion } from 'framer-motion';

interface Props {
  onSelect: (emoji: string) => void;
  onClose: () => void;
}

const QUICK_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🔥'];

export function ChatReactionPicker({ onSelect, onClose }: Props) {
  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40" onClick={onClose} />

      {/* Picker */}
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="absolute z-50 mt-2 flex gap-1 p-2 bg-dark-700 rounded-full shadow-xl border border-white/10"
      >
        {QUICK_REACTIONS.map((emoji) => (
          <button
            key={emoji}
            onClick={() => onSelect(emoji)}
            className="w-8 h-8 flex items-center justify-center text-lg hover:bg-dark-600 rounded-full transition-colors"
          >
            {emoji}
          </button>
        ))}
      </motion.div>
    </>
  );
}
