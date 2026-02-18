import type { Audio } from '@/types';
import { AudioStatus, RepeatMode } from '@/constants';

export interface AudioPlayback {
  currentTime: number;
  duration: number;
  speed: number;
}

export interface AudioStore {
  audio: Audio | null;
  playback: AudioPlayback;
  status: AudioStatus;
  showFullPlayer: boolean;
  repeatMode: RepeatMode;
  shuffle: boolean;
  liked: boolean;
  queue: Audio[];
  currentIndex: number;
  
  setAudio: (audioId: string) => void;
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
  playNext: () => void;
  playPrevious: () => void;
  clearQueue: () => void;
}
