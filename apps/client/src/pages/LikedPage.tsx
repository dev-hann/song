import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useLikes, useToggleLike } from '@/queries';
import { TrackItem } from '@/components/ui/track-item';
import { TrackContextMenu } from '@/components/ui/context-menu-sheet';
import { AddToPlaylistSheet } from '@/components/ui/add-to-playlist-sheet';
import { useAudioStore } from '@/store';
import { Skeleton } from '@/components/ui/skeleton';
import { useState } from 'react';
import { Play, Shuffle, Heart } from 'lucide-react';

export default function LikedPage() {
  const navigate = useNavigate();
  const { data: likes, isLoading } = useLikes();
  const toggleLike = useToggleLike();
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
    if (!likes?.length) return;
    const tracks = likes.map((l) => ({
      id: l.video_id,
      type: 'video' as const,
      title: l.title,
      description: '',
      duration: l.duration,
      viewCount: 0,
      thumbnail: l.thumbnail,
      channel: { name: l.channel },
    }));
    setQueue(tracks, index);
  };

  const handleShuffle = () => {
    if (!likes?.length) return;
    const tracks = [...likes].sort(() => Math.random() - 0.5).map((l) => ({
      id: l.video_id,
      type: 'video' as const,
      title: l.title,
      description: '',
      duration: l.duration,
      viewCount: 0,
      thumbnail: l.thumbnail,
      channel: { name: l.channel },
    }));
    setQueue(tracks, 0);
  };

  return (
    <div className="pt-6 pb-4">
      <div className="px-4 mb-4">
        <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full active:bg-white/5">
          <ArrowLeft size={20} className="text-foreground" />
        </button>
      </div>

      <div className="text-center px-4 mb-6">
        <div className="w-32 h-32 mx-auto rounded-xl bg-gradient-to-br from-purple-600/60 to-blue-600/40 flex items-center justify-center mb-4">
          <Heart size={48} className="text-white fill-white" />
        </div>
        <h1 className="text-xl font-bold text-foreground">좋아요한 곡</h1>
        <p className="text-xs text-muted-foreground mt-1">{likes?.length || 0}곡</p>
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
          disabled={!likes?.length}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-foreground text-background text-sm font-medium active:scale-95 transition-transform disabled:opacity-40"
        >
          <Play size={16} fill="currentColor" />
          재생
        </button>
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
          {likes?.map((like, i) => (
            <TrackItem
              key={like.video_id}
              id={like.video_id}
              title={like.title}
              channel={like.channel}
              thumbnail={like.thumbnail}
              duration={like.duration}
              onClick={() => handlePlay(i)}
              onMore={() => {
                setContextTrack({
                  id: like.video_id,
                  title: like.title,
                  channel: like.channel,
                  thumbnail: like.thumbnail,
                  duration: like.duration,
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
        isLiked={true}
        onLike={() => {
          if (contextTrack) {
            toggleLike.mutate({
              track: {
                video_id: contextTrack.id,
                title: contextTrack.title,
                channel: contextTrack.channel,
                thumbnail: contextTrack.thumbnail,
                duration: contextTrack.duration,
              },
              isLiked: true,
            });
          }
        }}
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
