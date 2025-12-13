import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface SafetyScoreRingProps {
  score: number;
  size?: number;
  strokeWidth?: number;
  showLabel?: boolean;
  label?: string;
}

export function SafetyScoreRing({
  score,
  size = 120,
  strokeWidth = 8,
  showLabel = true,
  label = 'Safety Score',
}: SafetyScoreRingProps) {
  const [animatedScore, setAnimatedScore] = useState(0);

  // Animate the score number
  useEffect(() => {
    const duration = 1500;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      setAnimatedScore(Math.round(score * easeOut));

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [score]);

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;

  // Color based on score
  const getColor = () => {
    if (score >= 80) return { stroke: '#10b981', text: 'text-emerald-400', bg: 'bg-emerald-500/20' };
    if (score >= 50) return { stroke: '#f59e0b', text: 'text-amber-400', bg: 'bg-amber-500/20' };
    return { stroke: '#ef4444', text: 'text-red-400', bg: 'bg-red-500/20' };
  };

  const colors = getColor();

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      {/* Background glow */}
      <div
        className={`absolute inset-0 rounded-full ${colors.bg} blur-xl opacity-50`}
        style={{ transform: 'scale(0.8)' }}
      />

      <svg className="w-full h-full -rotate-90" viewBox={`0 0 ${size} ${size}`}>
        {/* Background ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-dark-700"
        />

        {/* Progress ring */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.stroke}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          initial={{ strokeDasharray: circumference, strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference - progress }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
        />

        {/* Glowing effect on the progress end */}
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={colors.stroke}
          strokeWidth={strokeWidth + 4}
          fill="none"
          strokeLinecap="round"
          opacity={0.3}
          initial={{ strokeDasharray: circumference, strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference - progress }}
          transition={{ duration: 1.5, ease: 'easeOut' }}
          style={{ filter: 'blur(4px)' }}
        />
      </svg>

      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <motion.span
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
          className="text-3xl font-bold text-white"
        >
          {animatedScore}
        </motion.span>
        {showLabel && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-xs text-gray-400 mt-0.5"
          >
            {label}
          </motion.span>
        )}
      </div>
    </div>
  );
}

export default SafetyScoreRing;
