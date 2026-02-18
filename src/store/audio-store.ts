import { create } from 'zustand';
import type { AudioStore } from '@/types/store';
import { AudioStatus, RepeatMode } from '@/constants';
import { fetchAudioInfo } from '@/services/api';

/**
 * Zustand store for managing audio playback state.
 * Handles audio loading, playback controls, queue management, and repeat/shuffle modes.
 */
export const useAudioStore = create<AudioStore>((set, get) => ({
  audio: null,
  playback: {
    currentTime: 0,
    duration: 0,
    speed: 1,
  },
  status: AudioStatus.IDLE,
  showFullPlayer: false,
  repeatMode: RepeatMode.OFF,
  shuffle: false,
  liked: false,
  queue: [],
  currentIndex: -1,

  setAudio: async (audioId: string) => {
    set({ status: AudioStatus.LOADING });

    try {
      const audioData = await fetchAudioInfo(audioId);

      const newAudio = {
        id: audioData.id,
        type: 'video' as const,
        title: audioData.title,
        description: audioData.description || '',
        duration: audioData.duration || 0,
        viewCount: audioData.viewCount || 0,
        published: audioData.published,
        thumbnail: audioData.thumbnail,
        channel: audioData.channel ? {
          id: audioData.channel.id,
          name: audioData.channel.name,
          thumbnail: audioData.channel.thumbnail,
        } : { name: '' },
      };

      set({
        audio: newAudio,
        status: AudioStatus.PLAYING,
      });
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

  togglePlay: () => set((state) => {
    const newStatus = state.status === AudioStatus.PLAYING ? AudioStatus.PAUSED : AudioStatus.PLAYING;
    return { status: newStatus };
  }),

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
    const currentIndex = modes.indexOf(state.repeatMode);
    const nextMode = modes[(currentIndex + 1) % modes.length];
    return { repeatMode: nextMode };
  }),

  toggleShuffle: () => set((state) => ({ shuffle: !state.shuffle })),

  toggleLike: () => set((state) => ({ liked: !state.liked })),

  playNext: () => {
    const state = get();
    const { queue, currentIndex, repeatMode } = state;

    if (queue.length === 0) {
      set({ audio: null });
      return;
    }

    let nextIndex = currentIndex + 1;

    // Use random index when shuffle is enabled
    if (state.shuffle) {
      nextIndex = Math.floor(Math.random() * queue.length);
    } else if (nextIndex >= queue.length) {
      // Wrap to beginning or stop based on repeat mode
      if (repeatMode === RepeatMode.ALL) {
        nextIndex = 0;
      } else {
        return;
      }
    }

    // Avoid redundant updates when already at target index
    if (nextIndex === currentIndex) {
      return;
    }

    set({ currentIndex: nextIndex, audio: queue[nextIndex] });
  },

  playPrevious: () => {
    const state = get();
    const { queue, currentIndex, repeatMode, playback } = state;

    // Jump to start if playback time is beyond 3 seconds
    if (playback.currentTime > 3) {
      set((state) => ({ playback: { ...state.playback, currentTime: 0 } }));
      return;
    }

    if (queue.length === 0) {
      set({ audio: null });
      return;
    }

    let prevIndex = currentIndex - 1;

    // Use random index when shuffle is enabled
    if (state.shuffle) {
      prevIndex = Math.floor(Math.random() * queue.length);
    } else if (prevIndex < 0) {
      // Wrap to end or stop based on repeat mode
      if (repeatMode === RepeatMode.ALL) {
        prevIndex = queue.length - 1;
      } else {
        return;
      }
    }

    set({ currentIndex: prevIndex, audio: queue[prevIndex] });
  },

  clearQueue: () => set({ queue: [], currentIndex: -1, audio: null }),
}));
