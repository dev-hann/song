import { Play, Shuffle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PlayShuffleButtonsProps {
  onPlay: () => void;
  onShuffle: () => void;
  disabled?: boolean;
  className?: string;
}

export function PlayShuffleButtons({
  onPlay,
  onShuffle,
  disabled = false,
  className,
}: PlayShuffleButtonsProps) {
  return (
    <div className={cn('flex items-center justify-center gap-4', className)}>
      <button
        onClick={onShuffle}
        className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-accent text-sm text-foreground active:bg-secondary"
      >
        <Shuffle size={16} />
        셔플
      </button>
      <button
        onClick={onPlay}
        disabled={disabled}
        className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-foreground text-background text-sm font-medium active:scale-95 transition-transform disabled:opacity-40"
      >
        <Play size={16} fill="currentColor" />
        재생
      </button>
    </div>
  );
}
