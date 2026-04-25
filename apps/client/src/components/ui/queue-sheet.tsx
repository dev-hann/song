import { Trash2, Music } from 'lucide-react';
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
  const { audio, queue, currentIndex, removeFromQueue, clearQueue } = useAudioStore();

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
              <div className="bg-white/5 rounded-xl px-2 py-2">
                <TrackItem
                  id={audio.id}
                  title={audio.title}
                  channel={audio.channel?.name || ''}
                  thumbnail={audio.thumbnail}
                  duration={audio.duration}
                  isActive
                />
              </div>
            </div>
          )}

          {upcoming.length > 0 ? (
            <div>
              <p className="text-xs text-muted font-medium mb-2 px-2">다음 ({upcoming.length}곡)</p>
              <div className="space-y-0.5">
                {upcoming.map((track, i) => (
                  <div key={`${track.id}-${i}`} className="group relative">
                    <TrackItem
                      id={track.id}
                      title={track.title}
                      channel={track.channel?.name || ''}
                      thumbnail={track.thumbnail}
                      duration={track.duration}
                      onClick={() => {}}
                    />
                    <button
                      onClick={() => removeFromQueue(currentIndex + 1 + i)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full opacity-0 group-hover:opacity-100 active:bg-white/10 transition-opacity"
                    >
                      <Trash2 size={14} className="text-muted" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-muted">
              <Music size={32} className="mb-2 opacity-30" />
              <p className="text-sm">대기열이 비어있습니다</p>
            </div>
          )}
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
              대기열 비우기
            </button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
