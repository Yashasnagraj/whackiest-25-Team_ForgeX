import { ReactNode, useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface ImpactStatCardProps {
  value: number;
  label: string;
  icon: ReactNode;
  color?: 'emerald' | 'amber' | 'red' | 'cyan' | 'primary';
  trend?: string;
  suffix?: string;
  delay?: number;
}

// Simple count-up animation hook
function useCountUp(end: number, duration: number = 1500) {
  const [count, setCount] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);

  useEffect(() => {
    // Skip if already at target or if we've animated to this value
    if (count === end && hasAnimated) return;

    let animationId: number;
    let startTime: number | null = null;
    const startValue = count;

    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease out cubic
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const currentValue = Math.round(startValue + (end - startValue) * easeOut);

      if (progress < 1) {
        setCount(currentValue);
        animationId = requestAnimationFrame(animate);
      } else {
        setCount(end);
        setHasAnimated(true);
      }
    };

    animationId = requestAnimationFrame(animate);

    return () => {
      if (animationId) cancelAnimationFrame(animationId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [end, duration]);

  return count;
}

const colorClasses = {
  emerald: {
    gradient: 'from-emerald-500 to-emerald-400',
    bg: 'bg-emerald-500/20',
    text: 'text-emerald-400',
    icon: 'text-emerald-400',
  },
  amber: {
    gradient: 'from-amber-500 to-amber-400',
    bg: 'bg-amber-500/20',
    text: 'text-amber-400',
    icon: 'text-amber-400',
  },
  red: {
    gradient: 'from-red-500 to-red-400',
    bg: 'bg-red-500/20',
    text: 'text-red-400',
    icon: 'text-red-400',
  },
  cyan: {
    gradient: 'from-cyan-500 to-cyan-400',
    bg: 'bg-cyan-500/20',
    text: 'text-cyan-400',
    icon: 'text-cyan-400',
  },
  primary: {
    gradient: 'from-primary-500 to-primary-400',
    bg: 'bg-primary-500/20',
    text: 'text-primary-400',
    icon: 'text-primary-400',
  },
};

export function ImpactStatCard({
  value,
  label,
  icon,
  color = 'emerald',
  trend,
  suffix,
  delay = 0,
}: ImpactStatCardProps) {
  const animatedValue = useCountUp(value);
  const colors = colorClasses[color];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: delay * 0.1 }}
      className="relative overflow-hidden rounded-2xl bg-dark-800/50 backdrop-blur-sm border border-dark-700 p-6 group hover:border-dark-600 transition-colors"
    >
      {/* Gradient accent bar */}
      <div
        className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${colors.gradient}`}
      />

      {/* Organic background glow */}
      <div
        className={`absolute -right-8 -bottom-8 w-24 h-24 rounded-full ${colors.bg} blur-2xl opacity-50 group-hover:opacity-75 transition-opacity`}
      />

      {/* Icon */}
      <div
        className={`relative w-12 h-12 rounded-xl ${colors.bg} flex items-center justify-center mb-4`}
      >
        <span className={colors.icon}>{icon}</span>
      </div>

      {/* Value with count-up animation */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: delay * 0.1 + 0.2 }}
        className="relative text-4xl font-bold text-white mb-1"
      >
        {animatedValue}
        {suffix && <span className="text-2xl text-gray-400 ml-1">{suffix}</span>}
      </motion.div>

      {/* Label */}
      <div className="relative text-gray-400 text-sm font-medium">{label}</div>

      {/* Trend indicator */}
      {trend && (
        <div className={`relative text-xs ${colors.text} mt-3 flex items-center gap-1.5`}>
          <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
          {trend}
        </div>
      )}
    </motion.div>
  );
}

export default ImpactStatCard;
