'use client';

import { useEffect, useRef } from 'react';

interface UseSwipeDownProps {
  onSwipeDown: () => void;
  threshold?: number;
}

/**
 * Custom hook for detecting swipe down gestures.
 * Useful for closing modals or full-screen views on mobile.
 *
 * @param props - Configuration options for swipe detection
 * @returns Ref object to attach to swipeable element
 */
export function useSwipeDown({ onSwipeDown, threshold = 100 }: UseSwipeDownProps) {
  const touchStartRef = useRef(0);
  const touchEndRef = useRef(0);
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const handleTouchStart = (e: TouchEvent) => {
      touchEndRef.current = e.touches[0].clientY;
      touchStartRef.current = e.touches[0].clientY;
    };

    const handleTouchMove = (e: TouchEvent) => {
      touchEndRef.current = e.touches[0].clientY;
    };

    const handleTouchEnd = () => {
      const distance = touchEndRef.current - touchStartRef.current;

      // Trigger swipe down if distance exceeds threshold and movement is downward
      if (distance > threshold && Math.abs(touchStartRef.current - touchEndRef.current) > 10) {
        onSwipeDown();
      }
    };

    element.addEventListener('touchstart', handleTouchStart);
    element.addEventListener('touchmove', handleTouchMove);
    element.addEventListener('touchend', handleTouchEnd);

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [onSwipeDown, threshold]);

  return { elementRef };
}
