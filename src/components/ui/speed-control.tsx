'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';

const SPEED_OPTIONS = [0.5, 0.75, 1, 1.25, 1.5, 2];

interface SpeedControlProps {
  speed: number;
  onChange: (speed: number) => void;
}

/**
 * Playback speed control dropdown.
 * Allows selecting from predefined speed options.
 */
export function SpeedControl({ speed, onChange }: SpeedControlProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-4 py-2 text-sm font-medium text-zinc-400 border border-zinc-700 rounded-full hover:border-zinc-500 transition-colors active:scale-95"
      >
        {speed}x
      </button>

      {isOpen && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden shadow-xl z-50 min-w-[80px]">
          {SPEED_OPTIONS.map((option) => (
            <button
              key={option}
              onClick={() => {
                onChange(option);
                setIsOpen(false);
              }}
              className={cn(
                'w-full py-3 text-sm text-center px-4 hover:bg-zinc-800 transition-colors active:scale-95',
                speed === option ? 'text-white font-medium' : 'text-zinc-400',
              )}
            >
              {option}x
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
