'use client';

import { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface ControlButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'ghost' | 'icon';
  active?: boolean;
}

/**
 * Reusable control button component with size and variant options.
 * Used for playback controls throughout the app.
 */
export const ControlButton = forwardRef<HTMLButtonElement, ControlButtonProps>(
  ({ size = 'md', variant = 'default', active, className, children, ...props }, ref) => {
    const sizeStyles = {
      sm: 'w-11 h-11',
      md: 'w-11 h-11',
      lg: 'w-16 h-16',
    };

    const variantStyles = {
      default: 'bg-white text-black',
      ghost: 'text-white hover:bg-white/10',
      icon: 'text-white active:scale-95 transition-transform',
    };

    return (
      <button
        ref={ref}
        className={cn(
          'flex items-center justify-center rounded-full',
          sizeStyles[size],
          variantStyles[variant],
          active && 'bg-zinc-700',
          className,
        )}
        {...props}
      >
        {children}
      </button>
    );
  },
);

ControlButton.displayName = 'ControlButton';
