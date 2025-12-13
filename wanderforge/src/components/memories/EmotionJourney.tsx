// ============================================================
// EMOTION JOURNEY
// Visualization of the emotional arc through the story
// ============================================================

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import type { MemoryScene, EmotionType } from '../../services/memories/types';

interface EmotionJourneyProps {
  scenes: MemoryScene[];
  currentSceneIndex: number;
  onSceneClick?: (index: number) => void;
}

const emotionColors: Record<EmotionType, string> = {
  joy: '#FFD93D',
  excitement: '#FF6B6B',
  awe: '#9B59B6',
  love: '#FF69B4',
  peace: '#4ECDC4',
  adventure: '#FF8C42',
  nostalgia: '#DDA0DD',
  contemplative: '#6C5B7B',
  tired: '#95A5A6',
  neutral: '#BDC3C7',
};

const emotionEmojis: Record<EmotionType, string> = {
  joy: '😊',
  excitement: '🎉',
  awe: '😮',
  love: '❤️',
  peace: '😌',
  adventure: '🚀',
  nostalgia: '🥹',
  contemplative: '🤔',
  tired: '😴',
  neutral: '😐',
};

export function EmotionJourney({ scenes, currentSceneIndex, onSceneClick }: EmotionJourneyProps) {
  // Calculate SVG path for the emotion curve
  const { path, points } = useMemo(() => {
    if (scenes.length === 0) return { path: '', points: [] };

    const width = 100;
    const height = 50;
    const padding = 10;

    const points = scenes.map((scene, index) => ({
      x: padding + (index / Math.max(scenes.length - 1, 1)) * (width - padding * 2),
      y: height - padding - scene.emotionalArc.intensity * (height - padding * 2),
      emotion: scene.emotionalArc.emotion,
      title: scene.title,
    }));

    // Create smooth curve through points
    const path = points.reduce((acc, point, index) => {
      if (index === 0) {
        return `M ${point.x} ${point.y}`;
      }

      const prev = points[index - 1];
      const cpX = (prev.x + point.x) / 2;

      return `${acc} C ${cpX} ${prev.y}, ${cpX} ${point.y}, ${point.x} ${point.y}`;
    }, '');

    return { path, points };
  }, [scenes]);

  if (scenes.length === 0) {
    return null;
  }

  return (
    <div className="bg-gray-900/50 rounded-xl p-4 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-400">Emotion Journey</h3>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span>Low</span>
          <div className="w-20 h-1 bg-gradient-to-r from-gray-600 to-purple-500 rounded" />
          <span>High</span>
        </div>
      </div>

      {/* SVG Graph */}
      <div className="relative h-20">
        <svg viewBox="0 0 100 50" className="w-full h-full" preserveAspectRatio="none">
          {/* Grid lines */}
          <defs>
            <linearGradient id="emotionGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              {points.map((point, index) => (
                <stop
                  key={index}
                  offset={`${(index / Math.max(points.length - 1, 1)) * 100}%`}
                  stopColor={emotionColors[point.emotion]}
                />
              ))}
            </linearGradient>
          </defs>

          {/* Horizontal grid lines */}
          {[0.25, 0.5, 0.75].map((y) => (
            <line
              key={y}
              x1="10"
              y1={50 - y * 40}
              x2="90"
              y2={50 - y * 40}
              stroke="rgba(255,255,255,0.1)"
              strokeDasharray="2,2"
            />
          ))}

          {/* Area fill */}
          <motion.path
            d={`${path} L ${90} ${45} L ${10} ${45} Z`}
            fill="url(#emotionGradient)"
            fillOpacity="0.2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1 }}
          />

          {/* Main curve */}
          <motion.path
            d={path}
            fill="none"
            stroke="url(#emotionGradient)"
            strokeWidth="2"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.5, ease: 'easeInOut' }}
          />

          {/* Points */}
          {points.map((point, index) => (
            <motion.g
              key={index}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5 + index * 0.1 }}
              style={{ cursor: onSceneClick ? 'pointer' : 'default' }}
              onClick={() => onSceneClick?.(index)}
            >
              {/* Outer ring for current scene */}
              {index === currentSceneIndex && (
                <motion.circle
                  cx={point.x}
                  cy={point.y}
                  r="4"
                  fill="none"
                  stroke={emotionColors[point.emotion]}
                  strokeWidth="1"
                  animate={{ scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                />
              )}

              {/* Main point */}
              <circle
                cx={point.x}
                cy={point.y}
                r={index === currentSceneIndex ? 4 : 3}
                fill={emotionColors[point.emotion]}
                className="transition-all duration-300"
              />
            </motion.g>
          ))}
        </svg>

        {/* Progress indicator */}
        <motion.div
          className="absolute top-0 h-full w-0.5 bg-white/50"
          style={{
            left: `${10 + (currentSceneIndex / Math.max(scenes.length - 1, 1)) * 80}%`,
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Scene labels */}
      <div className="flex justify-between mt-2 overflow-x-auto">
        {scenes.map((scene, index) => (
          <motion.button
            key={scene.id}
            onClick={() => onSceneClick?.(index)}
            className={`flex flex-col items-center gap-1 px-2 py-1 rounded transition-all min-w-0 ${
              index === currentSceneIndex
                ? 'bg-white/10'
                : 'hover:bg-white/5'
            }`}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span className="text-lg">{emotionEmojis[scene.emotionalArc.emotion]}</span>
            <span
              className={`text-xs truncate max-w-[60px] ${
                index === currentSceneIndex ? 'text-white' : 'text-gray-500'
              }`}
            >
              {scene.title}
            </span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}

// Compact version for player controls
export function EmotionJourneyCompact({
  scenes,
  currentSceneIndex,
}: {
  scenes: MemoryScene[];
  currentSceneIndex: number;
}) {
  return (
    <div className="flex items-center gap-1">
      {scenes.map((scene, index) => (
        <motion.div
          key={scene.id}
          className={`w-8 h-2 rounded-full transition-all ${
            index === currentSceneIndex
              ? 'opacity-100'
              : index < currentSceneIndex
                ? 'opacity-60'
                : 'opacity-30'
          }`}
          style={{ backgroundColor: emotionColors[scene.emotionalArc.emotion] }}
          animate={
            index === currentSceneIndex
              ? { scale: [1, 1.1, 1] }
              : {}
          }
          transition={{ repeat: index === currentSceneIndex ? Infinity : 0, duration: 1 }}
        />
      ))}
    </div>
  );
}
