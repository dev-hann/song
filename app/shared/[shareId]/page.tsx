'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { TrackItem } from '@/components/ui/track-item';
import { PlayShuffleButtons } from '@/components/ui/play-shuffle-buttons';
import { PlaylistCover } from '@/components/ui/playlist-cover';
import { useAudioStore } from '@/store';
import { playlistTrackToAudio } from '@/lib/track-adapters';
import { formatTotalDuration } from '@/lib/formatters';
import { fetchSharedPlaylist } from '@/services/api';

export default function SharedPlaylistPage() {
  const { shareId } = useParams<{ shareId: string }>();
  const router = useRouter();
  const { setQueue } = useAudioStore();

  const { data: playlist, isLoading } = useQuery({
    queryKey: ['song', 'shared', shareId],
    queryFn: () => fetchSharedPlaylist(shareId),
    enabled: !!shareId,
    retry: 1,
  });

  const handlePlay = (index: number) => {
    if (!playlist?.tracks?.length) {return;}
    setQueue(playlist.tracks.map(playlistTrackToAudio), index);
  };

  const handleShuffle = () => {
    if (!playlist?.tracks?.length) {return;}
    const shuffled = [...playlist.tracks].sort(() => Math.random() - 0.5);
    setQueue(shuffled.map(playlistTrackToAudio), 0);
  };

  if (isLoading) {
    return (
      <div className="px-4 pt-6">
        <Skeleton className="w-full aspect-square max-w-[200px] mx-auto rounded-xl mb-4" />
        <Skeleton className="h-6 w-3/4 mx-auto rounded mb-2" />
        <Skeleton className="h-4 w-1/2 mx-auto rounded mb-6" />
      </div>
    );
  }

  if (!playlist) {
    return (
      <div className="px-4 pt-6 text-center text-muted">
        <p>재생목록을 찾을 수 없습니다</p>
        <button
          onClick={() => { router.push('/'); }}
          className="mt-4 text-sm text-foreground underline"
        >
          홈으로 돌아가기
        </button>
      </div>
    );
  }

  const totalDurationText = formatTotalDuration(playlist.tracks?.reduce((sum, t) => sum + t.duration, 0) ?? 0);

  return (
    <div className="pt-6 pb-4">
      <div className="flex items-center px-4 mb-4">
        <button onClick={() => { router.back(); }} className="p-2 -ml-2 rounded-full active:bg-accent">
          <ArrowLeft size={20} className="text-foreground" />
        </button>
      </div>

      <div className="text-center px-4 mb-6">
        <PlaylistCover coverImage={playlist.coverImage} tracks={playlist.tracks} size="lg" className="mx-auto mb-4" />
        <h1 className="text-xl font-bold text-foreground">{playlist.name}</h1>
        {playlist.description && <p className="text-sm text-muted mt-1">{playlist.description}</p>}
        <p className="text-xs text-muted-foreground mt-1">
          {playlist.trackCount}곡{totalDurationText ? ` · ${totalDurationText}` : ''}
        </p>
      </div>

      <PlayShuffleButtons onPlay={() => { handlePlay(0); }} onShuffle={handleShuffle} disabled={!playlist.tracks?.length} className="px-4 mb-4" />

      <div className="space-y-0.5 px-2">
        {playlist.tracks?.map((track, i) => (
          <TrackItem
            key={track.videoId}
            id={track.videoId}
            title={track.title}
            channel={track.channel}
            thumbnail={track.thumbnail}
            duration={track.duration}
            onClick={() => { handlePlay(i); }}
          />
        ))}
      </div>
    </div>
  );
}
