import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { useHistory, useClearHistory } from '@/queries';
import { TrackItem } from '@/components/ui/track-item';
import { TrackContextMenu } from '@/components/ui/context-menu-sheet';
import { AddToPlaylistSheet } from '@/components/ui/add-to-playlist-sheet';
import { useAudioStore } from '@/store';
import { Skeleton } from '@/components/ui/skeleton';
import { useState } from 'react';
import { toast } from 'sonner';

export default function RecentPage() {
  const navigate = useNavigate();
  const { data: history, isLoading } = useHistory();
  const clearHistory = useClearHistory();
  const { setQueue } = useAudioStore();
  const [contextTrack, setContextTrack] = useState<{
    id: string; title: string; channel: string; thumbnail: string; duration: number;
  } | null>(null);
  const [contextOpen, setContextOpen] = useState(false);
  const [playlistTrack, setPlaylistTrack] = useState<{
    video_id: string; title: string; channel: string; thumbnail: string; duration: number;
  } | null>(null);
  const [playlistOpen, setPlaylistOpen] = useState(false);

  const handlePlay = (index: number) => {
    if (!history?.length) return;
    const tracks = history.map((h) => ({
      id: h.video_id,
      type: 'video' as const,
      title: h.title,
      description: '',
      duration: h.duration,
      viewCount: 0,
      thumbnail: h.thumbnail,
      channel: { name: h.channel },
    }));
    setQueue(tracks, index);
  };

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
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full active:bg-white/5">
          <ArrowLeft size={20} className="text-foreground" />
        </button>
        {history && history.length > 0 && (
          <button onClick={handleClear} disabled={clearHistory.isPending} className="text-sm text-muted-foreground active:text-foreground disabled:opacity-40">
            {clearHistory.isPending ? '삭제 중...' : '전체 삭제'}
          </button>
        )}
      </div>

      <div className="px-4 mb-6">
        <h1 className="text-xl font-bold text-foreground">최근 재생</h1>
        <p className="text-xs text-muted-foreground mt-1">{history?.length || 0}곡</p>
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
          {history?.map((item, i) => (
            <TrackItem
              key={item.id}
              id={item.video_id}
              title={item.title}
              channel={item.channel}
              thumbnail={item.thumbnail}
              duration={item.duration}
              onClick={() => handlePlay(i)}
              onMore={() => {
                setContextTrack({
                  id: item.video_id,
                  title: item.title,
                  channel: item.channel,
                  thumbnail: item.thumbnail,
                  duration: item.duration,
                });
                setContextOpen(true);
              }}
            />
          ))}
        </div>
      )}

      <TrackContextMenu
        open={contextOpen}
        onOpenChange={setContextOpen}
        track={contextTrack}
        onAddToPlaylist={() => {
          if (contextTrack) {
            setPlaylistTrack({
              video_id: contextTrack.id,
              title: contextTrack.title,
              channel: contextTrack.channel,
              thumbnail: contextTrack.thumbnail,
              duration: contextTrack.duration,
            });
            setPlaylistOpen(true);
          }
        }}
        onAddToQueue={() => {
          if (contextTrack) {
            useAudioStore.getState().addToQueue({
              id: contextTrack.id,
              type: 'video',
              title: contextTrack.title,
              description: '',
              duration: contextTrack.duration,
              viewCount: 0,
              thumbnail: contextTrack.thumbnail,
              channel: { name: contextTrack.channel },
            });
          }
        }}
        onPlayNext={() => {
          if (contextTrack) {
            useAudioStore.getState().addNext({
              id: contextTrack.id,
              type: 'video',
              title: contextTrack.title,
              description: '',
              duration: contextTrack.duration,
              viewCount: 0,
              thumbnail: contextTrack.thumbnail,
              channel: { name: contextTrack.channel },
            });
          }
        }}
        onOpenInYoutube={() => {
          if (contextTrack) window.open(`https://youtube.com/watch?v=${contextTrack.id}`, '_blank');
        }}
      />

      <AddToPlaylistSheet
        open={playlistOpen}
        onOpenChange={setPlaylistOpen}
        track={playlistTrack}
      />
    </div>
  );
}
