"use client";

import { Play, Pause, Heart, Loader2 } from 'lucide-react';
import { useAudioStore } from '@/store';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { AudioStatus } from '@/constants';
import { useLikeToggle } from '@/hooks/use-like-toggle';

export function PlayerBar() {
  const { audio, status, togglePlay, setShowFullPlayer, playback } = useAudioStore();
  const { isLiked, isPending, toggle: handleLike } = useLikeToggle(audio);
  const isPlaying = status === AudioStatus.PLAYING;
  const isLoading = status === AudioStatus.LOADING;

  if (!audio) {return null;}

  const progress = playback.duration > 0 ? (playback.currentTime / playback.duration) * 100 : 0;

  return (
    <div
      className="player-bar"
      onClick={() => { setShowFullPlayer(true); }}
      style={{ cursor: 'pointer' }}
    >
      <div className="player-bar-progress" style={{ width: `${progress}%` }} />

      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="relative w-11 h-11 rounded-lg overflow-hidden bg-surface flex-shrink-0 shadow-lg">
          {audio.thumbnail && (
            <Image src={audio.thumbnail} alt={audio.title} className="w-full h-full object-cover" loading="lazy" unoptimized width={44} height={44} />
          )}
          {isLoading && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <Loader2 size={16} className="text-white animate-spin" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">{audio.title}</p>
          <p className="text-xs text-muted truncate">{audio.channel.name}</p>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={(e) => { handleLike(e); }}
          disabled={isPending}
          className="p-2 rounded-full active:bg-white/10 disabled:opacity-40"
        >
          <Heart
            size={18}
            className={cn(
              'transition-colors',
              isLiked ? 'text-red-500 fill-red-500' : 'text-muted',
            )}
          />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            togglePlay();
          }}
          disabled={isLoading}
          className="p-2 rounded-full active:bg-white/10 disabled:opacity-60"
        >
          {isLoading ? (
            <Loader2 size={20} className="text-foreground animate-spin" />
          ) : isPlaying ? (
            <Pause size={20} className="text-foreground" fill="currentColor" />
          ) : (
            <Play size={20} className="text-foreground" fill="currentColor" />
          )}
        </button>
      </div>
    </div>
  );
}
