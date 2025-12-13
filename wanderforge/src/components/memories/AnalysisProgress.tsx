// ============================================================
// ANALYSIS PROGRESS - ULTRATHINK EDITION
// Real-time visualization of AI photo analysis
// Shows what AI is detecting live!
// ============================================================

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCinematicMemoriesStore } from '../../stores/cinematic-memories.store';

export function AnalysisProgress() {
  const { analysisStage, analysisProgress, currentDetections, analysisMessage } = useCinematicMemoriesStore();
  const [showDetections, setShowDetections] = useState<string[]>([]);

  // Animate detection items appearing
  useEffect(() => {
    if (currentDetections.length > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShowDetections([]);
      currentDetections.forEach((detection, index) => {
        setTimeout(() => {
          setShowDetections((prev) => [...prev, detection]);
        }, index * 200);
      });
    }
  }, [currentDetections]);

  if (analysisStage === 'idle' || analysisStage === 'complete') {
    return null;
  }

  const progress = analysisProgress.total > 0
    ? (analysisProgress.current / analysisProgress.total) * 100
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="bg-gradient-to-r from-purple-900/40 to-pink-900/40 rounded-2xl p-6 backdrop-blur-sm border border-purple-500/30"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
            className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center"
          >
            <span className="text-xl">🤖</span>
          </motion.div>
          <div>
            <h3 className="text-lg font-semibold text-white">AI Analysis in Progress</h3>
            <p className="text-sm text-gray-400">{getStageMessage(analysisStage)}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-white">
            {analysisProgress.current}/{analysisProgress.total}
          </p>
          <p className="text-xs text-gray-400">photos processed</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="relative h-3 bg-gray-800 rounded-full overflow-hidden mb-4">
        <motion.div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5 }}
        />
        <motion.div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 rounded-full opacity-50 blur-sm"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>

      {/* Current message */}
      <AnimatePresence mode="wait">
        {analysisMessage && (
          <motion.p
            key={analysisMessage}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="text-sm text-gray-300 mb-4"
          >
            {analysisMessage}
          </motion.p>
        )}
      </AnimatePresence>

      {/* Live detections - AI Thinking Display */}
      <AnimatePresence>
        {(showDetections.length > 0 || analysisStage === 'analyzing') && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-black/30 rounded-xl p-4"
          >
            {/* AI Thinking Header */}
            <div className="flex items-center gap-2 mb-3">
              <motion.div
                className="flex items-center gap-1"
                animate={{ opacity: [1, 0.5, 1] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
              >
                <span className="w-2 h-2 bg-green-400 rounded-full" />
                <span className="w-2 h-2 bg-green-400 rounded-full animation-delay-200" />
                <span className="w-2 h-2 bg-green-400 rounded-full animation-delay-400" />
              </motion.div>
              <span className="text-xs text-green-400 font-medium uppercase tracking-wider">
                AI Detecting...
              </span>
            </div>

            {/* Detection Tags */}
            <div className="flex flex-wrap gap-2">
              <AnimatePresence mode="popLayout">
                {showDetections.map((detection, index) => (
                  <motion.span
                    key={`${detection}-${index}`}
                    initial={{ opacity: 0, scale: 0.5, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.5 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    className="px-3 py-1.5 bg-gradient-to-r from-purple-500/40 to-pink-500/40 border border-purple-500/60 rounded-full text-sm text-white font-medium shadow-lg shadow-purple-500/20"
                  >
                    {getDetectionIcon(detection)} {detection}
                  </motion.span>
                ))}
              </AnimatePresence>

              {/* Placeholder while AI is thinking */}
              {showDetections.length === 0 && analysisStage === 'analyzing' && (
                <motion.span
                  className="px-3 py-1.5 bg-gray-700/50 border border-gray-600 rounded-full text-sm text-gray-400"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                >
                  Scanning photo...
                </motion.span>
              )}
            </div>

            {/* Detection Count */}
            {showDetections.length > 0 && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-xs text-gray-500 mt-3"
              >
                Found {showDetections.length} element{showDetections.length !== 1 ? 's' : ''} in this photo
              </motion.p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Analysis stages indicator */}
      <div className="flex items-center justify-center gap-6 mt-4 pt-4 border-t border-gray-700/50">
        <StageIndicator
          icon="📤"
          label="Upload"
          isActive={analysisStage === 'uploading'}
          isComplete={analysisStage === 'analyzing' || analysisStage === 'generating'}
        />
        <StageIndicator
          icon="🔍"
          label="Analyze"
          isActive={analysisStage === 'analyzing'}
          isComplete={analysisStage === 'generating'}
        />
        <StageIndicator
          icon="📖"
          label="Story"
          isActive={analysisStage === 'generating'}
          isComplete={false}
        />
      </div>
    </motion.div>
  );
}

interface StageIndicatorProps {
  icon: string;
  label: string;
  isActive: boolean;
  isComplete: boolean;
}

function StageIndicator({ icon, label, isActive, isComplete }: StageIndicatorProps) {
  return (
    <div className="flex flex-col items-center gap-1">
      <motion.div
        className={`w-10 h-10 rounded-full flex items-center justify-center ${
          isActive
            ? 'bg-purple-500'
            : isComplete
              ? 'bg-green-500'
              : 'bg-gray-700'
        }`}
        animate={isActive ? { scale: [1, 1.1, 1] } : {}}
        transition={{ repeat: isActive ? Infinity : 0, duration: 1 }}
      >
        {isComplete ? '✓' : icon}
      </motion.div>
      <span className={`text-xs ${isActive ? 'text-purple-400' : 'text-gray-500'}`}>
        {label}
      </span>
    </div>
  );
}

function getStageMessage(stage: string): string {
  switch (stage) {
    case 'uploading':
      return 'Preparing your photos...';
    case 'analyzing':
      return 'AI is examining each photo...';
    case 'generating':
      return 'Creating your documentary...';
    default:
      return 'Processing...';
  }
}

function getDetectionIcon(detection: string): string {
  const lower = detection.toLowerCase();
  if (lower.includes('joy') || lower.includes('happy') || lower.includes('smile')) return '😊';
  if (lower.includes('awe') || lower.includes('wow')) return '😮';
  if (lower.includes('food') || lower.includes('dish') || lower.includes('meal')) return '🍽️';
  if (lower.includes('temple') || lower.includes('monument') || lower.includes('landmark')) return '🏛️';
  if (lower.includes('nature') || lower.includes('mountain') || lower.includes('tree')) return '🌿';
  if (lower.includes('beach') || lower.includes('ocean') || lower.includes('sea')) return '🏖️';
  if (lower.includes('person') || lower.includes('people') || lower.includes('face')) return '👤';
  if (lower.includes('sunset') || lower.includes('sunrise') || lower.includes('golden')) return '🌅';
  if (lower.includes('night') || lower.includes('dark') || lower.includes('evening')) return '🌙';
  return '✨';
}
