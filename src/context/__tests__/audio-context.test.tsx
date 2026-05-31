import { vi, describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { AudioStatus } from '@/constants';
import type { Audio } from '@/types';

const {
  mockAddToHistory,
  mockOnStatus,
  statusListeners,
  mockOnTime,
  mockOnBuffered,
  mockOnEnded,
  mockSetOnPlayNext,
} = vi.hoisted(() => {
  const statusListeners = new Set<(status: AudioStatus) => void>();
  return {
    mockAddToHistory: vi.fn().mockResolvedValue(undefined),
    mockOnStatus: vi.fn((fn: (status: AudioStatus) => void) => {
      statusListeners.add(fn);
      return () => { statusListeners.delete(fn); };
    }),
    statusListeners,
    mockOnTime: vi.fn(() => () => undefined),
    mockOnBuffered: vi.fn(() => () => undefined),
    mockOnEnded: vi.fn(() => () => undefined),
    mockSetOnPlayNext: vi.fn(),
  };
});

vi.mock('@/lib/audio-player', () => ({
  audioPlayer: {
    load: vi.fn().mockResolvedValue(undefined),
    onStatus: mockOnStatus,
    onTime: mockOnTime,
    onBuffered: mockOnBuffered,
    onEnded: mockOnEnded,
    setOnPlayNext: mockSetOnPlayNext,
    seek: vi.fn(),
    setSpeed: vi.fn(),
    tryResumeOnVisible: vi.fn(),
  },
}));

vi.mock('@/services/api', () => ({
  fetchAudioInfo: vi.fn(),
  fetchRelatedTracks: vi.fn(),
  addLike: vi.fn(),
  removeLike: vi.fn(),
  addToHistory: mockAddToHistory,
}));

import { useAudioStore } from '@/store/audio-store';

const audioA: Audio = {
  id: 'video-a',
  type: 'video',
  title: 'Song A',
  description: '',
  duration: 200,
  viewCount: 100,
  thumbnail: 'https://example.com/a.jpg',
  channel: { name: 'Channel A' },
};

const audioB: Audio = {
  id: 'video-b',
  type: 'video',
  title: 'Song B',
  description: '',
  duration: 180,
  viewCount: 50,
  thumbnail: 'https://example.com/b.jpg',
  channel: { name: 'Channel B' },
};

async function renderAudioProvider() {
  const { AudioProvider } = await import('../audio-context');
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <AudioProvider>{children}</AudioProvider>
  );
  return renderHook(() => useAudioStore(), { wrapper });
}

describe('AudioProvider - history saving', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    statusListeners.clear();
    useAudioStore.setState({
      audio: null,
      status: AudioStatus.IDLE,
      queue: [],
      currentIndex: -1,
    });
  });

  it('calls addToHistory when audio transitions to PLAYING', async () => {
    await renderAudioProvider();

    act(() => {
      useAudioStore.getState().setAudio(audioA);
    });

    expect(useAudioStore.getState().status).toBe(AudioStatus.LOADING);

    act(() => {
      statusListeners.forEach((fn) => { fn(AudioStatus.PLAYING); });
    });

    expect(useAudioStore.getState().status).toBe(AudioStatus.PLAYING);

    await vi.waitFor(() => {
      expect(mockAddToHistory).toHaveBeenCalledTimes(1);
    });

    expect(mockAddToHistory).toHaveBeenCalledWith({
      videoId: 'video-a',
      title: 'Song A',
      channel: 'Channel A',
      thumbnail: 'https://example.com/a.jpg',
      duration: 200,
    });
  });

  it('does not duplicate history on pause/resume of same track', async () => {
    await renderAudioProvider();

    act(() => {
      useAudioStore.getState().setAudio(audioA);
    });
    act(() => {
      statusListeners.forEach((fn) => { fn(AudioStatus.PLAYING); });
    });

    await vi.waitFor(() => {
      expect(mockAddToHistory).toHaveBeenCalledTimes(1);
    });

    act(() => {
      statusListeners.forEach((fn) => { fn(AudioStatus.PAUSED); });
    });
    act(() => {
      statusListeners.forEach((fn) => { fn(AudioStatus.PLAYING); });
    });

    expect(mockAddToHistory).toHaveBeenCalledTimes(1);
  });

  it('saves history for each different track in sequence', async () => {
    await renderAudioProvider();

    act(() => {
      useAudioStore.getState().setAudio(audioA);
    });
    act(() => {
      statusListeners.forEach((fn) => { fn(AudioStatus.PLAYING); });
    });

    await vi.waitFor(() => {
      expect(mockAddToHistory).toHaveBeenCalledTimes(1);
    });

    act(() => {
      useAudioStore.getState().setAudio(audioB);
    });
    act(() => {
      statusListeners.forEach((fn) => { fn(AudioStatus.PLAYING); });
    });

    await vi.waitFor(() => {
      expect(mockAddToHistory).toHaveBeenCalledTimes(2);
    });

    expect(mockAddToHistory).toHaveBeenNthCalledWith(1, expect.objectContaining({ videoId: 'video-a' }));
    expect(mockAddToHistory).toHaveBeenNthCalledWith(2, expect.objectContaining({ videoId: 'video-b' }));
  });

  it('does not call addToHistory when status is LOADING', async () => {
    await renderAudioProvider();

    act(() => {
      useAudioStore.getState().setAudio(audioA);
    });

    expect(useAudioStore.getState().status).toBe(AudioStatus.LOADING);
    expect(mockAddToHistory).not.toHaveBeenCalled();
  });
});
