import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  fetchPlaylists,
  createPlaylist,
  deletePlaylist,
  addTrackToPlaylist,
  reorderPlaylistTracks,
} from '@/services/api/playlists';

vi.mock('@/lib/api-client', () => ({
  apiFetch: vi.fn(),
}));

import { apiFetch } from '@/lib/api-client';

describe('fetchPlaylists', () => {
  beforeEach(() => {
    vi.mocked(apiFetch).mockReset();
  });

  it('returns playlists array on success', async () => {
    const mockPlaylists = [{ id: 'p1', name: 'My Playlist' }];
    vi.mocked(apiFetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockPlaylists),
    } as Response);

    const result = await fetchPlaylists();
    expect(result).toEqual(mockPlaylists);
    expect(apiFetch).toHaveBeenCalledWith('/api/playlists');
  });
});

describe('createPlaylist', () => {
  beforeEach(() => {
    vi.mocked(apiFetch).mockReset();
  });

  it('returns created playlist on success', async () => {
    const newPlaylist = { id: 'p1', name: 'New Playlist', tracks: [] };
    vi.mocked(apiFetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(newPlaylist),
    } as Response);

    const result = await createPlaylist({ name: 'New Playlist' } as any);
    expect(result).toEqual(newPlaylist);
    expect(apiFetch).toHaveBeenCalledWith('/api/playlists', expect.objectContaining({
      method: 'POST',
    }));
  });
});

describe('deletePlaylist', () => {
  beforeEach(() => {
    vi.mocked(apiFetch).mockReset();
  });

  it('resolves on success', async () => {
    vi.mocked(apiFetch).mockResolvedValueOnce({ ok: true } as Response);

    await expect(deletePlaylist('p1')).resolves.toBeUndefined();
    expect(apiFetch).toHaveBeenCalledWith('/api/playlists/p1', expect.objectContaining({
      method: 'DELETE',
    }));
  });
});

describe('addTrackToPlaylist', () => {
  beforeEach(() => {
    vi.mocked(apiFetch).mockReset();
  });

  it('resolves on success', async () => {
    vi.mocked(apiFetch).mockResolvedValueOnce({ ok: true } as Response);

    const track = { video_id: 'v1', title: 'Track', channel: 'Ch', thumbnail: '', duration: 120 };
    await expect(addTrackToPlaylist('p1', track as any)).resolves.toBeUndefined();
    expect(apiFetch).toHaveBeenCalledWith('/api/playlists/p1/tracks', expect.objectContaining({
      method: 'POST',
    }));
  });
});

describe('reorderPlaylistTracks', () => {
  beforeEach(() => {
    vi.mocked(apiFetch).mockReset();
  });

  it('returns updated playlist on success', async () => {
    const updated = { id: 'p1', name: 'Playlist', tracks: [2, 1, 3] };
    vi.mocked(apiFetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(updated),
    } as Response);

    const result = await reorderPlaylistTracks('p1', [2, 1, 3]);
    expect(result).toEqual(updated);
    expect(apiFetch).toHaveBeenCalledWith('/api/playlists/p1/reorder', expect.objectContaining({
      method: 'PUT',
      body: JSON.stringify({ trackIds: [2, 1, 3] }),
    }));
  });
});
