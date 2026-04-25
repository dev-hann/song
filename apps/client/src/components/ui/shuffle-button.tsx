import { Shuffle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ShuffleButtonProps {
  isShuffle: boolean;
  onToggle: () => void;
}

export function ShuffleButton({ isShuffle, onToggle }: ShuffleButtonProps) {
  return (
    <button
      onClick={onToggle}
      className={cn(
        'w-11 h-11 flex items-center justify-center active:scale-95 transition-transform',
        isShuffle ? 'text-white' : 'text-zinc-400',
      )}
      aria-label={isShuffle ? '셔플 끄기' : '셔플 켜기'}
    >
      <Shuffle size={20} />
    </button>
  );
}
