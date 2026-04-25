import {
  createContext,
  useContext,
  useRef,
  useEffect,
  useState,
  useCallback,
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

function applyMediaSessionMetadata(audio: {
  title: string;
  channel?: { name?: string };
  thumbnail: string;
}) {
  if (!('mediaSession' in navigator)) return;
  navigator.mediaSession.metadata = new MediaMetadata({
    title: audio.title,
    artist: audio.channel?.name || '',
    artwork: [
      { src: audio.thumbnail, sizes: '512x512', type: 'image/jpeg' },
    ],
  });
}

export function AudioProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const keepaliveCtxRef = useRef<AudioContext | null>(null);
  const keepaliveOscRef = useRef<OscillatorNode | null>(null);
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

  const startKeepalive = useCallback(() => {
    if (keepaliveCtxRef.current) return;
    try {
      const ctx = new AudioContext();
      const gain = ctx.createGain();
      gain.gain.value = 0.001;
      const osc = ctx.createOscillator();
      osc.frequency.value = 1;
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      keepaliveCtxRef.current = ctx;
      keepaliveOscRef.current = osc;
    } catch {}
  }, []);

  const stopKeepalive = useCallback(() => {
    try {
      keepaliveOscRef.current?.stop();
      keepaliveOscRef.current?.disconnect();
      keepaliveCtxRef.current?.close();
    } catch {}
    keepaliveCtxRef.current = null;
    keepaliveOscRef.current = null;
  }, []);

  useEffect(() => {
    if (status === AudioStatus.PLAYING) {
      startKeepalive();
    } else {
      stopKeepalive();
    }
  }, [status, startKeepalive, stopKeepalive]);

  useEffect(() => {
    const el = audioRef.current;
    if (!el || !streamData?.url) return;

    const currentAudio = useAudioStore.getState().audio;
    if (currentAudio) applyMediaSessionMetadata(currentAudio);

    el.src = streamData.url;
    el.load();

    const handleCanPlay = () => {
      const s = useAudioStore.getState().status;
      if (s === AudioStatus.LOADING || s === AudioStatus.PLAYING) {
        const a = useAudioStore.getState().audio;
        if (a) applyMediaSessionMetadata(a);
        if ('mediaSession' in navigator) {
          navigator.mediaSession.playbackState = 'playing';
        }
        setStatus(AudioStatus.PLAYING);
        el.play().catch(console.error);
      }
    };

    el.addEventListener('canplay', handleCanPlay, { once: true });
    return () => {
      el.removeEventListener('canplay', handleCanPlay);
    };
  }, [streamData?.url, audio?.id]);

  useEffect(() => {
    const el = audioRef.current;
    if (!el || !el.src) return;

    if (status === AudioStatus.PLAYING) {
      const currentAudio = useAudioStore.getState().audio;
      if (currentAudio) applyMediaSessionMetadata(currentAudio);
      if ('mediaSession' in navigator) {
        navigator.mediaSession.playbackState = 'playing';
      }
      el.play().catch(console.error);
    } else if (status === AudioStatus.PAUSED) {
      if ('mediaSession' in navigator) {
        navigator.mediaSession.playbackState = 'paused';
      }
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

    const onStalled = () => {
      const s = useAudioStore.getState().status;
      if (s === AudioStatus.PLAYING && el.paused) {
        el.play().catch(() => {});
      }
    };

    const onWaiting = () => {
      const resumeOnCanPlay = () => {
        el.removeEventListener('canplay', resumeOnCanPlay);
        const s = useAudioStore.getState().status;
        if (s === AudioStatus.PLAYING) {
          el.play().catch(console.error);
        }
      };
      el.addEventListener('canplay', resumeOnCanPlay);
    };

    const onSuspend = () => {
      const s = useAudioStore.getState().status;
      if (s === AudioStatus.PLAYING && el.paused) {
        el.play().catch(() => {});
      }
    };

    el.addEventListener('timeupdate', onTimeUpdate);
    el.addEventListener('loadedmetadata', onLoadedMetadata);
    el.addEventListener('progress', onProgress);
    el.addEventListener('ended', onEnded);
    el.addEventListener('error', onError);
    el.addEventListener('stalled', onStalled);
    el.addEventListener('waiting', onWaiting);
    el.addEventListener('suspend', onSuspend);

    return () => {
      el.removeEventListener('timeupdate', onTimeUpdate);
      el.removeEventListener('loadedmetadata', onLoadedMetadata);
      el.removeEventListener('progress', onProgress);
      el.removeEventListener('ended', onEnded);
      el.removeEventListener('error', onError);
      el.removeEventListener('stalled', onStalled);
      el.removeEventListener('waiting', onWaiting);
      el.removeEventListener('suspend', onSuspend);
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
    applyMediaSessionMetadata(audio);
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

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState !== 'visible') return;
      const el = audioRef.current;
      if (!el) return;

      const s = useAudioStore.getState().status;
      if (s === AudioStatus.PLAYING && el.paused) {
        const a = useAudioStore.getState().audio;
        if (a) applyMediaSessionMetadata(a);
        if ('mediaSession' in navigator) {
          navigator.mediaSession.playbackState = 'playing';
        }
        el.play().catch(console.error);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

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
      <audio
        ref={audioRef}
        playsInline
        preload="auto"
        style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }}
      />
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
