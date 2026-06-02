"use client";

import { Play, Pause, ChevronDown, Shuffle, SkipBack, SkipForward, Repeat, Repeat1, Heart, ListMusic, Gauge, MoreVertical, Sparkles, Infinity as InfinityIcon, Music2 } from 'lucide-react';
import { useAudioStore } from '@/store';
import { useAudioElement } from '@/context/audio-context';
import { useRelatedTracks, useLyricsQuery } from '@/queries';
import { AudioStatus, RepeatMode } from '@/constants';
import { formatDuration } from '@/lib/formatters';
import { searchResultToAudio } from '@/lib/track-adapters';
import { useLikeToggle } from '@/hooks/use-like-toggle';
import { useTrackContextMenu } from '@/hooks/use-track-context-menu';
import { audioPlayer } from '@/lib/audio-player';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { Slider } from '@/components/ui/slider';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { LyricsDisplay } from '@/components/lyrics-display';
import { TrackCard } from '@/components/ui/track-card';
import { TrackContextMenu } from '@/components/ui/context-menu-sheet';

interface FullPlayerProps {
  show: boolean;
  onClose: () => void;
  onOpenQueue?: () => void;
}

type PlayerTab = 'controls' | 'lyrics' | 'related';

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
    autoplay,
    toggleAutoplay,
    playNext: playNextTrack,
    playPrevious,
  } = useAudioStore();

  const { seek, setSpeed, currentTime, duration } = useAudioElement();
  const { isLiked, isPending: likePending, toggle: handleLike } = useLikeToggle(audio);
  const { data: relatedData, isLoading: relatedLoading } = useRelatedTracks(
    audio?.id ?? null,
  );
  const { data: lyricsData, isLoading: lyricsLoading } = useLyricsQuery(
    audio?.id ?? null,
  );
  const {
    contextTrack,
    contextOpen,
    setContextOpen,
    openContext,
    playNow,
    addToQueue,
    playNext: playNextFromMenu,
    openInYoutube,
    share,
  } = useTrackContextMenu();
  const isPlaying = status === AudioStatus.PLAYING;
  const isLoading = status === AudioStatus.LOADING;
  const [showSpeeds, setShowSpeeds] = useState(false);
  const [activeTab, setActiveTab] = useState<PlayerTab>('controls');
  const [isSeeking, setIsSeeking] = useState(false);
  const [seekValue, setSeekValue] = useState(0);

  const speeds = [0.5, 0.75, 1, 1.25, 1.5, 2];

  const sliderValue = isSeeking ? seekValue : currentTime;
  const displayTime = isSeeking ? seekValue : currentTime;

  const resolveValue = (value: number | readonly number[]): number => {
    if (typeof value === 'number') {return value;}
    if (Array.isArray(value) && value.length > 0) {return value[0] as number;}
    return 0;
  };

  const handleSeekChange = (value: number | readonly number[]) => {
    setIsSeeking(true);
    setSeekValue(resolveValue(value));
  };

  const handleSeekCommitted = (value: number | readonly number[]) => {
    seek(resolveValue(value));
    setIsSeeking(false);
  };

  const playRelated = (index: number) => {
    const related = relatedData?.results;
    if (!related?.[index]) {return;}
    const tracks = related.map(searchResultToAudio);
    const first = tracks[index];
    useAudioStore.setState({
      recommendedQueue: [...tracks.slice(0, index), ...tracks.slice(index + 1)],
      audio: first,
      status: AudioStatus.LOADING,
    });
    audioPlayer.load(first.id, first).catch(() => undefined);
  };

  const openRelatedContext = (track: { id: string; title: string; channel: { name: string }; thumbnail: string; duration: number }) => {
    openContext({
      id: track.id,
      title: track.title,
      channel: track.channel.name,
      thumbnail: track.thumbnail,
      duration: track.duration,
    });
  };

  const handleLyricsSeek = (timeMs: number) => {
    seek(timeMs / 1000);
  };

  if (!audio) {return null;}

  return (
    <div className={cn('full-player', show && 'active')}>
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <button data-testid="btn-close" onClick={onClose} className="p-2 -ml-2 rounded-full active:bg-secondary">
          <ChevronDown size={24} className="text-foreground" />
        </button>

        <div className="flex gap-1">
          <button
            onClick={() => { setActiveTab('controls'); }}
            className={cn(
              'px-3 py-1 rounded-full text-xs font-medium transition-colors',
              activeTab === 'controls'
                ? 'bg-foreground text-background'
                : 'text-muted active:bg-accent',
            )}
          >
            재생
          </button>
          <button
            onClick={() => { setActiveTab('lyrics'); }}
            className={cn(
              'px-3 py-1 rounded-full text-xs font-medium transition-colors',
              activeTab === 'lyrics'
                ? 'bg-foreground text-background'
                : 'text-muted active:bg-accent',
            )}
          >
            <span className="flex items-center gap-1">
              <Music2 size={12} />
              가사
            </span>
          </button>
          <button
            onClick={() => { setActiveTab('related'); }}
            className={cn(
              'px-3 py-1 rounded-full text-xs font-medium transition-colors',
              activeTab === 'related'
                ? 'bg-foreground text-background'
                : 'text-muted active:bg-accent',
            )}
          >
            <span className="flex items-center gap-1">
              <Sparkles size={12} />
              추천 곡
            </span>
          </button>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger data-testid="btn-menu" className="p-2 -mr-2 rounded-full active:bg-secondary">
            <MoreVertical size={20} className="text-foreground" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-surface-elevated border-border">
            <DropdownMenuItem onClick={() => window.open(`https://youtube.com/watch?v=${audio.id}`, '_blank')}>
              YouTube에서 보기
            </DropdownMenuItem>
             <DropdownMenuItem onClick={() => {
              navigator.clipboard.writeText(`https://youtube.com/watch?v=${audio.id}`).catch(() => undefined);
            }}>
              공유
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {activeTab === 'controls' ? (
        isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-10 h-10 border-2 border-secondary border-t-foreground rounded-full animate-[spin_1s_linear_infinite]" />
          </div>
        ) : (
          <>
            <div className="flex-1 min-h-0 flex flex-col items-center justify-center px-8">
              <div className="w-[min(70vw,300px)] aspect-square rounded-2xl overflow-hidden shadow-2xl mb-8">
                {audio.thumbnail && (
                  <Image src={audio.thumbnail} alt={audio.title} className="w-full h-full object-cover" unoptimized width={300} height={300} />
                )}
              </div>

              <div className="text-center w-full max-w-sm">
                <h2 className="text-xl font-bold text-foreground truncate">{audio.title}</h2>
                <p className="text-sm text-muted mt-1 truncate">{audio.channel.name}</p>
              </div>
            </div>

            <div className="px-6 pb-6">
              <div className="mb-4">
                <Slider
                  value={[sliderValue]}
                  min={0}
                  max={duration}
                  step={1}
                  onValueChange={handleSeekChange}
                  onValueCommitted={handleSeekCommitted}
                  className="w-full"
                />
                <div className="flex justify-between mt-2 text-xs text-muted">
                  <span>{formatDuration(displayTime)}</span>
                  <span>{formatDuration(duration)}</span>
                </div>
              </div>

              <div className="flex items-center justify-between mb-6">
                <button data-testid="btn-shuffle" onClick={toggleShuffle} className="p-2 rounded-full active:bg-secondary">
                  <Shuffle size={20} className={shuffle ? 'text-foreground' : 'text-muted-foreground'} />
                </button>
                <button data-testid="btn-prev" onClick={playPrevious} className="p-2 rounded-full active:bg-secondary">
                  <SkipBack size={24} className="text-foreground" fill="currentColor" />
                </button>
                <button
                  data-testid="btn-play"
                  onClick={togglePlay}
                  className="w-14 h-14 rounded-full bg-foreground flex items-center justify-center active:scale-95 transition-transform"
                >
                  {isPlaying ? (
                    <Pause size={28} className="text-background" fill="currentColor" />
                  ) : (
                    <Play size={28} className="text-background ml-1" fill="currentColor" />
                  )}
                </button>
                <button data-testid="btn-next" onClick={playNextTrack} className="p-2 rounded-full active:bg-secondary">
                  <SkipForward size={24} className="text-foreground" fill="currentColor" />
                </button>
                <button data-testid="btn-repeat" onClick={toggleRepeatMode} className="p-2 rounded-full active:bg-secondary relative">
                  {repeatMode === RepeatMode.ONE ? (
                    <Repeat1 size={20} className="text-foreground" />
                  ) : (
                    <Repeat size={20} className={repeatMode === RepeatMode.ALL ? 'text-foreground' : 'text-muted-foreground'} />
                  )}
                </button>
              </div>

              <div className="flex items-center justify-between">
                <button data-testid="btn-like" onClick={handleLike} disabled={likePending} className="p-2 rounded-full active:bg-secondary disabled:opacity-40">
                  <Heart
                    size={20}
                    className={isLiked ? 'text-destructive fill-destructive' : 'text-muted'}
                  />
                </button>

                <button data-testid="btn-autoplay" onClick={toggleAutoplay} className="p-2 rounded-full active:bg-secondary">
                  <InfinityIcon
                    size={20}
                    className={autoplay ? 'text-foreground' : 'text-muted-foreground'}
                  />
                </button>

                {showSpeeds ? (
                  <div data-testid="speed-picker" className="flex items-center gap-1">
                    {speeds.map((s) => (
                      <button
                        key={s}
                        onClick={() => {
                          setSpeed(s);
                          setShowSpeeds(false);
                        }}
                        className={cn(
                          'px-2 py-1 rounded-md text-xs font-medium transition-colors',
                          playback.speed === s ? 'bg-foreground text-background' : 'text-muted active:bg-accent',
                        )}
                      >
                        {s}x
                      </button>
                    ))}
                  </div>
                ) : (
                  <button data-testid="btn-speed" onClick={() => { setShowSpeeds(true); }} className="p-2 rounded-full active:bg-secondary">
                    <Gauge size={20} className="text-muted" />
                  </button>
                )}

                <button data-testid="btn-queue" onClick={onOpenQueue} className="p-2 rounded-full active:bg-secondary">
                  <ListMusic size={20} className="text-muted" />
                </button>
              </div>
            </div>
          </>
        )
      ) : activeTab === 'lyrics' ? (
        <div className="flex-1 overflow-y-auto px-4 pb-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold text-foreground">가사</h3>
          </div>
          <LyricsDisplay
            lines={lyricsData?.lines ?? null}
            currentTimeMs={currentTime * 1000}
            onSeek={handleLyricsSeek}
            isLoading={lyricsLoading}
          />
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto px-4 pb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-foreground">추천 곡</h3>
              <p className="text-xs text-muted mt-0.5 truncate max-w-[250px]">{audio.title}</p>
            </div>
            {relatedData?.results && relatedData.results.length > 0 && (
              <button
                onClick={() => { playRelated(0); }}
                className="px-3 py-1.5 rounded-full text-xs font-medium bg-foreground text-background active:scale-95 transition-transform"
              >
                전체 재생
              </button>
            )}
          </div>

          {relatedLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex gap-3">
                  <Skeleton className="w-28 h-16 rounded-lg flex-shrink-0" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-full rounded mb-1.5" />
                    <Skeleton className="h-3 w-2/3 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : relatedData?.results && relatedData.results.length > 0 ? (
            <div className="space-y-1">
              {relatedData.results.map((track) => (
                <TrackCard
                  key={track.id}
                  variant="landscape"
                  id={track.id}
                  title={track.title}
                  channel={track.channel.name}
                  thumbnail={track.thumbnail}
                  duration={track.duration}
                  onClick={() => { openRelatedContext(track); }}
                />
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center py-12">
              <p className="text-sm text-muted">추천 곡을 찾을 수 없습니다</p>
            </div>
          )}
        </div>
      )}

      <TrackContextMenu
        open={contextOpen}
        onOpenChange={setContextOpen}
        track={contextTrack}
        onPlay={playNow}
        onAddToQueue={addToQueue}
        onPlayNext={playNextFromMenu}
        onShare={share}
        onOpenInYoutube={openInYoutube}
      />
    </div>
  );
}
