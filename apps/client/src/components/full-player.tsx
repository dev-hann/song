import { Play, Pause, ChevronDown, Shuffle, SkipBack, SkipForward, Repeat, Repeat1, Heart, ListMusic, Gauge, MoreVertical } from 'lucide-react';
import { useAudioStore } from '@/store';
import { useAudioElement } from '@/context/audio-context';
import { useLikeCheck, useToggleLike } from '@/queries';
import { AudioStatus, RepeatMode } from '@/constants';
import { formatDuration } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { Slider } from '@/components/ui/slider';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface FullPlayerProps {
  show: boolean;
  onClose: () => void;
  onOpenQueue?: () => void;
}

export function FullPlayer({ show, onClose, onOpenQueue }: FullPlayerProps) {
  const {
    audio,
    status,
    playback,
    togglePlay,
    toggleRepeatMode,
    repeatMode,
    toggleShuffle,
    shuffle,
    playNext,
    playPrevious,
  } = useAudioStore();

  const { seek, setSpeed, currentTime, duration, buffered } = useAudioElement();
  const { data: likeData } = useLikeCheck(audio?.id || null);
  const toggleLike = useToggleLike();
  const isPlaying = status === AudioStatus.PLAYING;
  const isLoading = status === AudioStatus.LOADING;
  const [showSpeeds, setShowSpeeds] = useState(false);

  const speeds = [0.5, 0.75, 1, 1.25, 1.5, 2];

  const handleLike = () => {
    if (!audio || toggleLike.isPending) return;
    toggleLike.mutate({
      track: {
        video_id: audio.id,
        title: audio.title,
        channel: audio.channel?.name || '',
        thumbnail: audio.thumbnail,
        duration: audio.duration,
      },
      isLiked: likeData?.liked || false,
    });
  };

  const handleSeek = (value: number | readonly number[]) => {
    const v = Array.isArray(value) ? value[0] : value;
    seek(v);
  };

  if (!audio) return null;

  return (
    <div className={cn('full-player', show && 'active')}>
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <button onClick={onClose} className="p-2 -ml-2 rounded-full active:bg-white/10">
          <ChevronDown size={24} className="text-foreground" />
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger className="p-2 -mr-2 rounded-full active:bg-white/10">
            <MoreVertical size={20} className="text-foreground" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-surface-elevated border-border">
            <DropdownMenuItem onClick={() => window.open(`https://youtube.com/watch?v=${audio.id}`, '_blank')}>
              YouTube에서 보기
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => {
              navigator.clipboard.writeText(`https://youtube.com/watch?v=${audio.id}`);
            }}>
              공유
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="w-10 h-10 border-2 border-white/10 border-t-white rounded-full animate-[spin_1s_linear_infinite]" />
        </div>
      ) : (
        <>
          <div className="flex-1 flex flex-col items-center justify-center px-8">
            <div className="w-[min(70vw,300px)] aspect-square rounded-2xl overflow-hidden shadow-2xl mb-8">
              {audio.thumbnail && (
                <img src={audio.thumbnail} alt={audio.title} className="w-full h-full object-cover" />
              )}
            </div>

            <div className="text-center w-full max-w-sm">
              <h2 className="text-xl font-bold text-foreground truncate">{audio.title}</h2>
              <p className="text-sm text-muted mt-1 truncate">{audio.channel?.name}</p>
            </div>
          </div>

          <div className="px-6 pb-6">
            <div className="mb-4">
              <Slider
                value={[currentTime]}
                min={0}
                max={duration || 100}
                step={1}
                onValueChange={handleSeek}
                className="w-full"
              />
              <div className="flex justify-between mt-2 text-xs text-muted">
                <span>{formatDuration(currentTime)}</span>
                <span>{formatDuration(duration)}</span>
              </div>
            </div>

            <div className="flex items-center justify-between mb-6">
              <button onClick={toggleShuffle} className="p-2 rounded-full active:bg-white/10">
                <Shuffle size={20} className={shuffle ? 'text-foreground' : 'text-muted-foreground'} />
              </button>
              <button onClick={playPrevious} className="p-2 rounded-full active:bg-white/10">
                <SkipBack size={24} className="text-foreground" fill="currentColor" />
              </button>
              <button
                onClick={togglePlay}
                className="w-14 h-14 rounded-full bg-foreground flex items-center justify-center active:scale-95 transition-transform"
              >
                {isPlaying ? (
                  <Pause size={28} className="text-background" fill="currentColor" />
                ) : (
                  <Play size={28} className="text-background ml-1" fill="currentColor" />
                )}
              </button>
              <button onClick={playNext} className="p-2 rounded-full active:bg-white/10">
                <SkipForward size={24} className="text-foreground" fill="currentColor" />
              </button>
              <button onClick={toggleRepeatMode} className="p-2 rounded-full active:bg-white/10 relative">
                {repeatMode === RepeatMode.ONE ? (
                  <Repeat1 size={20} className="text-foreground" />
                ) : (
                  <Repeat size={20} className={repeatMode === RepeatMode.ALL ? 'text-foreground' : 'text-muted-foreground'} />
                )}
              </button>
            </div>

            <div className="flex items-center justify-between">
              <button onClick={handleLike} disabled={toggleLike.isPending} className="p-2 rounded-full active:bg-white/10 disabled:opacity-40">
                <Heart
                  size={20}
                  className={likeData?.liked ? 'text-red-500 fill-red-500' : 'text-muted'}
                />
              </button>

              {showSpeeds ? (
                <div className="flex items-center gap-1">
                  {speeds.map((s) => (
                    <button
                      key={s}
                      onClick={() => {
                        setSpeed(s);
                        setShowSpeeds(false);
                      }}
                      className={cn(
                        'px-2 py-1 rounded-md text-xs font-medium transition-colors',
                        playback.speed === s ? 'bg-foreground text-background' : 'text-muted active:bg-white/5',
                      )}
                    >
                      {s}x
                    </button>
                  ))}
                </div>
              ) : (
                <button onClick={() => setShowSpeeds(true)} className="p-2 rounded-full active:bg-white/10">
                  <Gauge size={20} className="text-muted" />
                </button>
              )}

              <button onClick={onOpenQueue} className="p-2 rounded-full active:bg-white/10">
                <ListMusic size={20} className="text-muted" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
