'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, Play, Shuffle, Heart } from 'lucide-react';
import { useLikes, useToggleLike } from '@/queries';
import { TrackItem } from '@/components/ui/track-item';
import { TrackContextMenu } from '@/components/ui/context-menu-sheet';
import { AddToPlaylistSheet } from '@/components/ui/add-to-playlist-sheet';
import { useAudioStore } from '@/store';
import { Skeleton } from '@/components/ui/skeleton';
import { likeToAudio } from '@/lib/track-adapters';
import { useTrackContextMenu } from '@/hooks/use-track-context-menu';

export default function LikedPage() {
  const router = useRouter();
  const { data: likes, isLoading } = useLikes();
  const toggleLike = useToggleLike();
  const { setQueue } = useAudioStore();

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

  const handlePlay = (index: number) => {
    if (!likes?.length) {return;}
    setQueue(likes.map(likeToAudio), index);
  };

  const handleShuffle = () => {
    if (!likes?.length) {return;}
    const shuffled = [...likes].sort(() => Math.random() - 0.5);
    setQueue(shuffled.map(likeToAudio), 0);
  };

  return (
    <div className="pt-6 pb-4">
      <div className="px-4 mb-4">
        <button onClick={() => { router.back(); }} className="p-2 -ml-2 rounded-full active:bg-white/5">
          <ArrowLeft size={20} className="text-foreground" />
        </button>
      </div>

      <div className="text-center px-4 mb-6">
        <div className="w-32 h-32 mx-auto rounded-xl bg-gradient-to-br from-purple-600/60 to-blue-600/40 flex items-center justify-center mb-4">
          <Heart size={48} className="text-white fill-white" />
        </div>
        <h1 className="text-xl font-bold text-foreground">좋아요한 곡</h1>
        <p className="text-xs text-muted-foreground mt-1">{likes?.length ?? 0}곡</p>
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
          onClick={() => { handlePlay(0); }}
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
          {likes?.map((like, _i) => (
            <TrackItem
              key={like.videoId}
              id={like.videoId}
              title={like.title}
              channel={like.channel}
              thumbnail={like.thumbnail}
              duration={like.duration}
              onClick={() => {
                openContext({
                  id: like.videoId,
                  title: like.title,
                  channel: like.channel,
                  thumbnail: like.thumbnail,
                  duration: like.duration,
                });
              }}
              onMore={() => {
                openContext({
                  id: like.videoId,
                  title: like.title,
                  channel: like.channel,
                  thumbnail: like.thumbnail,
                  duration: like.duration,
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
        isLiked={true}
        onPlay={playNow}
        onLike={() => {
          if (contextTrack) {
            toggleLike.mutate({
              track: {
                videoId: contextTrack.id,
                title: contextTrack.title,
                channel: contextTrack.channel,
                thumbnail: contextTrack.thumbnail,
                duration: contextTrack.duration,
              },
              isLiked: true,
            });
          }
        }}
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
