"use client";

import { useRef, useEffect } from 'react';
import type { LyricsLine } from '@/types';
import { cn } from '@/lib/utils';

interface LyricsDisplayProps {
  lines: LyricsLine[] | null;
  currentTimeMs: number;
  onSeek: (timeMs: number) => void;
  isLoading?: boolean;
}

function getActiveLineIndex(lines: LyricsLine[], currentTimeMs: number): number {
  for (let i = lines.length - 1; i >= 0; i--) {
    if (currentTimeMs >= lines[i].startTimeMs) {
      return i;
    }
  }
  return -1;
}

export function LyricsDisplay({ lines, currentTimeMs, onSeek, isLoading }: LyricsDisplayProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const activeIndex = lines ? getActiveLineIndex(lines, currentTimeMs) : -1;

  useEffect(() => {
    if (activeIndex < 0 || !containerRef.current) {return;}

    const activeEl = containerRef.current.querySelector(`[data-line-index="${activeIndex}"]`);
    if (activeEl && typeof activeEl.scrollIntoView === 'function') {
      activeEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [activeIndex]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-sm text-muted">가사 불러오는 중...</p>
      </div>
    );
  }

  if (!lines || lines.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-sm text-muted">가사를 찾을 수 없습니다</p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="space-y-3 py-4">
      {lines.map((line, i) => {
        const isActive = i === activeIndex;
        return (
          <button
            key={i}
            data-line-index={i}
            data-line-active={isActive || undefined}
            onClick={() => { onSeek(line.startTimeMs); }}
            className={cn(
              'block w-full text-left px-4 py-1.5 rounded-lg transition-all duration-300',
              isActive
                ? 'text-foreground font-bold text-lg scale-[1.02]'
                : 'text-muted text-base active:bg-accent',
            )}
          >
            {line.text}
          </button>
        );
      })}
    </div>
  );
}
