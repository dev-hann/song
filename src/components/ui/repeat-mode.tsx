'use client';

import { Repeat, Repeat1 } from 'lucide-react';
import { RepeatMode } from '@/constants';
import { cn } from '@/lib/utils';

interface RepeatModeButtonProps {
  mode: RepeatMode;
  onToggle: () => void;
}

/**
 * Repeat mode toggle button with cycle through OFF → ALL → ONE.
 * Shows different icons based on current mode.
 */
export function RepeatModeButton({ mode, onToggle }: RepeatModeButtonProps) {
  const getIcon = () => {
    switch (mode) {
      case RepeatMode.OFF:
        return <Repeat size={20} />;
      case RepeatMode.ALL:
        return <Repeat size={20} className="text-white" />;
      case RepeatMode.ONE:
        return <Repeat1 size={20} className="text-white" />;
    }
  };

  return (
    <button
      onClick={onToggle}
      className={cn(
        'w-11 h-11 flex items-center justify-center text-zinc-400 active:scale-95 transition-transform relative',
        mode !== RepeatMode.OFF && 'text-white',
      )}
    >
      {getIcon()}
      {mode === RepeatMode.ONE && (
        <span className="absolute top-1 right-1 text-[10px] font-bold text-white">1</span>
      )}
    </button>
  );
}
