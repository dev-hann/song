'use client';

import { Check } from 'lucide-react';
import Image from 'next/image';
import { formatDuration } from '@/lib/formatters';
import { cn } from '@/lib/utils';

interface CheckboxTrackItemProps {
  videoId: string;
  title: string;
  channel: string;
  thumbnail: string;
  duration: number;
  selected: boolean;
  onToggle: (videoId: string) => void;
}

export function CheckboxTrackItem({
  videoId,
  title,
  channel,
  thumbnail,
  duration,
  selected,
  onToggle,
}: CheckboxTrackItemProps) {
  return (
    <button
      onClick={() => { onToggle(videoId); }}
      className={cn(
        'w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-colors active:bg-white/5',
        selected && 'bg-white/5',
      )}
    >
      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
        selected ? 'bg-primary border-primary' : 'border-border'
      }`}>
        {selected && <Check size={14} className="text-primary-foreground" />}
      </div>
      <div className="w-10 h-10 rounded-lg overflow-hidden bg-surface flex-shrink-0">
        {thumbnail && (
          <Image src={thumbnail} alt={title} className="w-full h-full object-cover" loading="lazy" unoptimized width={40} height={40} />
        )}
      </div>
      <div className="flex-1 min-w-0 text-left">
        <p className="text-sm font-medium truncate text-foreground">{title}</p>
        <p className="text-xs text-muted truncate mt-0.5">
          {channel}{duration > 0 ? ` · ${formatDuration(duration)}` : ''}
        </p>
      </div>
    </button>
  );
}
