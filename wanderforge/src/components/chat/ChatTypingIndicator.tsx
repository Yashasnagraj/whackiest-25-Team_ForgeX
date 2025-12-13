// ============================================================
// CHAT TYPING INDICATOR
// "John is typing..." animation
// ============================================================

import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useChatStore } from '../../stores/chat.store';

export function ChatTypingIndicator() {
  // Select primitives to avoid infinite loops
  const typingMembers = useChatStore((state) => state.typingMembers);
  const members = useChatStore((state) => state.members);

  // Compute derived state with useMemo
  const typingNames = useMemo(() => {
    const names: string[] = [];
    for (const memberId of typingMembers) {
      const member = members.find((m) => m.id === memberId);
      if (member) {
        names.push(member.name);
      }
    }
    return names;
  }, [typingMembers, members]);

  if (typingNames.length === 0) return null;

  const text =
    typingNames.length === 1
      ? `${typingNames[0]} is typing`
      : typingNames.length === 2
      ? `${typingNames[0]} and ${typingNames[1]} are typing`
      : `${typingNames[0]} and ${typingNames.length - 1} others are typing`;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-400"
      >
        {/* Animated dots */}
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-gray-400"
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{
                duration: 1,
                repeat: Infinity,
                delay: i * 0.2,
              }}
            />
          ))}
        </div>
        <span>{text}</span>
      </motion.div>
    </AnimatePresence>
  );
}
