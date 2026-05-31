import { useState } from 'react';
import { useAudioStore } from '@/store';
import type { FlatTrackSource } from '@/lib/track-adapters';
import { flatTrackToAudio } from '@/lib/track-adapters';

export function useTrackContextMenu() {
  const [contextTrack, setContextTrack] = useState<FlatTrackSource | null>(null);
  const [contextOpen, setContextOpen] = useState(false);
  const [playlistTrack, setPlaylistTrack] = useState<{
    videoId: string; title: string; channel: string; thumbnail: string; duration: number;
  } | null>(null);
  const [playlistOpen, setPlaylistOpen] = useState(false);

  const openContext = (track: FlatTrackSource) => {
    setContextTrack(track);
    setContextOpen(true);
  };

  const openPlaylist = () => {
    if (contextTrack) {
      setPlaylistTrack({
        videoId: contextTrack.id,
        title: contextTrack.title,
        channel: contextTrack.channel,
        thumbnail: contextTrack.thumbnail,
        duration: contextTrack.duration,
      });
      setPlaylistOpen(true);
    }
  };

  const playNow = () => {
    if (contextTrack) {
      useAudioStore.getState().setQueue([flatTrackToAudio(contextTrack)]);
    }
  };

  const addToQueue = () => {
    if (contextTrack) {
      useAudioStore.getState().addToQueue(flatTrackToAudio(contextTrack));
    }
  };

  const playNext = () => {
    if (contextTrack) {
      useAudioStore.getState().addNext(flatTrackToAudio(contextTrack));
    }
  };

  const openInYoutube = () => {
    if (contextTrack) {
      window.open(`https://youtube.com/watch?v=${contextTrack.id}`, '_blank');
    }
  };

  const share = () => {
    if (contextTrack) {
      navigator.clipboard.writeText(`https://youtube.com/watch?v=${contextTrack.id}`).catch(() => undefined);
    }
  };

  return {
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
  };
}
