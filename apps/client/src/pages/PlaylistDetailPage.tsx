import { useParams, useNavigate } from 'react-router-dom';
import { Play, Shuffle, ArrowLeft, MoreVertical, Plus } from 'lucide-react';
import { usePlaylist, useDeletePlaylist, useRemoveTrackFromPlaylist } from '@/queries';
import { TrackItem } from '@/components/ui/track-item';
import { TrackContextMenu } from '@/components/ui/context-menu-sheet';
import { AddToPlaylistSheet } from '@/components/ui/add-to-playlist-sheet';
import { useAudioStore } from '@/store';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { useState } from 'react';

export default function PlaylistDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: playlist, isLoading } = usePlaylist(id || '');
  const deletePlaylist = useDeletePlaylist();
  const removeTrack = useRemoveTrackFromPlaylist();
  const { setQueue, setAudio } = useAudioStore();
  const [contextTrack, setContextTrack] = useState<{
    id: string; title: string; channel: string; thumbnail: string; duration: number;
  } | null>(null);
  const [contextOpen, setContextOpen] = useState(false);

  const handlePlay = (index: number) => {
    if (!playlist?.tracks) return;
    const tracks = playlist.tracks.map((t) => ({
      id: t.video_id,
      type: 'video' as const,
      title: t.title,
      description: '',
      duration: t.duration,
      viewCount: 0,
      thumbnail: t.thumbnail,
      channel: { name: t.channel },
    }));
    setQueue(tracks, index);
  };

  const handleShuffle = () => {
    if (!playlist?.tracks?.length) return;
    const tracks = [...playlist.tracks].sort(() => Math.random() - 0.5).map((t) => ({
      id: t.video_id,
      type: 'video' as const,
      title: t.title,
      description: '',
      duration: t.duration,
      viewCount: 0,
      thumbnail: t.thumbnail,
      channel: { name: t.channel },
    }));
    setQueue(tracks, 0);
  };

  const handleDelete = async () => {
    if (!id) return;
    try {
      await deletePlaylist.mutateAsync(id);
      toast.success('재생목록이 삭제되었습니다');
      navigate('/library');
    } catch {
      toast.error('삭제에 실패했습니다');
    }
  };

  const handleRemoveTrack = async (videoId: string) => {
    if (!id) return;
    try {
      await removeTrack.mutateAsync({ playlistId: id, videoId });
    } catch {
      toast.error('곡 제거에 실패했습니다');
    }
  };

  if (isLoading) {
    return (
      <div className="px-4 pt-6">
        <Skeleton className="w-full aspect-square max-w-[200px] mx-auto rounded-xl mb-4" />
        <Skeleton className="h-6 w-3/4 mx-auto rounded mb-2" />
        <Skeleton className="h-4 w-1/2 mx-auto rounded mb-6" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 py-2">
            <Skeleton className="w-12 h-12 rounded-lg" />
            <div className="flex-1">
              <Skeleton className="h-4 w-3/4 rounded mb-2" />
              <Skeleton className="h-3 w-1/2 rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!playlist) {
    return (
      <div className="px-4 pt-6 text-center text-muted">
        <p>재생목록을 찾을 수 없습니다</p>
      </div>
    );
  }

  return (
    <div className="pt-6 pb-4">
      <div className="flex items-center justify-between px-4 mb-4">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full active:bg-white/5">
          <ArrowLeft size={20} className="text-foreground" />
        </button>
        <DropdownMenu>
          <DropdownMenuTrigger className="p-2 -mr-2 rounded-full active:bg-white/5">
            <MoreVertical size={20} className="text-foreground" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-surface-elevated border-border">
            {!playlist.is_system && (
              <DropdownMenuItem onClick={handleDelete} disabled={deletePlaylist.isPending} className="text-destructive">
                {deletePlaylist.isPending ? '삭제 중...' : '재생목록 삭제'}
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="text-center px-4 mb-6">
        <div className="w-48 h-48 mx-auto rounded-xl bg-surface flex items-center justify-center mb-4 overflow-hidden">
          <div className="grid grid-cols-2 gap-0.5 w-full h-full">
            {playlist.tracks?.slice(0, 4).map((t) => (
              <div key={t.video_id} className="bg-surface-elevated overflow-hidden">
                {t.thumbnail && <img src={t.thumbnail} alt="" className="w-full h-full object-cover" />}
              </div>
            ))}
            {(!playlist.tracks || playlist.tracks.length < 4) &&
              Array.from({ length: Math.max(0, 4 - (playlist.tracks?.length || 0)) }).map((_, i) => (
                <div key={i} className="bg-surface-elevated" />
              ))}
          </div>
        </div>
        <h1 className="text-xl font-bold text-foreground">{playlist.name}</h1>
        {playlist.description && <p className="text-sm text-muted mt-1">{playlist.description}</p>}
        <p className="text-xs text-muted-foreground mt-1">{playlist.track_count}곡</p>
      </div>

      <div className="flex items-center justify-center gap-4 px-4 mb-6">
        <button
          onClick={handleShuffle}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/5 text-sm text-foreground active:bg-white/10"
        >
          <Shuffle size={16} />
          셔플
        </button>
        <button
          onClick={() => handlePlay(0)}
          disabled={!playlist.tracks?.length}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-foreground text-background text-sm font-medium active:scale-95 transition-transform disabled:opacity-40"
        >
          <Play size={16} fill="currentColor" />
          재생
        </button>
      </div>

      <div className="space-y-0.5 px-2">
        {playlist.tracks?.map((track, i) => (
          <TrackItem
            key={track.video_id}
            id={track.video_id}
            title={track.title}
            channel={track.channel}
            thumbnail={track.thumbnail}
            duration={track.duration}
            onClick={() => handlePlay(i)}
            onMore={() => {
              setContextTrack({
                id: track.video_id,
                title: track.title,
                channel: track.channel,
                thumbnail: track.thumbnail,
                duration: track.duration,
              });
              setContextOpen(true);
            }}
          />
        ))}
      </div>

      <TrackContextMenu
        open={contextOpen}
        onOpenChange={setContextOpen}
        track={contextTrack}
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
    </div>
  );
}
