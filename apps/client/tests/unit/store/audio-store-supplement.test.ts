import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAudioStore } from '@/store';
import { AudioStatus } from '@/constants';
import type { Audio } from '@/types';

vi.mock('@/lib/audio-player', () => ({
  audioPlayer: {
    load: vi.fn(),
    play: vi.fn(),
    pause: vi.fn(),
    seek: vi.fn(),
    setRepeatMode: vi.fn(),
    setOnPlayNext: vi.fn(),
  },
}));

vi.mock('@/services/api', () => ({
  fetchAudioInfo: vi.fn(),
  addLike: vi.fn(),
  removeLike: vi.fn(),
  fetchRelatedTracks: vi.fn(),
}));

import { audioPlayer } from '@/lib/audio-player';
import { fetchAudioInfo, addLike, removeLike } from '@/services/api';

const mockAudioPlayer = vi.mocked(audioPlayer);
const mockFetchAudioInfo = vi.mocked(fetchAudioInfo);
const mockAddLike = vi.mocked(addLike);
const mockRemoveLike = vi.mocked(removeLike);

const mockAudio: Audio = {
  id: 'audio-1',
  type: 'video',
  title: 'Test Audio',
  description: 'Test Description',
  duration: 180,
  viewCount: 1000,
  thumbnail: 'https://example.com/thumb.jpg',
  channel: { id: 'ch-1', name: 'Test Channel' },
};

const mockAudio2: Audio = {
  id: 'audio-2',
  type: 'video',
  title: 'Test Audio 2',
  description: 'Test Description 2',
  duration: 240,
  viewCount: 2000,
  thumbnail: 'https://example.com/thumb2.jpg',
  channel: { id: 'ch-2', name: 'Test Channel 2' },
};

