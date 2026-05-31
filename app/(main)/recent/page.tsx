'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { useHistory, useClearHistory } from '@/queries';
import { TrackItem } from '@/components/ui/track-item';
import { TrackContextMenu } from '@/components/ui/context-menu-sheet';
import { AddToPlaylistSheet } from '@/components/ui/add-to-playlist-sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { useTrackContextMenu } from '@/hooks/use-track-context-menu';

export default function RecentPage() {
  const router = useRouter();
  const { data: history, isLoading } = useHistory();
  const clearHistory = useClearHistory();

  const {
    contextTrack,
    contextOpen,
    setContextOpen,
    playlistTrack,
    playlistOpen,
    setPlaylistOpen,
    openContext,
    openPlaylist,
    playNow,
    addToQueue,
    playNext,
    openInYoutube,
    share,
  } = useTrackContextMenu();

  const handleClear = async () => {
    try {
      await clearHistory.mutateAsync();
      toast.success('재생 기록이 삭제되었습니다');
    } catch {
      toast.error('삭제에 실패했습니다');
    }
  };

  return (
    <div className="pt-6 pb-4">
      <div className="px-4 flex items-center justify-between mb-4">
        <button onClick={() => { router.back(); }} className="p-2 -ml-2 rounded-full active:bg-white/5">
          <ArrowLeft size={20} className="text-foreground" />
        </button>
        {history && history.length > 0 && (
          <button onClick={() => { handleClear().catch(() => undefined); }} disabled={clearHistory.isPending} className="text-sm text-muted-foreground active:text-foreground disabled:opacity-40">
            {clearHistory.isPending ? '삭제 중...' : '전체 삭제'}
          </button>
        )}
      </div>

      <div className="px-4 mb-6">
        <h1 className="text-xl font-bold text-foreground">최근 재생</h1>
        <p className="text-xs text-muted-foreground mt-1">{history?.length ?? 0}곡</p>
      </div>

      {isLoading ? (
        <div className="space-y-2 px-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="w-12 h-12 rounded-lg flex-shrink-0" />
              <div className="flex-1">
                <Skeleton className="h-4 w-3/4 rounded mb-2" />
                <Skeleton className="h-3 w-1/2 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-0.5 px-2">
          {history?.map((item, _i) => (
            <TrackItem
              key={item.id}
              id={item.videoId}
              title={item.title}
              channel={item.channel}
              thumbnail={item.thumbnail}
              duration={item.duration}
              onClick={() => {
                openContext({
                  id: item.videoId,
                  title: item.title,
                  channel: item.channel,
                  thumbnail: item.thumbnail,
                  duration: item.duration,
                });
              }}
              onMore={() => {
                openContext({
                   id: item.videoId,
                  title: item.title,
                  channel: item.channel,
                  thumbnail: item.thumbnail,
                  duration: item.duration,
                });
              }}
            />
          ))}
        </div>
      )}

      <TrackContextMenu
        open={contextOpen}
        onOpenChange={setContextOpen}
        track={contextTrack}
        onPlay={playNow}
        onAddToPlaylist={openPlaylist}
        onAddToQueue={addToQueue}
        onPlayNext={playNext}
        onShare={share}
        onOpenInYoutube={openInYoutube}
      />

      <AddToPlaylistSheet
        open={playlistOpen}
        onOpenChange={setPlaylistOpen}
        track={playlistTrack}
      />
    </div>
  );
}
