// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockAuth, mockGetAllPlaylists, mockGetOrCreateLikedPlaylist, mockCreatePlaylist } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockGetAllPlaylists: vi.fn(),
  mockGetOrCreateLikedPlaylist: vi.fn(),
  mockCreatePlaylist: vi.fn(),
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
  getAllPlaylists: mockGetAllPlaylists,
  getOrCreateLikedPlaylist: mockGetOrCreateLikedPlaylist,
  createPlaylist: mockCreatePlaylist,
}));

import { GET, POST } from '../route';

const session = { user: { id: 'user1' } };
const likedPlaylist = { id: 'liked-1', name: 'Liked Songs', is_system: true, track_count: 5 };
const customPlaylist = { id: 'pl-1', name: 'My Playlist', is_system: false, track_count: 3 };

beforeEach(() => {
  vi.clearAllMocks();
  mockAuth.mockResolvedValue(session);
});

describe('GET /api/playlists', () => {
  it('returns merged playlists with liked playlist first', async () => {
    mockGetOrCreateLikedPlaylist.mockReturnValue(likedPlaylist);
    mockGetAllPlaylists.mockReturnValue([customPlaylist]);

    const result = await GET(new Request('http://localhost/api/playlists'), { params: Promise.resolve({}) });

    expect(result.status).toBe(200);
    expect(result.body).toEqual([likedPlaylist, customPlaylist]);
  });

  it('deduplicates liked playlist from getAllPlaylists', async () => {
    mockGetOrCreateLikedPlaylist.mockReturnValue(likedPlaylist);
    mockGetAllPlaylists.mockReturnValue([likedPlaylist, customPlaylist]);

    const result = await GET(new Request('http://localhost/api/playlists'), { params: Promise.resolve({}) });

    expect(result.body).toEqual([likedPlaylist, customPlaylist]);
  });

  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValueOnce(null);

    const result = await GET(new Request('http://localhost/api/playlists'), { params: Promise.resolve({}) });

    expect(result.status).toBe(401);
  });

  it('returns 500 on unexpected error', async () => {
    mockGetAllPlaylists.mockImplementation(() => {
      throw new Error('db fail');
    });

    const result = await GET(new Request('http://localhost/api/playlists'), { params: Promise.resolve({}) });

    expect(result.status).toBe(500);
  });
});

describe('POST /api/playlists', () => {
  it('creates a playlist and returns 201', async () => {
    const created = { id: 'new-1', name: 'New Playlist', description: '', user_id: 'user1' };
    mockCreatePlaylist.mockReturnValue(created);

    const result = await POST(
      new Request('http://localhost/api/playlists', {
        method: 'POST',
        body: JSON.stringify({ name: 'New Playlist', description: '' }),
      }),
      { params: Promise.resolve({}) },
    );

    expect(result.status).toBe(201);
    expect(result.body).toEqual(created);
    expect(mockCreatePlaylist).toHaveBeenCalledWith('user1', 'New Playlist', '');
  });

  it('uses default empty description when omitted', async () => {
    mockCreatePlaylist.mockReturnValue({ id: 'new-1', name: 'Test' });

    await POST(
      new Request('http://localhost/api/playlists', {
        method: 'POST',
        body: JSON.stringify({ name: 'Test' }),
      }),
      { params: Promise.resolve({}) },
    );

    expect(mockCreatePlaylist).toHaveBeenCalledWith('user1', 'Test', '');
  });

  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValueOnce(null);

    const result = await POST(
      new Request('http://localhost/api/playlists', {
        method: 'POST',
        body: JSON.stringify({ name: 'Test' }),
      }),
      { params: Promise.resolve({}) },
    );

    expect(result.status).toBe(401);
  });

  it('returns 400 for empty name', async () => {
    const result = await POST(
      new Request('http://localhost/api/playlists', {
        method: 'POST',
        body: JSON.stringify({ name: '' }),
      }),
      { params: Promise.resolve({}) },
    );

    expect(result.status).toBe(400);
  });

  it('returns 400 for name exceeding 200 characters', async () => {
    const result = await POST(
      new Request('http://localhost/api/playlists', {
        method: 'POST',
        body: JSON.stringify({ name: 'a'.repeat(201) }),
      }),
      { params: Promise.resolve({}) },
    );

    expect(result.status).toBe(400);
  });

  it('returns 500 on unexpected error', async () => {
    mockCreatePlaylist.mockImplementation(() => {
      throw new Error('db fail');
    });

    const result = await POST(
      new Request('http://localhost/api/playlists', {
        method: 'POST',
        body: JSON.stringify({ name: 'Test' }),
      }),
      { params: Promise.resolve({}) },
    );

    expect(result.status).toBe(500);
  });
});
