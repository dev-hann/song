// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockAuth, mockReorderPlaylistTracks, mockGetPlaylistById } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockReorderPlaylistTracks: vi.fn(),
  mockGetPlaylistById: vi.fn(),
}));

vi.mock('next/server', () => ({
  NextResponse: {
    json: (body: unknown, init?: { status?: number }) => ({ body, status: init?.status ?? 200 }),
  },
}));

vi.mock('@/server/auth', () => ({
  auth: mockAuth,
}));

vi.mock('@/server/models/playlist', () => ({
  reorderPlaylistTracks: mockReorderPlaylistTracks,
  getPlaylistById: mockGetPlaylistById,
}));

import { PUT } from '../route';

const session = { user: { id: 'user1' } };
const playlist = { id: 'pl-1', name: 'My Playlist', track_count: 3 };

beforeEach(() => {
  vi.clearAllMocks();
  mockAuth.mockResolvedValue(session);
});

describe('PUT /api/playlists/:id/reorder', () => {
  it('reorders tracks and returns updated playlist', async () => {
    const updated = { ...playlist, tracks: [3, 1, 2] };
    mockReorderPlaylistTracks.mockReturnValue(true);
    mockGetPlaylistById.mockReturnValue(updated);

    const result = await PUT(
      new Request('http://localhost/api/playlists/pl-1/reorder', {
        method: 'PUT',
        body: JSON.stringify({ trackIds: [3, 1, 2] }),
      }),
      { params: Promise.resolve({ id: 'pl-1' }) },
    );

    expect(result.status).toBe(200);
    expect(result.body).toEqual(updated);
    expect(mockReorderPlaylistTracks).toHaveBeenCalledWith('user1', 'pl-1', [3, 1, 2]);
  });

  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValueOnce(null);

    const result = await PUT(
      new Request('http://localhost/api/playlists/pl-1/reorder', {
        method: 'PUT',
        body: JSON.stringify({ trackIds: [1, 2] }),
      }),
      { params: Promise.resolve({ id: 'pl-1' }) },
    );

    expect(result.status).toBe(401);
  });

  it('returns 400 for empty trackIds array', async () => {
    const result = await PUT(
      new Request('http://localhost/api/playlists/pl-1/reorder', {
        method: 'PUT',
        body: JSON.stringify({ trackIds: [] }),
      }),
      { params: Promise.resolve({ id: 'pl-1' }) },
    );

    expect(result.status).toBe(400);
  });

  it('returns 400 for non-positive trackIds', async () => {
    const result = await PUT(
      new Request('http://localhost/api/playlists/pl-1/reorder', {
        method: 'PUT',
        body: JSON.stringify({ trackIds: [1, 0, 2] }),
      }),
      { params: Promise.resolve({ id: 'pl-1' }) },
    );

    expect(result.status).toBe(400);
  });

  it('returns 400 for non-integer trackIds', async () => {
    const result = await PUT(
      new Request('http://localhost/api/playlists/pl-1/reorder', {
        method: 'PUT',
        body: JSON.stringify({ trackIds: [1.5, 2] }),
      }),
      { params: Promise.resolve({ id: 'pl-1' }) },
    );

    expect(result.status).toBe(400);
  });

  it('returns 500 on unexpected error', async () => {
    mockReorderPlaylistTracks.mockImplementation(() => {
      throw new Error('db fail');
    });

    const result = await PUT(
      new Request('http://localhost/api/playlists/pl-1/reorder', {
        method: 'PUT',
        body: JSON.stringify({ trackIds: [1, 2] }),
      }),
      { params: Promise.resolve({ id: 'pl-1' }) },
    );

    expect(result.status).toBe(500);
  });
});
