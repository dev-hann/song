import {
  createContext,
  useContext,
  useRef,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { useAudioStore } from '@/store';
import { AudioStatus } from '@/constants';
import { audioPlayer } from '@/lib/audio-player';
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
  const lastHistoryRef = useRef<string | null>(null);
  const [ctxValue, setCtxValue] = useState<AudioContextValue>({
    seek: (t: number) => audioPlayer.seek(t),
    setSpeed: (s: number) => {
      audioPlayer.setSpeed(s);
      useAudioStore.getState().updatePlaybackSpeed(s);
    },
    currentTime: 0,
    duration: 0,
    buffered: 0,
  });

  useEffect(() => {
    const offStatus = audioPlayer.onStatus((status) => {
      useAudioStore.getState().setStatus(status);
    });

    const offTime = audioPlayer.onTime(({ currentTime, duration }) => {
      const store = useAudioStore.getState();
      store.updatePlaybackTime(currentTime);
      if (duration && isFinite(duration)) store.updatePlaybackDuration(duration);
      setCtxValue((prev) => ({ ...prev, currentTime, duration }));
    });

    const offBuffered = audioPlayer.onBuffered((buffered) => {
      setCtxValue((prev) => ({ ...prev, buffered }));
    });

    const offEnded = audioPlayer.onEnded(() => {
      useAudioStore.getState().playNext();
    });

    audioPlayer.setOnPlayNext(() => {
      useAudioStore.getState().playNext();
    });

    return () => {
      offStatus();
      offTime();
      offBuffered();
      offEnded();
      audioPlayer.setOnPlayNext(null);
    };
  }, []);

  useEffect(() => {
    const handleVisibilityChange = () => {
      audioPlayer.tryResumeOnVisible();
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  useEffect(() => {
    return useAudioStore.subscribe((state, prev) => {
      if (state.audio && state.status === AudioStatus.PLAYING && state.audio.id !== prev.audio?.id) {
        if (state.audio.id !== lastHistoryRef.current) {
          lastHistoryRef.current = state.audio.id;
          addToHistory({
            video_id: state.audio.id,
            title: state.audio.title,
            channel: state.audio.channel?.name || '',
            thumbnail: state.audio.thumbnail,
            duration: state.audio.duration,
          }).catch(() => {});
        }
      }

      if (state.audio && state.status === AudioStatus.PLAYING) {
        document.title = `재생 중: ${state.audio.title} - SONG`;
      } else {
        document.title = 'SONG - 광고 없는 영상 플레이어';
      }
    });
  }, []);

  return (
    <AudioCtx.Provider value={ctxValue}>
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
