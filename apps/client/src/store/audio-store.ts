import { create } from 'zustand';
import type { Audio } from '@/types';
import { AudioStatus, RepeatMode } from '@/constants';
import { audioPlayer } from '@/lib/audio-player';
import { fetchAudioInfo, addLike, removeLike, fetchRelatedTracks } from '@/services/api';

interface AudioPlayback {
  currentTime: number;
  duration: number;
  speed: number;
}

interface AudioStore {
  audio: Audio | null;
  playback: AudioPlayback;
  status: AudioStatus;
  showFullPlayer: boolean;
  repeatMode: RepeatMode;
  shuffle: boolean;
  liked: boolean;
  queue: Audio[];
  currentIndex: number;
  autoplay: boolean;

  setAudio: (audio: Audio) => void;
  setAudioById: (audioId: string) => Promise<void>;
  clearAudio: () => void;
  setStatus: (status: AudioStatus) => void;
  togglePlay: () => void;
  setShowFullPlayer: (show: boolean) => void;
  updatePlaybackTime: (time: number) => void;
  updatePlaybackDuration: (duration: number) => void;
  updatePlaybackSpeed: (speed: number) => void;
  toggleRepeatMode: () => void;
  toggleShuffle: () => void;
  toggleLike: () => void;
  toggleAutoplay: () => void;
  playNext: () => void;
  playPrevious: () => void;
  setQueue: (tracks: Audio[], startIndex?: number) => void;
  addToQueue: (audio: Audio) => void;
  addNext: (audio: Audio) => void;
  removeFromQueue: (index: number) => void;
  clearQueue: () => void;
}

