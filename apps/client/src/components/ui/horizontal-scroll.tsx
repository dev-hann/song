import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface HorizontalScrollProps {
  children: ReactNode;
  className?: string;
}

export function HorizontalScroll({ children, className }: HorizontalScrollProps) {
  return (
    <div
      className={cn(
        'flex gap-3 overflow-x-auto hide-scrollbar px-4 -mx-4 scroll-smooth snap-x snap-mandatory',
        className,
      )}
    >
      {children}
    </div>
  );
}
