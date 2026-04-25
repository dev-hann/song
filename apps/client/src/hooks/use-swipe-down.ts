import { useEffect, useRef, useCallback, useState } from 'react';

interface UseSwipeDownProps {
  onSwipeDown: () => void;
  threshold?: number;
}

export function useSwipeDown({ onSwipeDown, threshold = 100 }: UseSwipeDownProps) {
  const touchStartRef = useRef(0);
  const touchEndRef = useRef(0);
  const elementRef = useRef<HTMLDivElement>(null);
  const [element, setElement] = useState<HTMLDivElement | null>(null);

  const ref = useCallback((node: HTMLDivElement | null) => {
    elementRef.current = node;
    setElement(node);
  }, []);

  useEffect(() => {
    if (!element) return;

    const handleTouchStart = (e: TouchEvent) => {
      touchEndRef.current = e.touches[0].clientY;
      touchStartRef.current = e.touches[0].clientY;
    };

    const handleTouchMove = (e: TouchEvent) => {
      touchEndRef.current = e.touches[0].clientY;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (e.changedTouches.length > 0) {
        touchEndRef.current = e.changedTouches[0].clientY;
      }
      const distance = touchEndRef.current - touchStartRef.current;

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
  }, [element, onSwipeDown, threshold]);

  return { elementRef: ref };
}
