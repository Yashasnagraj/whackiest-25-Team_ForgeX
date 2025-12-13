// ============================================================
// NARRATION OVERLAY
// Typewriter text effect for documentary narration
// ============================================================

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface NarrationOverlayProps {
  narration: string;
  caption?: string;
  isPlaying: boolean;
  delay?: number; // Delay before starting narration
  typingSpeed?: number; // ms per character
  showCaption?: boolean;
}

export function NarrationOverlay({
  narration,
  caption,
  isPlaying,
  delay = 2000,
  typingSpeed = 40,
  showCaption = true,
}: NarrationOverlayProps) {
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showCaptionText, setShowCaptionText] = useState(false);

  // Typewriter effect for narration
  useEffect(() => {
    if (!isPlaying) {
      setDisplayedText('');
      setIsTyping(false);
      setShowCaptionText(false);
      return;
    }

    // Delay before starting
    const startTimeout = setTimeout(() => {
      setIsTyping(true);
      setShowCaptionText(true);
    }, delay);

    return () => clearTimeout(startTimeout);
  }, [isPlaying, delay]);

  // Type out characters
  useEffect(() => {
    if (!isTyping || !narration) return;

    let currentIndex = 0;
    setDisplayedText('');

    const typeInterval = setInterval(() => {
      if (currentIndex < narration.length) {
        setDisplayedText(narration.slice(0, currentIndex + 1));
        currentIndex++;
      } else {
        clearInterval(typeInterval);
      }
    }, typingSpeed);

    return () => clearInterval(typeInterval);
  }, [isTyping, narration, typingSpeed]);

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-end">
      {/* Gradient overlay at bottom */}
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />

      {/* Caption (appears quickly) */}
      <AnimatePresence>
        {showCaption && caption && showCaptionText && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.5 }}
            className="relative z-10 px-8 mb-4"
          >
            <p className="text-xl md:text-2xl font-bold text-white drop-shadow-lg">
              {caption}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Narration with typewriter */}
      <div className="relative z-10 px-8 pb-8">
        <AnimatePresence>
          {isTyping && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="relative"
            >
              <p className="text-base md:text-lg text-white/90 leading-relaxed font-light italic max-w-3xl">
                "{displayedText}
                <motion.span
                  animate={{ opacity: [1, 0, 1] }}
                  transition={{ repeat: Infinity, duration: 0.8 }}
                  className="inline-block w-0.5 h-5 bg-white ml-0.5 align-middle"
                />
                "
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// Alternative: Fade-in narration (non-typewriter)
export function NarrationFadeOverlay({
  narration,
  caption,
  isPlaying,
  delay = 2000,
}: Omit<NarrationOverlayProps, 'typingSpeed' | 'showCaption'>) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!isPlaying) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsVisible(false);
      return;
    }

    const timeout = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timeout);
  }, [isPlaying, delay]);

  return (
    <div className="absolute inset-0 pointer-events-none flex flex-col justify-end">
      {/* Gradient overlay */}
      <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />

      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 1 }}
            className="relative z-10 px-8 pb-8"
          >
            {caption && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-xl md:text-2xl font-bold text-white mb-3 drop-shadow-lg"
              >
                {caption}
              </motion.p>
            )}
            <p className="text-base md:text-lg text-white/90 leading-relaxed font-light italic max-w-3xl">
              "{narration}"
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Scene title card (for transitions)
export function SceneTitleCard({
  title,
  subtitle,
  isVisible,
}: {
  title: string;
  subtitle?: string;
  isVisible: boolean;
}) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          className="absolute inset-0 bg-black/80 flex items-center justify-center"
        >
          <div className="text-center">
            <motion.h2
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-3xl md:text-5xl font-bold text-white mb-4"
            >
              {title}
            </motion.h2>
            {subtitle && (
              <motion.p
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-lg md:text-xl text-white/70"
              >
                {subtitle}
              </motion.p>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
