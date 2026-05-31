// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockAuth, mockGetPlaylistById, mockUpdatePlaylist, mockDeletePlaylist, mockGetAllLikes } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockGetPlaylistById: vi.fn(),
  mockUpdatePlaylist: vi.fn(),
  mockDeletePlaylist: vi.fn(),
  mockGetAllLikes: vi.fn(),
}));

vi.mock('next/server', () => ({
  NextResponse: {
    json: (body: unknown, init?: { status?: number }) => ({ body, status: init?.status ?? 200 }),
  },
}));

vi.mock('@/server/auth', () => ({
  auth: mockAuth,
}));

vi.mock('@/server/application/wiring', () => ({
  useCases: {
    playlists: { getById: mockGetPlaylistById, update: mockUpdatePlaylist, delete: mockDeletePlaylist },
    likes: { getAll: mockGetAllLikes },
  },
}));

import { GET, PATCH, DELETE } from '../route';

type MockResponse = { body: Record<string, any>; status: number };

const session = { user: { id: 'user1' } };
const playlist = { id: 'pl-1', name: 'My Playlist', isSystem: false, trackCount: 3 };

beforeEach(() => {
  vi.clearAllMocks();
  mockAuth.mockResolvedValue(session);
});

describe('GET /api/playlists/:id', () => {
  it('returns playlist by id', async () => {
    mockGetPlaylistById.mockReturnValue(playlist);

    const result = await GET(
      new Request('http://localhost/api/playlists/pl-1'),
      { params: Promise.resolve({ id: 'pl-1' }) },
    );

    expect(result.status).toBe(200);
    expect(result.body).toEqual(playlist);
  });

  it('returns liked count for system playlist', async () => {
    const systemPlaylist = { id: 'liked-1', name: 'Liked Songs', isSystem: true, trackCount: 0 };
    mockGetPlaylistById.mockReturnValue(systemPlaylist);
    mockGetAllLikes.mockReturnValue([{ videoId: 'vid1' }, { videoId: 'vid2' }, { videoId: 'vid3' }]);

    const result = (await GET(
      new Request('http://localhost/api/playlists/liked-1'),
      { params: Promise.resolve({ id: 'liked-1' }) },
    )) as unknown as MockResponse;

    expect(result.status).toBe(200);
    expect(result.body.trackCount).toBe(3);
  });

  it('returns 404 when playlist not found', async () => {
    mockGetPlaylistById.mockReturnValue(null);

    const result = await GET(
      new Request('http://localhost/api/playlists/missing'),
      { params: Promise.resolve({ id: 'missing' }) },
    );

    expect(result.status).toBe(404);
  });

  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValueOnce(null);

    const result = await GET(
      new Request('http://localhost/api/playlists/pl-1'),
      { params: Promise.resolve({ id: 'pl-1' }) },
    );

    expect(result.status).toBe(401);
  });

  it('returns 500 on unexpected error', async () => {
    mockGetPlaylistById.mockImplementation(() => {
      throw new Error('db fail');
    });

    const result = await GET(
      new Request('http://localhost/api/playlists/pl-1'),
      { params: Promise.resolve({ id: 'pl-1' }) },
    );

    expect(result.status).toBe(500);
  });
});

describe('PATCH /api/playlists/:id', () => {
  it('updates playlist and returns it', async () => {
    const updated = { ...playlist, name: 'Updated' };
    mockUpdatePlaylist.mockReturnValue(updated);

    const result = await PATCH(
      new Request('http://localhost/api/playlists/pl-1', {
        method: 'PATCH',
        body: JSON.stringify({ name: 'Updated' }),
      }),
      { params: Promise.resolve({ id: 'pl-1' }) },
    );

    expect(result.status).toBe(200);
    expect(result.body).toEqual(updated);
    expect(mockUpdatePlaylist).toHaveBeenCalledWith('user1', 'pl-1', { name: 'Updated' });
  });

  it('returns 404 when playlist not found', async () => {
    mockUpdatePlaylist.mockReturnValue(null);

    const result = await PATCH(
      new Request('http://localhost/api/playlists/missing', {
        method: 'PATCH',
        body: JSON.stringify({ name: 'Test' }),
      }),
      { params: Promise.resolve({ id: 'missing' }) },
    );

    expect(result.status).toBe(404);
  });

  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValueOnce(null);

    const result = await PATCH(
      new Request('http://localhost/api/playlists/pl-1', {
        method: 'PATCH',
        body: JSON.stringify({ name: 'Test' }),
      }),
      { params: Promise.resolve({ id: 'pl-1' }) },
    );

    expect(result.status).toBe(401);
  });

  it('returns 400 for invalid body', async () => {
    const result = await PATCH(
      new Request('http://localhost/api/playlists/pl-1', {
        method: 'PATCH',
        body: JSON.stringify({ name: '' }),
      }),
      { params: Promise.resolve({ id: 'pl-1' }) },
    );

    expect(result.status).toBe(400);
  });

  it('returns 500 on unexpected error', async () => {
    mockUpdatePlaylist.mockImplementation(() => {
      throw new Error('db fail');
    });

    const result = await PATCH(
      new Request('http://localhost/api/playlists/pl-1', {
        method: 'PATCH',
        body: JSON.stringify({ name: 'Test' }),
      }),
      { params: Promise.resolve({ id: 'pl-1' }) },
    );

    expect(result.status).toBe(500);
  });
});

describe('DELETE /api/playlists/:id', () => {
  it('deletes playlist and returns success', async () => {
    mockDeletePlaylist.mockReturnValue(true);

    const result = await DELETE(
      new Request('http://localhost/api/playlists/pl-1'),
      { params: Promise.resolve({ id: 'pl-1' }) },
    );

    expect(result.status).toBe(200);
    expect(result.body).toEqual({ success: true });
  });

  it('returns 404 when playlist not found or is system', async () => {
    mockDeletePlaylist.mockReturnValue(false);

    const result = await DELETE(
      new Request('http://localhost/api/playlists/pl-1'),
      { params: Promise.resolve({ id: 'pl-1' }) },
    );

    expect(result.status).toBe(404);
  });

  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValueOnce(null);

    const result = await DELETE(
      new Request('http://localhost/api/playlists/pl-1'),
      { params: Promise.resolve({ id: 'pl-1' }) },
    );

    expect(result.status).toBe(401);
  });

  it('returns 500 on unexpected error', async () => {
    mockDeletePlaylist.mockImplementation(() => {
      throw new Error('db fail');
    });

    const result = await DELETE(
      new Request('http://localhost/api/playlists/pl-1'),
      { params: Promise.resolve({ id: 'pl-1' }) },
    );

    expect(result.status).toBe(500);
  });
});
