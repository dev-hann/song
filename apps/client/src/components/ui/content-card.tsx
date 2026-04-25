import { Play } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ContentCardProps {
  title: string;
  subtitle?: string;
  thumbnail: string;
  onClick?: () => void;
  className?: string;
  size?: 'sm' | 'md';
}

export function ContentCard({ title, subtitle, thumbnail, onClick, className, size = 'md' }: ContentCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn('group text-left w-full', className)}
    >
      <div className={cn(
        'relative aspect-square rounded-xl overflow-hidden bg-surface mb-2 shadow-lg shadow-black/30',
        size === 'sm' && 'rounded-lg mb-1.5',
      )}>
        {thumbnail ? (
          <img
            src={thumbnail}
            alt={title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            <Play size={24} />
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/40 to-transparent" />
        <div className="absolute bottom-1.5 right-1.5 w-8 h-8 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all duration-200">
          <Play size={14} fill="white" className="text-white ml-px" />
        </div>
      </div>
      <p className={cn(
        'font-medium text-foreground truncate',
        size === 'sm' ? 'text-xs' : 'text-sm',
      )}>
        {title}
      </p>
      {subtitle && (
        <p className={cn(
          'text-muted truncate mt-0.5',
          size === 'sm' ? 'text-[10px]' : 'text-xs',
        )}>
          {subtitle}
        </p>
      )}
    </button>
  );
}
