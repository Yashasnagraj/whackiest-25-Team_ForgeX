// ============================================================
// DOODLE CANVAS
// Renders animated doodles/annotations on photos
// ============================================================

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { PlacedDoodle } from '../../services/memories/types';
import { getDoodleById, DOODLE_LIBRARY } from '../../services/memories';

interface DoodleCanvasProps {
  doodles: PlacedDoodle[];
  isPlaying: boolean;
  startTime: number;
}

export function DoodleCanvas({ doodles, isPlaying, startTime }: DoodleCanvasProps) {
  const [visibleDoodles, setVisibleDoodles] = useState<PlacedDoodle[]>([]);

  useEffect(() => {
    if (!isPlaying) {
      setVisibleDoodles([]);
      return;
    }

    // Schedule doodles to appear based on their delay
    const timeouts: ReturnType<typeof setTimeout>[] = [];

    doodles.forEach((doodle) => {
      const timeout = setTimeout(() => {
        setVisibleDoodles((prev) => [...prev, doodle]);
      }, doodle.delay * 1000);
      timeouts.push(timeout);
    });

    return () => {
      timeouts.forEach(clearTimeout);
    };
  }, [doodles, isPlaying, startTime]);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <AnimatePresence>
        {visibleDoodles.map((placedDoodle) => {
          const doodleAsset = getDoodleById(placedDoodle.doodleId);
          if (!doodleAsset) return null;

          return (
            <DoodleItem
              key={placedDoodle.id}
              placed={placedDoodle}
              asset={doodleAsset}
            />
          );
        })}
      </AnimatePresence>
    </div>
  );
}

interface DoodleItemProps {
  placed: PlacedDoodle;
  asset: (typeof DOODLE_LIBRARY)[number];
}

function DoodleItem({ placed, asset }: DoodleItemProps) {
  const animationVariants = getAnimationVariants(placed.animation);

  return (
    <motion.div
      key={placed.id}
      className="absolute"
      style={{
        left: `${placed.x}%`,
        top: `${placed.y}%`,
        transform: `translate(-50%, -50%) rotate(${placed.rotation}deg)`,
      }}
      initial={animationVariants.initial as Record<string, number>}
      animate={animationVariants.animate as Record<string, number>}
      exit={animationVariants.exit as Record<string, number>}
    >
      <div
        className="relative"
        style={{
          transform: `scale(${placed.scale})`,
        }}
      >
        {/* Speech bubble with text */}
        {placed.text && asset.category === 'speech' ? (
          <motion.div
            className="relative"
            animate={placed.animation === 'bounce' ? { y: [0, -5, 0] } : {}}
            transition={{ repeat: Infinity, duration: 1 }}
          >
            <svg width="80" height="60" viewBox="0 0 24 24" fill={asset.color}>
              <path d={asset.svgPath} />
            </svg>
            <span
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white font-bold text-sm whitespace-nowrap"
              style={{
                textShadow: '1px 1px 2px rgba(0,0,0,0.5)',
                marginTop: '-8px',
              }}
            >
              {placed.text}
            </span>
          </motion.div>
        ) : (
          <motion.svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill={asset.color}
            animate={getContinuousAnimation(placed.animation)}
            transition={{ repeat: Infinity, duration: 1.5 }}
          >
            {placed.animation === 'draw' ? (
              <motion.path
                d={asset.svgPath}
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 1, ease: 'easeInOut' }}
                stroke={asset.color}
                strokeWidth="1"
                fill="none"
              />
            ) : (
              <path d={asset.svgPath} />
            )}
          </motion.svg>
        )}

        {/* Sparkle effect for sparkle animation */}
        {placed.animation === 'sparkle' && (
          <motion.div
            className="absolute inset-0"
            animate={{
              opacity: [0.5, 1, 0.5],
              scale: [0.8, 1.2, 0.8],
            }}
            transition={{ repeat: Infinity, duration: 2 }}
          >
            <svg width="48" height="48" viewBox="0 0 24 24" fill={asset.color} opacity={0.3}>
              <path d={asset.svgPath} />
            </svg>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

function getAnimationVariants(animation: string): {
  initial: Record<string, number>;
  animate: Record<string, number | Record<string, unknown>>;
  exit: Record<string, number>;
} {
  switch (animation) {
    case 'pop-in':
      return {
        initial: { scale: 0, opacity: 0 },
        animate: {
          scale: 1,
          opacity: 1,
          transition: {
            type: 'spring',
            stiffness: 500,
            damping: 25,
          },
        },
        exit: { scale: 0, opacity: 0 },
      };

    case 'bounce':
      return {
        initial: { y: -50, opacity: 0 },
        animate: {
          y: 0,
          opacity: 1,
          transition: {
            type: 'spring',
            stiffness: 300,
            damping: 20,
          },
        },
        exit: { y: 50, opacity: 0 },
      };

    case 'draw':
      return {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
      };

    case 'wiggle':
      return {
        initial: { rotate: 0, scale: 0 },
        animate: {
          rotate: 0,
          scale: 1,
          transition: {
            type: 'spring',
            stiffness: 400,
            damping: 20,
          },
        },
        exit: { scale: 0, opacity: 0 },
      };

    case 'sparkle':
      return {
        initial: { scale: 0, opacity: 0 },
        animate: {
          scale: 1,
          opacity: 1,
          transition: { duration: 0.5 },
        },
        exit: { scale: 0, opacity: 0 },
      };

    case 'fade-in':
    default:
      return {
        initial: { opacity: 0 },
        animate: { opacity: 1, transition: { duration: 0.5 } },
        exit: { opacity: 0 },
      };
  }
}

function getContinuousAnimation(animation: string) {
  switch (animation) {
    case 'wiggle':
      return { rotate: [-5, 5, -5] };
    case 'bounce':
      return { y: [0, -5, 0] };
    case 'sparkle':
      return { opacity: [0.7, 1, 0.7] };
    default:
      return {};
  }
}

// Static doodle preview (for testing/showcase)
export function DoodlePreview() {
  return (
    <div className="grid grid-cols-5 gap-4 p-4">
      {DOODLE_LIBRARY.map((doodle) => (
        <div
          key={doodle.id}
          className="flex flex-col items-center gap-2 p-3 bg-gray-800 rounded-lg"
        >
          <svg width="32" height="32" viewBox="0 0 24 24" fill={doodle.color}>
            <path d={doodle.svgPath} />
          </svg>
          <span className="text-xs text-gray-400">{doodle.name}</span>
        </div>
      ))}
    </div>
  );
}
