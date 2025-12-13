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
        initial={{ opacity: 0, y: 10, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 10, scale: 0.95 }}
        className="flex items-center gap-3 px-4 py-2"
      >
        <div className="flex items-center gap-2 px-3 py-2 bg-dark-700/50 backdrop-blur-sm rounded-xl border border-white/5">
          {/* Animated dots with gradient */}
          <div className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                className="w-2 h-2 rounded-full bg-gradient-to-r from-accent-cyan to-accent-purple"
                animate={{
                  scale: [0.8, 1.2, 0.8],
                  opacity: [0.5, 1, 0.5],
                }}
                transition={{
                  duration: 1.2,
                  repeat: Infinity,
                  delay: i * 0.15,
                  ease: 'easeInOut',
                }}
              />
            ))}
          </div>
          <span className="text-sm text-gray-400">{text}</span>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
