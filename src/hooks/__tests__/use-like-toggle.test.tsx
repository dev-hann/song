import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useLikeToggle } from '../use-like-toggle';

const mockCheckLike = vi.fn();
const mockAddLike = vi.fn();
const mockRemoveLike = vi.fn();

vi.mock('@/services/api', () => ({
  checkLike: (...args: unknown[]) => mockCheckLike(...args),
  addLike: (...args: unknown[]) => mockAddLike(...args),
  removeLike: (...args: unknown[]) => mockRemoveLike(...args),
  fetchLikes: vi.fn().mockResolvedValue([]),
  fetchAudioInfo: vi.fn(),
  fetchRelatedTracks: vi.fn(),
  fetchSearchResults: vi.fn(),
}));

const mockAudio = {
  id: 'v1',
  type: 'video' as const,
  title: 'Test Song',
  description: 'desc',
  duration: 200,
  viewCount: 100,
  thumbnail: 'https://img.test/thumb.jpg',
  channel: { name: 'Artist' },
};

function createWrapper() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
}

describe('useLikeToggle', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockCheckLike.mockResolvedValue({ videoId: 'v1', liked: false });
  });

  it('returns isLiked false initially', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useLikeToggle(mockAudio), { wrapper });

    await waitFor(() => {
      expect(result.current.isLiked).toBe(false);
    });
  });

  it('returns isLiked true when liked', async () => {
    mockCheckLike.mockResolvedValue({ videoId: 'v1', liked: true });
    const wrapper = createWrapper();
    const { result } = renderHook(() => useLikeToggle(mockAudio), { wrapper });

    await waitFor(() => {
      expect(result.current.isLiked).toBe(true);
    });
  });

  it('toggle calls addLike when not liked', async () => {
    mockAddLike.mockResolvedValue(undefined);
    const wrapper = createWrapper();
    const { result } = renderHook(() => useLikeToggle(mockAudio), { wrapper });

    await waitFor(() => {
      expect(result.current.isLiked).toBe(false);
    });

    result.current.toggle();

    await waitFor(() => {
      expect(mockAddLike).toHaveBeenCalledWith({
        videoId: 'v1',
        title: 'Test Song',
        channel: 'Artist',
        thumbnail: 'https://img.test/thumb.jpg',
        duration: 200,
      });
    });
  });

  it('toggle calls removeLike when liked', async () => {
    mockCheckLike.mockResolvedValue({ videoId: 'v1', liked: true });
    mockRemoveLike.mockResolvedValue(undefined);
    const wrapper = createWrapper();
    const { result } = renderHook(() => useLikeToggle(mockAudio), { wrapper });

    await waitFor(() => {
      expect(result.current.isLiked).toBe(true);
    });

    result.current.toggle();

    await waitFor(() => {
      expect(mockRemoveLike).toHaveBeenCalledWith('v1');
    });
  });

  it('does nothing when audio is null', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useLikeToggle(null), { wrapper });

    result.current.toggle();

    expect(mockAddLike).not.toHaveBeenCalled();
    expect(mockRemoveLike).not.toHaveBeenCalled();
  });

  it('does nothing when toggle called without audio', async () => {
    const wrapper = createWrapper();
    const { result } = renderHook(() => useLikeToggle(null), { wrapper });

    result.current.toggle();

    expect(result.current.isLiked).toBe(false);
    expect(result.current.isPending).toBe(false);
  });
});
