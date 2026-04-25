import { Heart, ListPlus, Share2, User, ExternalLink, ListMusic, Play } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';

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
  onLike?: () => void;
  onAddToPlaylist?: () => void;
  onAddToQueue?: () => void;
  onPlayNext?: () => void;
  onGoToChannel?: () => void;
  onShare?: () => void;
  onOpenInYoutube?: () => void;
}

export function TrackContextMenu({
  open,
  onOpenChange,
  track,
  isLiked,
  onLike,
  onAddToPlaylist,
  onAddToQueue,
  onPlayNext,
  onGoToChannel,
  onShare,
  onOpenInYoutube,
}: TrackContextMenuProps) {
  if (!track) return null;

  const items = [
    { icon: ListPlus, label: '재생목록에 추가', action: onAddToPlaylist },
    { icon: Heart, label: isLiked ? '좋아요 취소' : '좋아요', action: onLike },
    { icon: Play, label: '다음에 재생', action: onPlayNext },
    { icon: ListMusic, label: '큐에 추가', action: onAddToQueue },
    { icon: User, label: '채널로 이동', action: onGoToChannel },
    { icon: Share2, label: '공유', action: onShare },
    { icon: ExternalLink, label: 'YouTube에서 보기', action: onOpenInYoutube },
  ];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" showCloseButton={false} className="bg-surface-elevated border-border rounded-t-2xl">
        <SheetHeader className="pb-2">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg overflow-hidden bg-surface flex-shrink-0">
              {track.thumbnail && (
                <img src={track.thumbnail} alt={track.title} className="w-full h-full object-cover" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <SheetTitle className="text-sm font-medium truncate">{track.title}</SheetTitle>
              <SheetDescription className="text-xs text-muted truncate">{track.channel}</SheetDescription>
            </div>
          </div>
        </SheetHeader>
        <div className="py-2">
          {items.map((item) => (
            <button
              key={item.label}
              onClick={() => {
                item.action?.();
                onOpenChange(false);
              }}
              className="w-full flex items-center gap-4 px-2 py-3 rounded-xl active:bg-white/5 transition-colors"
            >
              <item.icon size={20} className="text-muted" />
              <span className="text-sm text-foreground">{item.label}</span>
            </button>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
