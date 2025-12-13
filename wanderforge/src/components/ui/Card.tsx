import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import { clsx } from 'clsx';

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  gradient?: boolean;
  onClick?: () => void;
}

export default function Card({
  children,
  className = '',
  hover = true,
  gradient = false,
  onClick,
}: CardProps) {
  return (
    <motion.div
      className={clsx(
        'glass-card p-6',
        hover && 'cursor-pointer',
        gradient && 'gradient-border',
        className
      )}
      onClick={onClick}
      whileHover={hover ? { scale: 1.02, y: -5 } : {}}
      transition={{ duration: 0.3 }}
    >
      {children}
    </motion.div>
  );
}

interface FeatureCardProps {
  icon: ReactNode;
  title: string;
  description: string;
  color?: string;
  onClick?: () => void;
}

export function FeatureCard({
  icon,
  title,
  description,
  color = 'primary',
  onClick,
}: FeatureCardProps) {
  const colorClasses: Record<string, string> = {
    primary: 'from-primary-500 to-primary-600',
    secondary: 'from-secondary-500 to-secondary-600',
    green: 'from-emerald-500 to-emerald-600',
    purple: 'from-purple-500 to-purple-600',
    pink: 'from-pink-500 to-pink-600',
  };

  return (
    <motion.div
      className="feature-card cursor-pointer group"
      onClick={onClick}
      whileHover={{ scale: 1.02, y: -5 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className={clsx(
        'w-14 h-14 rounded-xl flex items-center justify-center mb-4',
        'bg-gradient-to-br',
        colorClasses[color] || colorClasses.primary,
        'shadow-lg group-hover:shadow-xl transition-shadow'
      )}>
        {icon}
      </div>
      <h3 className="text-xl font-display font-semibold text-dark-50 mb-2">
        {title}
      </h3>
      <p className="text-dark-400 leading-relaxed">
        {description}
      </p>
    </motion.div>
  );
}

interface StatsCardProps {
  value: string | number;
  label: string;
  icon?: ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
}

export function StatsCard({
  value,
  label,
  icon,
  trend,
  trendValue,
}: StatsCardProps) {
  const trendColors = {
    up: 'text-emerald-400',
    down: 'text-red-400',
    neutral: 'text-dark-400',
  };

  return (
    <Card hover={false}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-dark-400 text-sm mb-1">{label}</p>
          <p className="text-3xl font-display font-bold text-dark-50">{value}</p>
          {trend && trendValue && (
            <p className={clsx('text-sm mt-1', trendColors[trend])}>
              {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'} {trendValue}
            </p>
          )}
        </div>
        {icon && (
          <div className="w-12 h-12 rounded-xl bg-dark-700/50 flex items-center justify-center text-primary-400">
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
}
