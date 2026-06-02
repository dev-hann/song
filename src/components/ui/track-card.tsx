import Image from 'next/image';
import { formatDuration } from '@/lib/formatters';
import { cn } from '@/lib/utils';

interface TrackCardProps {
  id: string;
  title: string;
  channel: string;
  thumbnail: string;
  duration: number;
  variant: 'square' | 'landscape';
  onClick?: () => void;
  className?: string;
}

export function TrackCard({
  title,
  channel,
  thumbnail,
  duration,
  variant,
  onClick,
  className,
}: TrackCardProps) {
  if (variant === 'square') {
    return (
      <button
        onClick={onClick}
        className={cn('flex-shrink-0 w-36 active:scale-95 transition-transform', className)}
      >
        <div className="w-36 h-36 rounded-xl overflow-hidden bg-surface relative">
          {thumbnail && (
            <Image
              src={thumbnail}
              alt={title}
              className="w-full h-full object-cover"
              loading="lazy"
              unoptimized
              width={144}
              height={144}
            />
          )}
          {duration > 0 && (
            <span className="absolute bottom-1 right-1 text-[10px] bg-background/70 text-foreground px-1 py-0.5 rounded">
              {formatDuration(duration)}
            </span>
          )}
        </div>
        <p className="text-xs font-medium text-foreground mt-1.5 line-clamp-2 text-left">{title}</p>
        <p className="text-[11px] text-muted truncate text-left">{channel}</p>
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      className={cn('flex gap-3 p-2 rounded-xl active:bg-accent transition-colors w-full text-left', className)}
    >
      <div className="w-28 h-16 rounded-lg overflow-hidden bg-surface relative flex-shrink-0">
        {thumbnail && (
          <Image
            src={thumbnail}
            alt={title}
            className="w-full h-full object-cover"
            loading="lazy"
            unoptimized
            width={112}
            height={64}
          />
        )}
        {duration > 0 && (
          <span className="absolute bottom-1 right-1 text-[10px] bg-background/70 text-foreground px-1 py-0.5 rounded">
            {formatDuration(duration)}
          </span>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground line-clamp-2">{title}</p>
        <p className="text-xs text-muted mt-0.5 truncate">{channel}</p>
      </div>
    </button>
  );
}
