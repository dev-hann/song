import { describe, it, expect, beforeEach } from 'vitest';
import { useAudioStore } from '@/store';
import { AudioStatus, RepeatMode } from '@/constants';
import type { Audio } from '@/types';

describe('useAudioStore', () => {
  const mockAudio: Audio = {
    id: 'test-audio-id',
    type: 'video',
    title: 'Test Audio',
    description: 'Test Description',
    duration: 180,
    viewCount: 1000,
    thumbnail: 'https://example.com/thumb.jpg',
    channel: {
      id: 'test-channel-id',
      name: 'Test Channel',
      thumbnail: 'https://example.com/channel.jpg'
    }
  };

  const mockAudio2: Audio = {
    id: 'test-audio-id-2',
    type: 'video',
    title: 'Test Audio 2',
    description: 'Test Description 2',
    duration: 240,
    viewCount: 2000,
    thumbnail: 'https://example.com/thumb2.jpg',
    channel: {
      id: 'test-channel-id-2',
      name: 'Test Channel 2',
      thumbnail: 'https://example.com/channel2.jpg'
    }
  };

  beforeEach(() => {
    useAudioStore.setState({
      audio: null,
      playback: { currentTime: 0, duration: 0, speed: 1 },
      status: AudioStatus.IDLE,
      showFullPlayer: false,
      repeatMode: RepeatMode.OFF,
      shuffle: false,
      liked: false,
      queue: [],
      currentIndex: -1
    });
  });

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const state = useAudioStore.getState();
      expect(state.audio).toBeNull();
      expect(state.status).toBe(AudioStatus.IDLE);
      expect(state.showFullPlayer).toBe(false);
      expect(state.repeatMode).toBe(RepeatMode.OFF);
      expect(state.shuffle).toBe(false);
      expect(state.liked).toBe(false);
      expect(state.queue).toEqual([]);
      expect(state.currentIndex).toBe(-1);
    });
  });

  describe('queue management', () => {
    it('should clear queue', () => {
      const { clearQueue } = useAudioStore.getState();
      clearQueue();
      
      const state = useAudioStore.getState();
      expect(state.queue).toEqual([]);
      expect(state.currentIndex).toBe(-1);
    });
  });

  describe('playNext', () => {
    beforeEach(() => {
      useAudioStore.setState({ 
        queue: [mockAudio, mockAudio2],
        currentIndex: 0, 
        audio: mockAudio 
      });
    });

    it('should play next track when queue has items', () => {
      const { playNext } = useAudioStore.getState();
      playNext();
      
      const state = useAudioStore.getState();
      expect(state.currentIndex).toBe(1);
      expect(state.audio).toEqual(mockAudio2);
    });

    it('should shuffle when shuffle mode is enabled', () => {
      const { toggleShuffle, playNext } = useAudioStore.getState();
      toggleShuffle();
      
      playNext();
      
      const state = useAudioStore.getState();
      expect(state.shuffle).toBe(true);
      expect(state.currentIndex).toBeGreaterThanOrEqual(0);
      expect(state.currentIndex).toBeLessThan(2);
    });

    it('should not change track when at end of queue with repeat OFF', () => {
      useAudioStore.setState({ currentIndex: 1, repeatMode: RepeatMode.OFF });
      const { playNext } = useAudioStore.getState();
      playNext();
      
      const state = useAudioStore.getState();
      expect(state.currentIndex).toBe(1);
      expect(state.audio).toEqual(mockAudio);
    });

    it('should go to first track when at end of queue with repeat ALL', () => {
      useAudioStore.setState({ currentIndex: 1, repeatMode: RepeatMode.ALL });
      const { playNext } = useAudioStore.getState();
      playNext();
      
      const state = useAudioStore.getState();
      expect(state.currentIndex).toBe(0);
      expect(state.audio).toEqual(mockAudio);
    });

    it('should not play when queue is empty', () => {
      const { clearQueue, playNext } = useAudioStore.getState();
      clearQueue();
      playNext();
      
      const state = useAudioStore.getState();
      expect(state.audio).toBeNull();
    });
  });

  describe('playPrevious', () => {
    beforeEach(() => {
      useAudioStore.setState({ 
        queue: [mockAudio, mockAudio2],
        currentIndex: 1, 
        audio: mockAudio2,
        playback: { currentTime: 5, duration: 240, speed: 1 }
      });
    });

    it('should jump to start when current time is greater than 3 seconds', () => {
      const { playPrevious } = useAudioStore.getState();
      playPrevious();
      
      const state = useAudioStore.getState();
      expect(state.playback.currentTime).toBe(0);
      expect(state.currentIndex).toBe(1);
    });

    it('should play previous track when current time is less than 3 seconds', () => {
      useAudioStore.setState({ playback: { currentTime: 2, duration: 240, speed: 1 } });
      const { playPrevious } = useAudioStore.getState();
      playPrevious();
      
      const state = useAudioStore.getState();
      expect(state.currentIndex).toBe(0);
      expect(state.audio).toEqual(mockAudio);
    });

    it('should shuffle when shuffle mode is enabled', () => {
      const { toggleShuffle, playPrevious } = useAudioStore.getState();
      useAudioStore.setState({ playback: { currentTime: 2, duration: 240, speed: 1 } });
      toggleShuffle();
      
      playPrevious();
      
      const state = useAudioStore.getState();
      expect(state.shuffle).toBe(true);
      expect(state.currentIndex).toBeGreaterThanOrEqual(0);
      expect(state.currentIndex).toBeLessThan(2);
    });

    it('should not change track when at start of queue with repeat OFF', () => {
      useAudioStore.setState({ 
        currentIndex: 0, 
        audio: mockAudio,
        playback: { currentTime: 2, duration: 180, speed: 1 }
      });
      const { playPrevious } = useAudioStore.getState();
      playPrevious();
      
      const state = useAudioStore.getState();
      expect(state.currentIndex).toBe(0);
      expect(state.audio).toEqual(mockAudio);
    });

    it('should go to last track when at start of queue with repeat ALL', () => {
      useAudioStore.setState({ 
        currentIndex: 0, 
        audio: mockAudio,
        playback: { currentTime: 2, duration: 180, speed: 1 },
        repeatMode: RepeatMode.ALL
      });
      const { playPrevious } = useAudioStore.getState();
      playPrevious();
      
      const state = useAudioStore.getState();
      expect(state.currentIndex).toBe(1);
      expect(state.audio).toEqual(mockAudio2);
    });

    it('should not play when queue is empty', () => {
      const { clearQueue, playPrevious } = useAudioStore.getState();
      clearQueue();
      playPrevious();
      
      const state = useAudioStore.getState();
      expect(state.audio).toBeNull();
    });
  });

  describe('shuffle', () => {
    it('should toggle shuffle from false to true', () => {
      const { toggleShuffle } = useAudioStore.getState();
      expect(useAudioStore.getState().shuffle).toBe(false);
      
      toggleShuffle();
      expect(useAudioStore.getState().shuffle).toBe(true);
    });

    it('should toggle shuffle from true to false', () => {
      useAudioStore.setState({ shuffle: true });
      const { toggleShuffle } = useAudioStore.getState();
      
      toggleShuffle();
      expect(useAudioStore.getState().shuffle).toBe(false);
    });
  });

  describe('like', () => {
    it('should toggle like from false to true', () => {
      const { toggleLike } = useAudioStore.getState();
      expect(useAudioStore.getState().liked).toBe(false);
      
      toggleLike();
      expect(useAudioStore.getState().liked).toBe(true);
    });

    it('should toggle like from true to false', () => {
      useAudioStore.setState({ liked: true });
      const { toggleLike } = useAudioStore.getState();
      
      toggleLike();
      expect(useAudioStore.getState().liked).toBe(false);
    });
  });

  describe('repeat mode', () => {
    it('should cycle through repeat modes: OFF -> ALL -> ONE', () => {
      const { toggleRepeatMode } = useAudioStore.getState();
      
      toggleRepeatMode();
      expect(useAudioStore.getState().repeatMode).toBe(RepeatMode.ALL);
      
      toggleRepeatMode();
      expect(useAudioStore.getState().repeatMode).toBe(RepeatMode.ONE);
      
      toggleRepeatMode();
      expect(useAudioStore.getState().repeatMode).toBe(RepeatMode.OFF);
    });
  });

  describe('playback speed', () => {
    it('should update playback speed', () => {
      const { updatePlaybackSpeed } = useAudioStore.getState();
      updatePlaybackSpeed(1.5);
      
      const state = useAudioStore.getState();
      expect(state.playback.speed).toBe(1.5);
    });
  });
});