export const useAudioStore = create<AudioStore>((set, get) => ({
  audio: null,
  playback: { currentTime: 0, duration: 0, speed: 1 },
  status: AudioStatus.IDLE,
  showFullPlayer: false,
  repeatMode: RepeatMode.OFF,
  shuffle: false,
  liked: false,
  queue: [],
  currentIndex: -1,
  autoplay: true,

  setAudio: (audio: Audio) => {
    set({ audio, status: AudioStatus.LOADING });
    audioPlayer.load(audio.id, audio);
  },

  setAudioById: async (audioId: string) => {
    set({ status: AudioStatus.LOADING });
    try {
      const data = await fetchAudioInfo(audioId);
      const audio: Audio = {
        id: data.id,
        type: 'video',
        title: data.title,
        description: data.description || '',
        duration: data.duration || 0,
        viewCount: data.viewCount || 0,
        published: data.published,
        thumbnail: data.thumbnail,
        channel: data.channel || { name: '' },
      };
      set({ audio, status: AudioStatus.LOADING });
      audioPlayer.load(audio.id, audio);
    } catch (error) {
      console.error('Error fetching audio info:', error);
      set({ status: AudioStatus.ERROR });
    }
  },

  clearAudio: () => set({
    audio: null,
    status: AudioStatus.IDLE,
    playback: { currentTime: 0, duration: 0, speed: 1 },
  }),

  setStatus: (status) => set({ status }),

  togglePlay: () => {
    const { status } = get();
    if (status === AudioStatus.PLAYING) {
      audioPlayer.pause();
    } else if (status === AudioStatus.PAUSED) {
      audioPlayer.play();
    }
  },

  setShowFullPlayer: (show) => set({ showFullPlayer: show }),

  updatePlaybackTime: (time) => set((state) => ({
    playback: { ...state.playback, currentTime: time },
  })),

  updatePlaybackDuration: (duration) => set((state) => ({
    playback: { ...state.playback, duration },
  })),

  updatePlaybackSpeed: (speed) => set((state) => ({
    playback: { ...state.playback, speed },
  })),

  toggleRepeatMode: () => set((state) => {
    const modes = [RepeatMode.OFF, RepeatMode.ALL, RepeatMode.ONE];
    const idx = modes.indexOf(state.repeatMode);
    const next = modes[(idx + 1) % modes.length];
    audioPlayer.setRepeatMode(next);
    return { repeatMode: next };
  }),

  toggleShuffle: () => set((state) => ({ shuffle: !state.shuffle })),

  toggleLike: () => {
    const state = get();
    if (!state.audio) return;
    const newLiked = !state.liked;
    set({ liked: newLiked });

    (async () => {
      try {
        const audio = state.audio!;
        const track = {
          video_id: audio.id,
          title: audio.title,
          channel: audio.channel?.name || '',
          thumbnail: audio.thumbnail,
          duration: audio.duration,
        };
        if (newLiked) {
          await addLike(track);
        } else {
          await removeLike(audio.id);
        }
      } catch {
        set({ liked: !newLiked });
      }
    })();
  },

  toggleAutoplay: () => set((state) => ({ autoplay: !state.autoplay })),

  playNext: () => {
    const { queue, currentIndex, repeatMode, shuffle, autoplay, audio } = get();
    if (queue.length === 0) return;

    let nextIndex: number;
    if (shuffle) {
      nextIndex = Math.floor(Math.random() * queue.length);
    } else {
      nextIndex = currentIndex + 1;
      if (nextIndex >= queue.length) {
        if (repeatMode === RepeatMode.ALL) nextIndex = 0;
        else {
          if (autoplay && audio) {
            (async () => {
              try {
                const related = await fetchRelatedTracks(audio.id);
                if (related.results.length > 0) {
                  const tracks = related.results.map((r) => ({
                    id: r.id,
                    type: 'video' as const,
                    title: r.title,
                    description: '',
                    duration: r.duration,
                    viewCount: 0,
                    thumbnail: r.thumbnail,
                    channel: { name: r.channel.name, thumbnail: r.channel.thumbnail },
                  }));
                  set({
                    queue: tracks,
                    currentIndex: 0,
                    audio: tracks[0],
                    status: AudioStatus.LOADING,
                  });
                  audioPlayer.load(tracks[0].id, tracks[0]);
                }
              } catch (error) {
                console.error('Autoplay error:', error);
              }
            })();
          }
          return;
        }
      }
    }

    const next = queue[nextIndex];
    set({ currentIndex: nextIndex, audio: next, status: AudioStatus.LOADING });
    audioPlayer.load(next.id, next);
  },

  playPrevious: () => {
    const { queue, currentIndex, playback, repeatMode, shuffle } = get();
    if (playback.currentTime > 3) {
      set((state) => ({ playback: { ...state.playback, currentTime: 0 } }));
      audioPlayer.seek(0);
      return;
    }

    if (queue.length === 0) return;

    let prevIndex: number;
    if (shuffle) {
      prevIndex = Math.floor(Math.random() * queue.length);
    } else {
      prevIndex = currentIndex - 1;
      if (prevIndex < 0) {
        if (repeatMode === RepeatMode.ALL) prevIndex = queue.length - 1;
        else return;
      }
    }

    const prev = queue[prevIndex];
    set({ currentIndex: prevIndex, audio: prev, status: AudioStatus.LOADING });
    audioPlayer.load(prev.id, prev);
  },

  setQueue: (tracks, startIndex = 0) => {
    if (tracks.length === 0) return;
    const idx = Math.min(startIndex, tracks.length - 1);
    const track = tracks[idx];
    set({
      queue: tracks,
      currentIndex: idx,
      audio: track,
      status: AudioStatus.LOADING,
    });
    audioPlayer.load(track.id, track);
  },

  addToQueue: (audio) => set((state) => ({
    queue: [...state.queue, audio],
  })),

  addNext: (audio) => set((state) => {
    const newQueue = [...state.queue];
    newQueue.splice(state.currentIndex + 1, 0, audio);
    return { queue: newQueue };
  }),

  removeFromQueue: (index) => set((state) => {
    const newQueue = [...state.queue];
    newQueue.splice(index, 1);
    let newIndex = state.currentIndex;
    if (index < state.currentIndex) newIndex--;
    if (index === state.currentIndex) {
      if (newQueue.length === 0) {
        return { queue: [], currentIndex: -1, audio: null, status: AudioStatus.IDLE };
      }
      newIndex = Math.min(newIndex, newQueue.length - 1);
      return { queue: newQueue, currentIndex: newIndex, audio: newQueue[newIndex] };
    }
    return { queue: newQueue, currentIndex: Math.max(0, newIndex) };
  }),

  clearQueue: () => set({ queue: [], currentIndex: -1, audio: null, status: AudioStatus.IDLE }),
}));
