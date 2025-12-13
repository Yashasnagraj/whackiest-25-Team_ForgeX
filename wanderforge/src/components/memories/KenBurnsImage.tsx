// ============================================================
// KEN BURNS IMAGE
// Photo with cinematic pan/zoom effect
// ============================================================

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import type { KenBurnsConfig } from '../../services/memories/types';

interface KenBurnsImageProps {
  src: string;
  alt: string;
  config?: KenBurnsConfig;
  isPlaying: boolean;
  duration?: number;
  onComplete?: () => void;
}

const defaultConfig: KenBurnsConfig = {
  startScale: 1.0,
  endScale: 1.15,
  startX: 50,
  startY: 50,
  endX: 55,
  endY: 45,
  duration: 7,
  easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
};

export function KenBurnsImage({
  src,
  alt,
  config = defaultConfig,
  isPlaying,
  duration,
  onComplete,
}: KenBurnsImageProps) {
  const [key, setKey] = useState(0);

  // Reset animation when source changes
  useEffect(() => {
    setKey((prev) => prev + 1);
  }, [src]);

  const actualDuration = duration || config.duration;

  // Calculate transform origin based on focus point
  const originX = config.focusPoint?.x || 50;
  const originY = config.focusPoint?.y || 50;

  return (
    <div className="relative w-full h-full overflow-hidden bg-black">
      <motion.img
        key={`${src}-${key}`}
        src={src}
        alt={alt}
        className="absolute inset-0 w-full h-full object-cover"
        style={{
          transformOrigin: `${originX}% ${originY}%`,
        }}
        initial={{
          scale: config.startScale,
          x: `${(config.startX - 50) * 0.5}%`,
          y: `${(config.startY - 50) * 0.5}%`,
        }}
        animate={
          isPlaying
            ? {
                scale: config.endScale,
                x: `${(config.endX - 50) * 0.5}%`,
                y: `${(config.endY - 50) * 0.5}%`,
              }
            : {
                scale: config.startScale,
                x: `${(config.startX - 50) * 0.5}%`,
                y: `${(config.startY - 50) * 0.5}%`,
              }
        }
        transition={{
          duration: isPlaying ? actualDuration : 0,
          ease: [0.4, 0, 0.2, 1], // Smooth easing
        }}
        onAnimationComplete={() => {
          if (isPlaying && onComplete) {
            onComplete();
          }
        }}
      />

      {/* Vignette overlay for cinematic feel */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(ellipse at center,
              transparent 0%,
              transparent 50%,
              rgba(0,0,0,0.3) 100%
            )
          `,
        }}
      />
    </div>
  );
}

// Preset Ken Burns configurations for different scene types
export const kenBurnsPresets: Record<string, Partial<KenBurnsConfig>> = {
  // Zoom into subject
  zoomIn: {
    startScale: 1.0,
    endScale: 1.3,
    startX: 50,
    startY: 50,
    endX: 50,
    endY: 50,
  },

  // Zoom out to reveal
  zoomOut: {
    startScale: 1.3,
    endScale: 1.0,
    startX: 50,
    startY: 50,
    endX: 50,
    endY: 50,
  },

  // Pan left
  panLeft: {
    startScale: 1.15,
    endScale: 1.15,
    startX: 70,
    startY: 50,
    endX: 30,
    endY: 50,
  },

  // Pan right
  panRight: {
    startScale: 1.15,
    endScale: 1.15,
    startX: 30,
    startY: 50,
    endX: 70,
    endY: 50,
  },

  // Pan up
  panUp: {
    startScale: 1.15,
    endScale: 1.15,
    startX: 50,
    startY: 70,
    endX: 50,
    endY: 30,
  },

  // Pan down
  panDown: {
    startScale: 1.15,
    endScale: 1.15,
    startX: 50,
    startY: 30,
    endX: 50,
    endY: 70,
  },

  // Diagonal drift (most cinematic)
  diagonalDrift: {
    startScale: 1.0,
    endScale: 1.15,
    startX: 35,
    startY: 65,
    endX: 65,
    endY: 35,
  },

  // Portrait focus (zoom to face)
  portraitFocus: {
    startScale: 1.0,
    endScale: 1.25,
    startX: 50,
    startY: 30,
    endX: 50,
    endY: 30,
  },

  // Landscape sweep
  landscapeSweep: {
    startScale: 1.1,
    endScale: 1.1,
    startX: 20,
    startY: 50,
    endX: 80,
    endY: 50,
  },

  // Food close-up
  foodCloseup: {
    startScale: 1.05,
    endScale: 1.2,
    startX: 40,
    startY: 60,
    endX: 60,
    endY: 40,
  },
};

// Generate Ken Burns config based on scene analysis
export function generateKenBurnsFromAnalysis(
  sceneType: string,
  hasFaces: boolean,
  hasLandmark: boolean,
  focusPoint?: { x: number; y: number }
): KenBurnsConfig {
  let preset: Partial<KenBurnsConfig>;

  if (hasFaces) {
    preset = kenBurnsPresets.portraitFocus;
  } else if (hasLandmark) {
    preset = kenBurnsPresets.zoomOut; // Reveal the landmark
  } else {
    switch (sceneType) {
      case 'food':
        preset = kenBurnsPresets.foodCloseup;
        break;
      case 'scenic':
      case 'nature':
        preset = kenBurnsPresets.landscapeSweep;
        break;
      case 'portrait':
      case 'group':
        preset = kenBurnsPresets.portraitFocus;
        break;
      case 'activity':
      case 'nightlife':
        preset = kenBurnsPresets.zoomIn;
        break;
      default:
        preset = kenBurnsPresets.diagonalDrift;
    }
  }

  return {
    ...defaultConfig,
    ...preset,
    focusPoint,
    duration: 7 + Math.random() * 2, // 7-9 seconds
  };
}
