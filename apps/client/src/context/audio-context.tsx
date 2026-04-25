import {
  createContext,
  useContext,
  useRef,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { useAudioStore } from '@/store';
import { useAudioStream } from '@/hooks/use-audio-stream';
import { AudioStatus, RepeatMode } from '@/constants';
import { addToHistory } from '@/services/api';

interface AudioContextValue {
  seek: (time: number) => void;
  setSpeed: (speed: number) => void;
  currentTime: number;
  duration: number;
  buffered: number;
}

const AudioCtx = createContext<AudioContextValue | null>(null);

export function AudioProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const lastHistoryRef = useRef<string | null>(null);

  const {
    audio,
    status,
    setStatus,
    updatePlaybackTime,
    updatePlaybackDuration,
    updatePlaybackSpeed,
    playback,
    repeatMode,
    playNext,
    playPrevious,
  } = useAudioStore();

  const { data: streamData } = useAudioStream(audio?.id ?? null);

  useEffect(() => {
    const el = audioRef.current;
    if (!el || !streamData?.url) return;

    el.src = streamData.url;
    el.load();

    const handleCanPlay = () => {
      const currentStatus = useAudioStore.getState().status;
      if (currentStatus === AudioStatus.LOADING || currentStatus === AudioStatus.PLAYING) {
        setStatus(AudioStatus.PLAYING);
        el.play().catch(console.error);
      }
    };

    el.addEventListener('canplay', handleCanPlay, { once: true });
    return () => {
      el.removeEventListener('canplay', handleCanPlay);
    };
  }, [streamData?.url]);

  useEffect(() => {
    const el = audioRef.current;
    if (!el || !el.src) return;

    if (status === AudioStatus.PLAYING) {
      el.play().catch(console.error);
    } else if (status === AudioStatus.PAUSED) {
      el.pause();
    }
  }, [status]);

  useEffect(() => {
    const el = audioRef.current;
    if (el) el.playbackRate = playback.speed;
  }, [playback.speed]);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;

    const onTimeUpdate = () => {
      setCurrentTime(el.currentTime);
      updatePlaybackTime(el.currentTime);
    };

    const onLoadedMetadata = () => {
      setDuration(el.duration);
      updatePlaybackDuration(el.duration);
    };

    const onProgress = () => {
      if (el.buffered.length > 0) {
        setBuffered(el.buffered.end(el.buffered.length - 1));
      }
    };

    const onEnded = () => {
      if (repeatMode === RepeatMode.ONE) {
        el.currentTime = 0;
        el.play().catch(console.error);
      } else {
        playNext();
      }
    };

    const onError = () => {
      console.error('Audio playback error');
      setStatus(AudioStatus.ERROR);
    };

    el.addEventListener('timeupdate', onTimeUpdate);
    el.addEventListener('loadedmetadata', onLoadedMetadata);
    el.addEventListener('progress', onProgress);
    el.addEventListener('ended', onEnded);
    el.addEventListener('error', onError);

    return () => {
      el.removeEventListener('timeupdate', onTimeUpdate);
      el.removeEventListener('loadedmetadata', onLoadedMetadata);
      el.removeEventListener('progress', onProgress);
      el.removeEventListener('ended', onEnded);
      el.removeEventListener('error', onError);
    };
  }, [
    updatePlaybackTime,
    updatePlaybackDuration,
    repeatMode,
    playNext,
    setStatus,
  ]);

  useEffect(() => {
    if (audio && status === AudioStatus.PLAYING && audio.id !== lastHistoryRef.current) {
      lastHistoryRef.current = audio.id;
      addToHistory({
        video_id: audio.id,
        title: audio.title,
        channel: audio.channel?.name || '',
        thumbnail: audio.thumbnail,
        duration: audio.duration,
      }).catch(() => {});
    }
  }, [audio?.id, status]);

  useEffect(() => {
    if (audio && status === AudioStatus.PLAYING) {
      document.title = `재생 중: ${audio.title} - SONG`;
    } else {
      document.title = 'SONG - 광고 없는 영상 플레이어';
    }
  }, [audio, status]);

  useEffect(() => {
    if (!audio || !('mediaSession' in navigator)) return;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: audio.title,
      artist: audio.channel?.name || '',
      artwork: [{ src: audio.thumbnail, sizes: '512x512', type: 'image/jpeg' }],
    });
  }, [audio]);

  useEffect(() => {
    if (!('mediaSession' in navigator)) return;

    navigator.mediaSession.setActionHandler('play', () => setStatus(AudioStatus.PLAYING));
    navigator.mediaSession.setActionHandler('pause', () => setStatus(AudioStatus.PAUSED));
    navigator.mediaSession.setActionHandler('previoustrack', () => playPrevious());
    navigator.mediaSession.setActionHandler('nexttrack', () => playNext());
    navigator.mediaSession.setActionHandler('seekto', (details) => {
      const el = audioRef.current;
      if (!el || details.seekTime == null) return;
      el.currentTime = details.seekTime;
      setCurrentTime(details.seekTime);
      updatePlaybackTime(details.seekTime);
    });
    navigator.mediaSession.setActionHandler('seekbackward', (details) => {
      const el = audioRef.current;
      if (!el) return;
      const time = Math.max(0, el.currentTime - (details.seekOffset || 10));
      el.currentTime = time;
      setCurrentTime(time);
      updatePlaybackTime(time);
    });
    navigator.mediaSession.setActionHandler('seekforward', (details) => {
      const el = audioRef.current;
      if (!el) return;
      const time = Math.min(el.duration || 0, el.currentTime + (details.seekOffset || 10));
      el.currentTime = time;
      setCurrentTime(time);
      updatePlaybackTime(time);
    });

    return () => {
      navigator.mediaSession.setActionHandler('play', null);
      navigator.mediaSession.setActionHandler('pause', null);
      navigator.mediaSession.setActionHandler('previoustrack', null);
      navigator.mediaSession.setActionHandler('nexttrack', null);
      navigator.mediaSession.setActionHandler('seekto', null);
      navigator.mediaSession.setActionHandler('seekbackward', null);
      navigator.mediaSession.setActionHandler('seekforward', null);
    };
  }, [playPrevious, playNext, setStatus, updatePlaybackTime]);

  useEffect(() => {
    if (!('mediaSession' in navigator)) return;
    navigator.mediaSession.playbackState = status === AudioStatus.PLAYING ? 'playing' : 'paused';
  }, [status]);

  useEffect(() => {
    if (!('mediaSession' in navigator)) return;
    const el = audioRef.current;
    if (!el || !el.duration || !isFinite(el.duration)) return;
    navigator.mediaSession.setPositionState({
      duration: el.duration,
      playbackRate: el.playbackRate,
      position: el.currentTime,
    });
  }, [duration]);

  const seek = (time: number) => {
    const el = audioRef.current;
    if (!el) return;
    el.currentTime = time;
    setCurrentTime(time);
    updatePlaybackTime(time);
    if ('mediaSession' in navigator && el.duration && isFinite(el.duration)) {
      navigator.mediaSession.setPositionState({
        duration: el.duration,
        playbackRate: el.playbackRate,
        position: time,
      });
    }
  };

  const setSpeed = (speed: number) => {
    if (audioRef.current) audioRef.current.playbackRate = speed;
    updatePlaybackSpeed(speed);
  };

  return (
    <AudioCtx.Provider value={{ seek, setSpeed, currentTime, duration, buffered }}>
      <audio ref={audioRef} playsInline className="hidden" />
      {children}
    </AudioCtx.Provider>
  );
}

export function useAudioElement() {
  const ctx = useContext(AudioCtx);
  if (!ctx)
    throw new Error('useAudioElement must be used within AudioProvider');
  return ctx;
}
