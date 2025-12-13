import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import { clsx } from 'clsx';

interface ButtonProps {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
  glow?: boolean;
}

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  onClick,
  disabled = false,
  icon,
  iconPosition = 'right',
  glow = false,
}: ButtonProps) {
  const baseStyles = 'inline-flex items-center justify-center font-display font-semibold rounded-full transition-all duration-300 ease-out disabled:opacity-50 disabled:cursor-not-allowed';

  const variants = {
    primary: 'bg-gradient-to-r from-primary-500 to-primary-600 text-white hover:from-primary-400 hover:to-primary-500 shadow-lg hover:shadow-primary-500/50 hover:shadow-xl',
    secondary: 'bg-gradient-to-r from-secondary-500 to-secondary-600 text-white hover:from-secondary-400 hover:to-secondary-500 shadow-lg hover:shadow-secondary-500/50 hover:shadow-xl',
    ghost: 'bg-dark-800/50 text-dark-100 border border-dark-700 hover:bg-dark-700/50 hover:border-primary-500/50',
    danger: 'bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-400 hover:to-red-500 shadow-lg hover:shadow-red-500/50',
  };

  const sizes = {
    sm: 'px-4 py-2 text-sm gap-2',
    md: 'px-6 py-3 text-base gap-2',
    lg: 'px-8 py-4 text-lg gap-3',
  };

  return (
    <motion.button
      className={clsx(
        baseStyles,
        variants[variant],
        sizes[size],
        glow && 'animate-glow',
        className
      )}
      onClick={onClick}
      disabled={disabled}
      whileHover={{ scale: disabled ? 1 : 1.05 }}
      whileTap={{ scale: disabled ? 1 : 0.95 }}
    >
      {icon && iconPosition === 'left' && <span>{icon}</span>}
      {children}
      {icon && iconPosition === 'right' && <span>{icon}</span>}
    </motion.button>
  );
}
