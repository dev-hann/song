import type { Audio } from '@song/types';
import { AudioStatus, RepeatMode } from '@song/types';

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
  playNext: () => void;
  playPrevious: () => void;
  setQueue: (tracks: Audio[], startIndex?: number) => void;
  addToQueue: (audio: Audio) => void;
  addNext: (audio: Audio) => void;
  removeFromQueue: (index: number) => void;
  clearQueue: () => void;
  toggleAutoplay: () => void;
}
