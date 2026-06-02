import { Play, Heart, ListPlus, Share2, User, ExternalLink, ListMusic, Trash2 } from 'lucide-react';
import Image from 'next/image';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';

import { cn } from '@/lib/utils';

export interface TrackContextMenuProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  track: {
    id: string;
    title: string;
    channel: string;
    thumbnail: string;
    duration: number;
  } | null;
  isLiked?: boolean;
  onPlay?: () => void;
  onLike?: () => void;
  onAddToPlaylist?: () => void;
  onAddToQueue?: () => void;
  onPlayNext?: () => void;
  onGoToChannel?: () => void;
  onShare?: () => void;
  onOpenInYoutube?: () => void;
  onRemoveFromPlaylist?: () => void;
}

export function TrackContextMenu({
  open,
  onOpenChange,
  track,
  isLiked,
  onPlay,
  onLike,
  onAddToPlaylist,
  onAddToQueue,
  onPlayNext,
  onGoToChannel,
  onShare,
  onOpenInYoutube,
  onRemoveFromPlaylist,
}: TrackContextMenuProps) {
  if (!track) {return null;}

  const items = [
    { icon: ListPlus, label: '재생목록에 추가', action: onAddToPlaylist },
    { icon: Heart, label: isLiked ? '좋아요 취소' : '좋아요', action: onLike },
    { icon: ListMusic, label: '큐에 추가', action: onAddToQueue },
    { icon: Play, label: '다음에 재생', action: onPlayNext },
    { icon: User, label: '채널로 이동', action: onGoToChannel },
    { icon: Share2, label: '공유', action: onShare },
    { icon: ExternalLink, label: 'YouTube에서 보기', action: onOpenInYoutube },
    onRemoveFromPlaylist
      ? { icon: Trash2, label: '재생목록에서 제거', action: onRemoveFromPlaylist, destructive: true }
      : null,
  ].filter(Boolean);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" showCloseButton={false} data-slot="context-menu-sheet" className="bg-surface-elevated border-border rounded-t-2xl">
        <SheetHeader className="pb-2">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg overflow-hidden bg-surface flex-shrink-0">
              {track.thumbnail && (
                <Image src={track.thumbnail} alt={track.title} className="w-full h-full object-cover" unoptimized width={48} height={48} />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <SheetTitle className="text-sm font-medium truncate">{track.title}</SheetTitle>
              <SheetDescription className="text-xs text-muted truncate">{track.channel}</SheetDescription>
            </div>
          </div>
        </SheetHeader>

        {onPlay && (
          <div className="px-2 pb-1 pt-1">
            <button
              onClick={() => {
                onPlay();
                onOpenChange(false);
              }}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-foreground text-background text-sm font-medium active:scale-95 transition-transform"
            >
              <Play size={16} fill="currentColor" />
              바로 재생
            </button>
          </div>
        )}

        <div className="py-1">
          {items.map((item) => {
            const typed = item as { icon: typeof Heart; label: string; action?: () => void; destructive?: boolean };
            return (
              <button
                key={typed.label}
                onClick={() => {
                  typed.action?.();
                  onOpenChange(false);
                }}
                className="w-full flex items-center gap-4 px-2 py-3 rounded-xl active:bg-accent transition-colors"
              >
                <typed.icon size={20} className={typed.destructive ? 'text-destructive' : 'text-muted'} />
                <span className={cn('text-sm', typed.destructive ? 'text-destructive' : 'text-foreground')}>{typed.label}</span>
              </button>
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
}
