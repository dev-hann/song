'use client';

import { Play, Pause, Minimize2, AlertCircle, ChevronDown } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { formatDuration } from '@/lib/formatters';
import { useAudioStore } from '@/store';
import type { Audio } from '@/types';
import { fetchAudioStream } from '@/services/api';
import { RepeatMode } from '@/constants';
import { ControlButton } from './ui/control-button';
import { ProgressBar } from './ui/progress-bar';
import { RepeatModeButton } from './ui/repeat-mode';
import { SpeedControl } from './ui/speed-control';
import { ShuffleButton } from './ui/shuffle-button';
import { LikeButton } from './ui/like-button';
import { TrackNavigation } from './ui/track-navigation';
import { useSwipeDown } from '@/hooks/use-swipe-down';

interface FullPlayerProps {
  audioId: string | null;
  audioMetadata: Audio | null;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onClose: () => void;
  onTimeUpdate?: (currentTime: number) => void;
  show: boolean;
}

/**
 * Full-screen audio player component with playback controls.
 * Displays audio metadata, progress bar, and playback options.
 */
export function FullPlayer({ audioId, audioMetadata, isPlaying, onTogglePlay, onClose, onTimeUpdate, show }: FullPlayerProps) {
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [buffered, setBuffered] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const {
    updatePlaybackDuration,
    playback,
    toggleRepeatMode,
    repeatMode,
    toggleShuffle,
    shuffle,
    toggleLike,
    liked,
    updatePlaybackSpeed,
    playNext,
    playPrevious
  } = useAudioStore();

  const audioRef = useRef<HTMLAudioElement>(null);
  const { elementRef } = useSwipeDown({ onSwipeDown: onClose });

  // Muted trick: preempt playback permission when audioId changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !audioId) return;

    audio.muted = true;
    audio.play().catch(() => {});
  }, [audioId]);

  // Fetch stream URL separately because YouTube.js audio URLs expire
  useEffect(() => {
    if (!audioId) return;

    const fetchStreamUrl = async () => {
      try {
        const data = await fetchAudioStream(audioId);
        setStreamUrl(data.url);
        setError(null);
      } catch (error) {
        console.error('Failed to fetch stream URL:', error);
        setError('오디오를 불러올 수 없습니다');
      }
    };

    fetchStreamUrl();
  }, [audioId]);

  // Set stream URL and unmute when ready
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !streamUrl) return;

    audio.src = streamUrl;
    audio.load();

    const handleCanPlay = () => {
      audio.muted = false;
      if (isPlaying) {
        audio.play().catch(console.error);
      }
    };

    audio.addEventListener('canplay', handleCanPlay, { once: true });

    return () => {
      audio.removeEventListener('canplay', handleCanPlay);
    };
  }, [streamUrl, isPlaying]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !audio.src) return;

    if (isPlaying) {
      audio.play().catch(console.error);
    } else {
      audio.pause();
    }
  }, [isPlaying]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      onTimeUpdate?.(audio.currentTime);
    };

    const handleLoadedMetadata = () => {
      const newDuration = audio.duration;
      setDuration(newDuration);
      updatePlaybackDuration(newDuration);
    };

    const handleProgress = () => {
      if (audio.buffered.length > 0) {
        const bufferedEnd = audio.buffered.end(audio.buffered.length - 1);
        setBuffered(bufferedEnd);
      }
    };

    const handleEnded = () => {
      if (repeatMode === RepeatMode.ONE) {
        audio.currentTime = 0;
        audio.play().catch(console.error);
      } else {
        playNext();
      }
    };

    const handleError = () => {
      console.error('Audio playback error');
      setError('오디오 재생 중 오류가 발생했습니다');
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('progress', handleProgress);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('progress', handleProgress);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
    };
  }, [onTimeUpdate, updatePlaybackDuration, repeatMode, playNext]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.playbackRate = playback.speed;
  }, [playback.speed]);

  const handleSeek = (value: number) => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.currentTime = value;
    setCurrentTime(value);
  };

  const handleSpeedChange = (speed: number) => {
    updatePlaybackSpeed(speed);
  };

  return (
    <div ref={elementRef} className={`full-player ${show ? 'active' : ''} touch-feedback`}>
      <audio
        ref={audioRef}
        playsInline
        className="hidden"
      />

      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-20 w-10 h-10 flex items-center justify-center bg-black/50 rounded-full text-white active:scale-95 transition-transform"
      >
        <Minimize2 size={20} />
      </button>

      <div className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-1 text-zinc-500 text-xs animate-bounce">
        <ChevronDown size={16} />
        <span>아래로 스와이프하여 닫기</span>
      </div>

      {error ? (
        <div className="flex-1 flex items-center justify-center p-6">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className="w-16 h-16 flex items-center justify-center bg-red-500/20 rounded-full">
              <AlertCircle size={32} className="text-red-500" />
            </div>
            <h3 className="text-lg font-bold text-white">오류가 발생했습니다</h3>
            <p className="text-zinc-400 text-sm">{error}</p>
            <button
              onClick={onClose}
              className="px-6 py-3 bg-white text-black rounded-full font-medium active:scale-95 transition-transform"
            >
              닫기
            </button>
          </div>
        </div>
      ) : !streamUrl ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="loading-indicator"></div>
            <p className="text-zinc-400 text-sm">로딩 중...</p>
          </div>
        </div>
      ) : (
        <>
          <div className="flex-1 flex flex-col items-center justify-center p-6">
            {audioMetadata?.thumbnail && (
              <div className="relative w-64 h-64 mb-6 rounded-2xl overflow-hidden shadow-2xl">
                <Image
                  src={audioMetadata.thumbnail}
                  alt={audioMetadata.title}
                  fill
                  className="object-cover"
                />
              </div>
            )}

            <div className="text-center mb-8 max-w-md">
              <h2 className="text-xl font-bold text-white mb-2">{audioMetadata?.title}</h2>
              <div className="flex items-center justify-center gap-2">
                {audioMetadata?.channel?.thumbnail && (
                  <div className="relative w-5 h-5 flex-shrink-0 rounded-full overflow-hidden">
                    <Image
                      src={audioMetadata.channel.thumbnail}
                      alt={audioMetadata.channel.name}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <p className="text-sm text-zinc-400">{audioMetadata?.channel?.name}</p>
              </div>
            </div>
          </div>

          <div className="p-6 bg-gradient-to-t from-black via-black/80 to-transparent">
            <div className="flex items-center justify-center gap-6 mb-6">
              <ShuffleButton isShuffle={shuffle} onToggle={toggleShuffle} />
              <TrackNavigation onPrevious={playPrevious} onNext={playNext} />
              <ControlButton size="lg" onClick={onTogglePlay}>
                {isPlaying ? <Pause size={32} fill="black" /> : <Play size={32} fill="black" />}
              </ControlButton>
              <LikeButton isLiked={liked} onToggle={toggleLike} />
              <RepeatModeButton mode={repeatMode} onToggle={toggleRepeatMode} />
            </div>

            <div className="mb-6">
              <ProgressBar
                value={currentTime}
                max={duration || 100}
                onChange={handleSeek}
                buffered={buffered}
                formatTime={formatDuration}
              />
              <div className="flex justify-between mt-2 text-xs text-zinc-400">
                <span>{formatDuration(currentTime)}</span>
                <span>{formatDuration(duration)}</span>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <SpeedControl speed={playback.speed} onChange={handleSpeedChange} />
              </div>
              <div className="text-xs text-zinc-500">
                {repeatMode === 'one' && '반복 1회'}
                {repeatMode === 'all' && '전체 반복'}
                {shuffle && '셔플'}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
