import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTrackContextMenu } from '../use-track-context-menu';

const mockAddToQueue = vi.fn();
const mockAddNext = vi.fn();

vi.mock('@/store', () => ({
  useAudioStore: {
    getState: () => ({
      addToQueue: mockAddToQueue,
      addNext: mockAddNext,
    }),
  },
}));

const mockTrack = {
  id: 'v1',
  title: 'Test Song',
  channel: 'Artist',
  thumbnail: 'https://img.test/thumb.jpg',
  duration: 200,
};

describe('useTrackContextMenu', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('starts with null track and closed menus', () => {
    const { result } = renderHook(() => useTrackContextMenu());

    expect(result.current.contextTrack).toBeNull();
    expect(result.current.contextOpen).toBe(false);
    expect(result.current.playlistTrack).toBeNull();
    expect(result.current.playlistOpen).toBe(false);
  });

  it('openContext sets track and opens menu', () => {
    const { result } = renderHook(() => useTrackContextMenu());

    act(() => {
      result.current.openContext(mockTrack);
    });

    expect(result.current.contextTrack).toEqual(mockTrack);
    expect(result.current.contextOpen).toBe(true);
  });

  it('setContextOpen closes menu', () => {
    const { result } = renderHook(() => useTrackContextMenu());

    act(() => {
      result.current.openContext(mockTrack);
    });
    act(() => {
      result.current.setContextOpen(false);
    });

    expect(result.current.contextOpen).toBe(false);
    expect(result.current.contextTrack).toEqual(mockTrack);
  });

  it('openPlaylist sets playlistTrack from contextTrack', () => {
    const { result } = renderHook(() => useTrackContextMenu());

    act(() => {
      result.current.openContext(mockTrack);
    });
    act(() => {
      result.current.openPlaylist();
    });

    expect(result.current.playlistTrack).toEqual({
      videoId: 'v1',
      title: 'Test Song',
      channel: 'Artist',
      thumbnail: 'https://img.test/thumb.jpg',
      duration: 200,
    });
    expect(result.current.playlistOpen).toBe(true);
  });

  it('openPlaylist does nothing without contextTrack', () => {
    const { result } = renderHook(() => useTrackContextMenu());

    act(() => {
      result.current.openPlaylist();
    });

    expect(result.current.playlistTrack).toBeNull();
    expect(result.current.playlistOpen).toBe(false);
  });

  it('addToQueue calls store with converted track', () => {
    const { result } = renderHook(() => useTrackContextMenu());

    act(() => {
      result.current.openContext(mockTrack);
    });
    act(() => {
      result.current.addToQueue();
    });

    expect(mockAddToQueue).toHaveBeenCalledWith({
      id: 'v1',
      type: 'video',
      title: 'Test Song',
      description: '',
      duration: 200,
      viewCount: 0,
      thumbnail: 'https://img.test/thumb.jpg',
      channel: { name: 'Artist' },
    });
  });

  it('addToQueue does nothing without contextTrack', () => {
    const { result } = renderHook(() => useTrackContextMenu());

    act(() => {
      result.current.addToQueue();
    });

    expect(mockAddToQueue).not.toHaveBeenCalled();
  });

  it('playNext calls store.addNext', () => {
    const { result } = renderHook(() => useTrackContextMenu());

    act(() => {
      result.current.openContext(mockTrack);
    });
    act(() => {
      result.current.playNext();
    });

    expect(mockAddNext).toHaveBeenCalledWith({
      id: 'v1',
      type: 'video',
      title: 'Test Song',
      description: '',
      duration: 200,
      viewCount: 0,
      thumbnail: 'https://img.test/thumb.jpg',
      channel: { name: 'Artist' },
    });
  });

  it('openInYoutube opens youtube url', () => {
    const openSpy = vi.spyOn(window, 'open').mockReturnValue(null);
    const { result } = renderHook(() => useTrackContextMenu());

    act(() => {
      result.current.openContext(mockTrack);
    });
    act(() => {
      result.current.openInYoutube();
    });

    expect(openSpy).toHaveBeenCalledWith('https://youtube.com/watch?v=v1', '_blank');
    openSpy.mockRestore();
  });

  it('openInYoutube does nothing without contextTrack', () => {
    const openSpy = vi.spyOn(window, 'open').mockReturnValue(null);
    const { result } = renderHook(() => useTrackContextMenu());

    act(() => {
      result.current.openInYoutube();
    });

    expect(openSpy).not.toHaveBeenCalled();
    openSpy.mockRestore();
  });
});
