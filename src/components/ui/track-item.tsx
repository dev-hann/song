import Image from 'next/image';
import { formatDuration } from '@/lib/formatters';
import { cn } from '@/lib/utils';

interface TrackItemProps {
  id: string;
  title: string;
  channel: string;
  thumbnail: string;
  duration: number;
  isActive?: boolean;
  onClick?: () => void;
}

export function TrackItem({
  title,
  channel,
  thumbnail,
  duration,
  isActive,
  onClick,
}: TrackItemProps) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if ((e.key === 'Enter' || e.key === ' ') && onClick) {
          e.preventDefault();
          onClick();
        }
      }}
      data-slot="track-item"
      className={cn(
        'w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-colors active:bg-accent',
        isActive && 'bg-accent',
      )}
    >
      <div className="w-12 h-12 rounded-lg overflow-hidden bg-surface flex-shrink-0">
        {thumbnail && (
          <Image
            src={thumbnail}
            alt={title}
            className="w-full h-full object-cover"
            loading="lazy"
            unoptimized
            width={48}
            height={48}
          />
        )}
      </div>
      <div className="flex-1 min-w-0 text-left">
        <p className={cn('text-sm font-medium truncate', isActive ? 'text-primary' : 'text-foreground')}>
          {title}
        </p>
        <p className="text-xs text-muted truncate mt-0.5">
          {channel}{duration > 0 ? ` · ${formatDuration(duration)}` : ''}
        </p>
      </div>

    </div>
  );
}