describe('useAudioStore (supplemental)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAudioStore.setState({
      audio: null,
      playback: { currentTime: 0, duration: 0, speed: 1 },
      status: AudioStatus.IDLE,
      showFullPlayer: false,
      repeatMode: 'off' as any,
      shuffle: false,
      liked: false,
      queue: [],
      currentIndex: -1,
      autoplay: true,
    });
  });

  describe('setAudio', () => {
    it('should set audio, status to LOADING, and call audioPlayer.load', () => {
      const { setAudio } = useAudioStore.getState();
      setAudio(mockAudio);

      const state = useAudioStore.getState();
      expect(state.audio).toEqual(mockAudio);
      expect(state.status).toBe(AudioStatus.LOADING);
      expect(mockAudioPlayer.load).toHaveBeenCalledWith(mockAudio.id, mockAudio);
    });
  });

  describe('clearAudio', () => {
    it('should reset audio, status to IDLE, and playback to defaults', () => {
      useAudioStore.setState({
        audio: mockAudio,
        status: AudioStatus.PLAYING,
        playback: { currentTime: 50, duration: 180, speed: 1.5 },
      });

      const { clearAudio } = useAudioStore.getState();
      clearAudio();

      const state = useAudioStore.getState();
      expect(state.audio).toBeNull();
      expect(state.status).toBe(AudioStatus.IDLE);
      expect(state.playback).toEqual({ currentTime: 0, duration: 0, speed: 1 });
    });
  });

  describe('setQueue', () => {
    it('should set queue, currentIndex, and call audioPlayer.load for start track', () => {
      const tracks = [mockAudio, mockAudio2];
      const { setQueue } = useAudioStore.getState();
      setQueue(tracks, 1);

      const state = useAudioStore.getState();
      expect(state.queue).toEqual(tracks);
      expect(state.currentIndex).toBe(1);
      expect(state.audio).toEqual(mockAudio2);
      expect(state.status).toBe(AudioStatus.LOADING);
      expect(mockAudioPlayer.load).toHaveBeenCalledWith(mockAudio2.id, mockAudio2);
    });

    it('should clamp startIndex to last valid index', () => {
      const tracks = [mockAudio];
      const { setQueue } = useAudioStore.getState();
      setQueue(tracks, 5);

      const state = useAudioStore.getState();
      expect(state.currentIndex).toBe(0);
    });

    it('should not modify state when tracks array is empty', () => {
      const { setQueue } = useAudioStore.getState();
      setQueue([], 0);

      expect(useAudioStore.getState().queue).toEqual([]);
    });
  });

  describe('addToQueue', () => {
    it('should append audio to the queue', () => {
      useAudioStore.setState({ queue: [mockAudio] });

      const { addToQueue } = useAudioStore.getState();
      addToQueue(mockAudio2);

      expect(useAudioStore.getState().queue).toEqual([mockAudio, mockAudio2]);
    });
  });

  describe('addNext', () => {
    it('should insert audio after currentIndex', () => {
      useAudioStore.setState({
        queue: [mockAudio, mockAudio2],
        currentIndex: 0,
      });

      const mockAudio3: Audio = {
        id: 'audio-3',
        type: 'video',
        title: 'Test Audio 3',
        description: '',
        duration: 200,
        viewCount: 0,
        thumbnail: '',
        channel: { name: 'Test' },
      };

      const { addNext } = useAudioStore.getState();
      addNext(mockAudio3);

      expect(useAudioStore.getState().queue).toEqual([mockAudio, mockAudio3, mockAudio2]);
    });
  });

  describe('removeFromQueue', () => {
    it('should remove item and adjust currentIndex when removing before current', () => {
      const mockAudio3: Audio = {
        id: 'audio-3',
        type: 'video',
        title: 'Test Audio 3',
        description: '',
        duration: 200,
        viewCount: 0,
        thumbnail: '',
        channel: { name: 'Test' },
      };
      useAudioStore.setState({
        queue: [mockAudio, mockAudio2, mockAudio3],
        currentIndex: 2,
      });

      const { removeFromQueue } = useAudioStore.getState();
      removeFromQueue(0);

      const state = useAudioStore.getState();
      expect(state.queue).toEqual([mockAudio2, mockAudio3]);
      expect(state.currentIndex).toBe(1);
    });

    it('should remove item and pick next track when removing current', () => {
      const mockAudio3: Audio = {
        id: 'audio-3',
        type: 'video',
        title: 'Test Audio 3',
        description: '',
        duration: 200,
        viewCount: 0,
        thumbnail: '',
        channel: { name: 'Test' },
      };
      useAudioStore.setState({
        queue: [mockAudio, mockAudio2, mockAudio3],
        currentIndex: 1,
      });

      const { removeFromQueue } = useAudioStore.getState();
      removeFromQueue(1);

      const state = useAudioStore.getState();
      expect(state.queue).toEqual([mockAudio, mockAudio3]);
      expect(state.currentIndex).toBe(1);
      expect(state.audio).toEqual(mockAudio3);
    });

    it('should reset when removing the only item', () => {
      useAudioStore.setState({
        queue: [mockAudio],
        currentIndex: 0,
      });

      const { removeFromQueue } = useAudioStore.getState();
      removeFromQueue(0);

      const state = useAudioStore.getState();
      expect(state.queue).toEqual([]);
      expect(state.currentIndex).toBe(-1);
      expect(state.audio).toBeNull();
      expect(state.status).toBe(AudioStatus.IDLE);
    });

    it('should not change currentIndex when removing after current', () => {
      const mockAudio3: Audio = {
        id: 'audio-3',
        type: 'video',
        title: 'Test Audio 3',
        description: '',
        duration: 200,
        viewCount: 0,
        thumbnail: '',
        channel: { name: 'Test' },
      };
      useAudioStore.setState({
        queue: [mockAudio, mockAudio2, mockAudio3],
        currentIndex: 0,
      });

      const { removeFromQueue } = useAudioStore.getState();
      removeFromQueue(2);

      const state = useAudioStore.getState();
      expect(state.queue).toEqual([mockAudio, mockAudio2]);
      expect(state.currentIndex).toBe(0);
    });
  });

  describe('toggleAutoplay', () => {
    it('should toggle autoplay flag', () => {
      expect(useAudioStore.getState().autoplay).toBe(true);

      const { toggleAutoplay } = useAudioStore.getState();
      toggleAutoplay();
      expect(useAudioStore.getState().autoplay).toBe(false);

      toggleAutoplay();
      expect(useAudioStore.getState().autoplay).toBe(true);
    });
  });

  describe('setAudioById', () => {
    it('should fetch audio info and load it', async () => {
      mockFetchAudioInfo.mockResolvedValue({
        id: 'fetched-id',
        title: 'Fetched Audio',
        description: 'Fetched desc',
        duration: 200,
        viewCount: 500,
        thumbnail: 'https://example.com/fetched.jpg',
        channel: { name: 'Fetched Channel' },
      });

      const { setAudioById } = useAudioStore.getState();
      await setAudioById('fetched-id');

      const state = useAudioStore.getState();
      expect(mockFetchAudioInfo).toHaveBeenCalledWith('fetched-id');
      expect(state.audio).toEqual({
        id: 'fetched-id',
        type: 'video',
        title: 'Fetched Audio',
        description: 'Fetched desc',
        duration: 200,
        viewCount: 500,
        thumbnail: 'https://example.com/fetched.jpg',
        channel: { name: 'Fetched Channel' },
      });
      expect(state.status).toBe(AudioStatus.LOADING);
      expect(mockAudioPlayer.load).toHaveBeenCalledWith('fetched-id', state.audio);
    });

    it('should set status to ERROR on fetch failure', async () => {
      mockFetchAudioInfo.mockRejectedValue(new Error('Network error'));

      const { setAudioById } = useAudioStore.getState();
      await setAudioById('bad-id');

      expect(useAudioStore.getState().status).toBe(AudioStatus.ERROR);
    });
  });

  describe('toggleLike', () => {
    it('should set liked to true and call addLike', async () => {
      useAudioStore.setState({ audio: mockAudio, liked: false });
      mockAddLike.mockResolvedValue({} as any);

      const { toggleLike } = useAudioStore.getState();
      toggleLike();

      expect(useAudioStore.getState().liked).toBe(true);
      expect(mockAddLike).toHaveBeenCalledWith({
        video_id: mockAudio.id,
        title: mockAudio.title,
        channel: mockAudio.channel.name,
        thumbnail: mockAudio.thumbnail,
        duration: mockAudio.duration,
      });

      await vi.waitFor(() => {
        expect(mockAddLike).toHaveBeenCalledTimes(1);
      });
    });

    it('should set liked to false and call removeLike', async () => {
      useAudioStore.setState({ audio: mockAudio, liked: true });
      mockRemoveLike.mockResolvedValue(undefined);

      const { toggleLike } = useAudioStore.getState();
      toggleLike();

      expect(useAudioStore.getState().liked).toBe(false);
      expect(mockRemoveLike).toHaveBeenCalledWith(mockAudio.id);

      await vi.waitFor(() => {
        expect(mockRemoveLike).toHaveBeenCalledTimes(1);
      });
    });

    it('should revert liked on API error', async () => {
      useAudioStore.setState({ audio: mockAudio, liked: false });
      mockAddLike.mockRejectedValue(new Error('API error'));

      const { toggleLike } = useAudioStore.getState();
      toggleLike();

      expect(useAudioStore.getState().liked).toBe(true);

      await vi.waitFor(() => {
        expect(useAudioStore.getState().liked).toBe(false);
      });
    });

    it('should not do anything when no audio is set', () => {
      useAudioStore.setState({ audio: null, liked: false });

      const { toggleLike } = useAudioStore.getState();
      toggleLike();

      expect(useAudioStore.getState().liked).toBe(false);
      expect(mockAddLike).not.toHaveBeenCalled();
      expect(mockRemoveLike).not.toHaveBeenCalled();
    });
  });
});
