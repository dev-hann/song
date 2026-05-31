import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

const mocks = {
  fetchHistory: vi.fn(),
  addToHistory: vi.fn(),
  clearHistory: vi.fn(),
  fetchPlaylists: vi.fn(),
  fetchPlaylist: vi.fn(),
  createPlaylist: vi.fn(),
  deletePlaylist: vi.fn(),
  addTrackToPlaylist: vi.fn(),
  removeTrackFromPlaylist: vi.fn(),
  fetchLikes: vi.fn(),
  addLike: vi.fn(),
  removeLike: vi.fn(),
  checkLike: vi.fn(),
};

vi.mock('@/services/api', () => ({
  fetchHistory: (...a: unknown[]) => mocks.fetchHistory(...a),
  addToHistory: (...a: unknown[]) => mocks.addToHistory(...a),
  clearHistory: (...a: unknown[]) => mocks.clearHistory(...a),
  fetchPlaylists: (...a: unknown[]) => mocks.fetchPlaylists(...a),
  fetchPlaylist: (...a: unknown[]) => mocks.fetchPlaylist(...a),
  createPlaylist: (...a: unknown[]) => mocks.createPlaylist(...a),
  deletePlaylist: (...a: unknown[]) => mocks.deletePlaylist(...a),
  addTrackToPlaylist: (...a: unknown[]) => mocks.addTrackToPlaylist(...a),
  removeTrackFromPlaylist: (...a: unknown[]) => mocks.removeTrackFromPlaylist(...a),
  fetchLikes: (...a: unknown[]) => mocks.fetchLikes(...a),
  addLike: (...a: unknown[]) => mocks.addLike(...a),
  removeLike: (...a: unknown[]) => mocks.removeLike(...a),
  checkLike: (...a: unknown[]) => mocks.checkLike(...a),
}));

function createWrapper() {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={qc}>{children}</QueryClientProvider>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.fetchHistory.mockResolvedValue([]);
  mocks.fetchPlaylists.mockResolvedValue([]);
  mocks.fetchLikes.mockResolvedValue([]);
});

describe('useHistory', () => {
  it('fetches history with default limit', async () => {
    const { useHistory } = await import('@/queries/history');
    const wrapper = createWrapper();
    renderHook(() => useHistory(), { wrapper });

    await waitFor(() => {
      expect(mocks.fetchHistory).toHaveBeenCalledWith(100);
    });
  });

  it('fetches history with custom limit', async () => {
    const { useHistory } = await import('@/queries/history');
    const wrapper = createWrapper();
    renderHook(() => useHistory(50), { wrapper });

    await waitFor(() => {
      expect(mocks.fetchHistory).toHaveBeenCalledWith(50);
    });
  });
});

describe('useAddToHistory', () => {
  it('calls addToHistory and invalidates', async () => {
    mocks.addToHistory.mockResolvedValue(undefined);
    const { useAddToHistory } = await import('@/queries/history');
    const wrapper = createWrapper();
    const { result } = renderHook(() => useAddToHistory(), { wrapper });

    result.current.mutate({ videoId: 'v1', title: 'T', channel: 'A', thumbnail: 't', duration: 200 });

    await waitFor(() => {
      expect(mocks.addToHistory).toHaveBeenCalledWith(
        { videoId: 'v1', title: 'T', channel: 'A', thumbnail: 't', duration: 200 },
        expect.anything(),
      );
    });
  });
});

describe('useClearHistory', () => {
  it('calls clearHistory', async () => {
    mocks.clearHistory.mockResolvedValue(undefined);
    const { useClearHistory } = await import('@/queries/history');
    const wrapper = createWrapper();
    const { result } = renderHook(() => useClearHistory(), { wrapper });

    result.current.mutate(undefined);

    await waitFor(() => {
      expect(mocks.clearHistory).toHaveBeenCalled();
    });
  });
});

describe('usePlaylists', () => {
  it('fetches playlists', async () => {
    const { usePlaylists } = await import('@/queries/playlists');
    const wrapper = createWrapper();
    renderHook(() => usePlaylists(), { wrapper });

    await waitFor(() => {
      expect(mocks.fetchPlaylists).toHaveBeenCalled();
    });
  });
});

describe('usePlaylist', () => {
  it('fetches single playlist', async () => {
    mocks.fetchPlaylist.mockResolvedValue({ id: 'p1', name: 'Test' });
    const { usePlaylist } = await import('@/queries/playlists');
    const wrapper = createWrapper();
    renderHook(() => usePlaylist('p1'), { wrapper });

    await waitFor(() => {
      expect(mocks.fetchPlaylist).toHaveBeenCalledWith('p1');
    });
  });

  it('does not fetch when id is empty', async () => {
    const { usePlaylist } = await import('@/queries/playlists');
    const wrapper = createWrapper();
    renderHook(() => usePlaylist(''), { wrapper });

    await new Promise(r => setTimeout(r, 100));
    expect(mocks.fetchPlaylist).not.toHaveBeenCalled();
  });
});

describe('useCreatePlaylist', () => {
  it('calls createPlaylist', async () => {
    mocks.createPlaylist.mockResolvedValue({ id: 'p2' });
    const { useCreatePlaylist } = await import('@/queries/playlists');
    const wrapper = createWrapper();
    const { result } = renderHook(() => useCreatePlaylist(), { wrapper });

    result.current.mutate({ name: 'New Playlist' });

    await waitFor(() => {
      expect(mocks.createPlaylist).toHaveBeenCalledWith({ name: 'New Playlist' }, expect.anything());
    });
  });
});

describe('useDeletePlaylist', () => {
  it('calls deletePlaylist', async () => {
    mocks.deletePlaylist.mockResolvedValue(undefined);
    const { useDeletePlaylist } = await import('@/queries/playlists');
    const wrapper = createWrapper();
    const { result } = renderHook(() => useDeletePlaylist(), { wrapper });

    result.current.mutate('p1');

    await waitFor(() => {
      expect(mocks.deletePlaylist).toHaveBeenCalledWith('p1', expect.anything());
    });
  });
});
