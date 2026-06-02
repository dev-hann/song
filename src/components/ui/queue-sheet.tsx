import { Trash2, Music, Sparkles, Infinity as InfinityIcon } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { useAudioStore } from '@/store';
import { TrackItem } from '@/components/ui/track-item';
import { cn } from '@/lib/utils';

interface QueueSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function QueueSheet({ open, onOpenChange }: QueueSheetProps) {
  const {
    audio,
    queue,
    recommendedQueue,
    currentIndex,
    autoplay,
    removeFromQueue,
    removeFromRecommendedQueue,
    clearRecommendedQueue,
    clearQueue,
    toggleAutoplay,
  } = useAudioStore();

  const upcoming = queue.slice(currentIndex + 1);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" showCloseButton={false} className="bg-surface-elevated border-border rounded-t-2xl max-h-[70vh]">
        <SheetHeader>
          <SheetTitle>재생 대기열</SheetTitle>
          <SheetDescription />
        </SheetHeader>

        <div className="overflow-y-auto max-h-[55vh] hide-scrollbar">
          {audio && (
            <div className="mb-4">
              <p className="text-xs text-muted font-medium mb-2 px-2">지금 재생 중</p>
              <div className="bg-accent rounded-xl px-2 py-2">
                <TrackItem
                  id={audio.id}
                  title={audio.title}
                  channel={audio.channel.name}
                  thumbnail={audio.thumbnail}
                  duration={audio.duration}
                  isActive
                />
              </div>
            </div>
          )}

          {upcoming.length > 0 && (
            <div className="mb-4">
              <p className="text-xs text-muted font-medium mb-2 px-2">다음 ({upcoming.length}곡)</p>
              <div className="space-y-0.5">
                {upcoming.map((track, i) => (
                  <div key={`${track.id}-${i}`} className="group relative">
                    <TrackItem
                      id={track.id}
                      title={track.title}
                      channel={track.channel.name}
                      thumbnail={track.thumbnail}
                      duration={track.duration}
                      onClick={() => undefined}
                    />
                    <button
                      onClick={() => { removeFromQueue(currentIndex + 1 + i); }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full opacity-0 group-hover:opacity-100 active:bg-secondary transition-opacity"
                    >
                      <Trash2 size={14} className="text-muted" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mb-2">
            <div className="flex items-center justify-between mb-2 px-2">
              <div className="flex items-center gap-1.5">
                <Sparkles size={12} className="text-muted" />
                <p className="text-xs text-muted font-medium">
                  자동 추천{recommendedQueue.length > 0 ? ` (${recommendedQueue.length}곡)` : ''}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {recommendedQueue.length > 0 && (
                  <button
                    onClick={clearRecommendedQueue}
                    className="text-xs text-muted active:text-foreground transition-colors"
                  >
                    비우기
                  </button>
                )}
                <button
                  onClick={toggleAutoplay}
                  className={cn(
                    'flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-colors',
                    autoplay
                      ? 'bg-foreground text-background'
                      : 'bg-accent text-muted active:bg-secondary',
                  )}
                >
                  <InfinityIcon size={12} />
                  {autoplay ? 'ON' : 'OFF'}
                </button>
              </div>
            </div>
            {recommendedQueue.length > 0 ? (
              <div className="space-y-0.5">
                {recommendedQueue.map((track, i) => (
                  <div key={`rec-${track.id}-${i}`} className="group relative">
                    <TrackItem
                      id={track.id}
                      title={track.title}
                      channel={track.channel.name}
                      thumbnail={track.thumbnail}
                      duration={track.duration}
                      onClick={() => undefined}
                    />
                    <button
                      onClick={() => { removeFromRecommendedQueue(i); }}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full opacity-0 group-hover:opacity-100 active:bg-secondary transition-opacity"
                    >
                      <Trash2 size={14} className="text-muted" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-4 text-muted">
                <Music size={24} className="mb-1 opacity-30" />
                <p className="text-xs">
                  {autoplay ? '대기열이 끝나면 자동으로 추천 곡이 추가됩니다' : '자동 추천이 꺼져 있습니다'}
                </p>
              </div>
            )}
          </div>
        </div>

        {upcoming.length > 0 && (
          <div className="pt-3 border-t border-border">
            <button
              onClick={() => {
                clearQueue();
                onOpenChange(false);
              }}
              className="w-full py-2.5 text-sm text-muted active:text-foreground transition-colors"
            >
              대기열 전체 비우기
            </button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
