'use client';

import { Heart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useRef } from 'react';

interface LikeButtonProps {
  isLiked: boolean;
  onToggle: () => void;
}

/**
 * Like button component with heart icon and animation.
 * Animates the heart when liked for visual feedback.
 */
export function LikeButton({ isLiked, onToggle }: LikeButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);

  const handleToggle = () => {
    if (!isLiked && buttonRef.current) {
      const icon = buttonRef.current.querySelector('svg');
      icon?.classList.add('like-animation');
      setTimeout(() => {
        icon?.classList.remove('like-animation');
      }, 400);
    }
    onToggle();
  };

  return (
    <button
      ref={buttonRef}
      onClick={handleToggle}
      className={cn(
        'w-11 h-11 flex items-center justify-center active:scale-95 transition-transform',
        'relative',
      )}
      aria-label={isLiked ? '좋아요 취소' : '좋아요'}
    >
      <Heart
        size={20}
        className={cn(
          'transition-colors',
          isLiked ? 'fill-white text-white' : 'text-zinc-400',
        )}
      />
    </button>
  );
}
