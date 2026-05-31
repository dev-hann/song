import { vi, describe, it, expect } from 'vitest';

import { apiFetch } from '@/lib/api-client';
import { fetchPlaylists, createPlaylist, deletePlaylist } from '../playlists';

vi.mock('@/lib/api-client', () => ({
  apiFetch: vi.fn(),
}));

const mockApiFetch = vi.mocked(apiFetch);

describe('fetchPlaylists', () => {
  it('returns array of playlists', async () => {
    const playlists = [
      {
        id: 'pl1',
        name: 'My Playlist',
        description: '',
        coverImage: '',
        isSystem: false,
        trackCount: 5,
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2025-01-01T00:00:00Z',
      },
    ];

    mockApiFetch.mockResolvedValueOnce(playlists);

    const result = await fetchPlaylists();

    expect(result).toEqual(playlists);
    expect(result).toHaveLength(1);
  });
});

describe('createPlaylist', () => {
  it('POSTs and returns Playlist', async () => {
    const request = { name: 'New Playlist', description: 'Desc' };
    const returned = {
      id: 'pl2',
      name: 'New Playlist',
      description: 'Desc',
      coverImage: '',
      isSystem: false,
      trackCount: 0,
      createdAt: '2025-06-01T00:00:00Z',
      updatedAt: '2025-06-01T00:00:00Z',
    };

    mockApiFetch.mockResolvedValueOnce(returned);

    const result = await createPlaylist(request);

    expect(result).toEqual(returned);
    expect(mockApiFetch).toHaveBeenCalledWith('/api/playlists', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });
  });
});

describe('deletePlaylist', () => {
  it('DELETEs the playlist', async () => {
    mockApiFetch.mockResolvedValueOnce(undefined);

    await deletePlaylist('pl1');

    expect(mockApiFetch).toHaveBeenCalledWith('/api/playlists/pl1', {
      method: 'DELETE',
    });
  });
});
