// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockAuth, mockAddTrackToPlaylist, mockRemoveTrackFromPlaylist } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockAddTrackToPlaylist: vi.fn(),
  mockRemoveTrackFromPlaylist: vi.fn(),
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
    playlists: { addTrack: mockAddTrackToPlaylist, removeTrack: mockRemoveTrackFromPlaylist },
  },
}));

import { POST, DELETE } from '../route';

const session = { user: { id: 'user1' } };
const trackData = {
  videoId: 'vid1',
  title: 'Test Song',
  channel: 'Test Artist',
  thumbnail: 'https://img.example.com/thumb.jpg',
  duration: 200,
};

beforeEach(() => {
  vi.clearAllMocks();
  mockAuth.mockResolvedValue(session);
});

describe('POST /api/playlists/:id/tracks', () => {
  it('adds track to playlist and returns 201', async () => {
    const added = { id: 1, playlistId: 'pl-1', ...trackData };
    mockAddTrackToPlaylist.mockReturnValue(added);

    const result = await POST(
      new Request('http://localhost/api/playlists/pl-1/tracks', {
        method: 'POST',
        body: JSON.stringify(trackData),
      }),
      { params: Promise.resolve({ id: 'pl-1' }) },
    );

    expect(result.status).toBe(201);
    expect(result.body).toEqual(added);
    expect(mockAddTrackToPlaylist).toHaveBeenCalledWith('user1', 'pl-1', trackData);
  });

  it('returns 409 when track already exists or playlist not found', async () => {
    mockAddTrackToPlaylist.mockReturnValue(null);

    const result = await POST(
      new Request('http://localhost/api/playlists/pl-1/tracks', {
        method: 'POST',
        body: JSON.stringify(trackData),
      }),
      { params: Promise.resolve({ id: 'pl-1' }) },
    );

    expect(result.status).toBe(409);
  });

  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValueOnce(null);

    const result = await POST(
      new Request('http://localhost/api/playlists/pl-1/tracks', {
        method: 'POST',
        body: JSON.stringify(trackData),
      }),
      { params: Promise.resolve({ id: 'pl-1' }) },
    );

    expect(result.status).toBe(401);
  });

  it('returns 400 for missing video_id', async () => {
    const result = await POST(
      new Request('http://localhost/api/playlists/pl-1/tracks', {
        method: 'POST',
        body: JSON.stringify({ ...trackData, videoId: '' }),
      }),
      { params: Promise.resolve({ id: 'pl-1' }) },
    );

    expect(result.status).toBe(400);
  });

  it('returns 400 for missing title', async () => {
    const result = await POST(
      new Request('http://localhost/api/playlists/pl-1/tracks', {
        method: 'POST',
        body: JSON.stringify({ ...trackData, title: '' }),
      }),
      { params: Promise.resolve({ id: 'pl-1' }) },
    );

    expect(result.status).toBe(400);
  });

  it('returns 400 for negative duration', async () => {
    const result = await POST(
      new Request('http://localhost/api/playlists/pl-1/tracks', {
        method: 'POST',
        body: JSON.stringify({ ...trackData, duration: -1 }),
      }),
      { params: Promise.resolve({ id: 'pl-1' }) },
    );

    expect(result.status).toBe(400);
  });

  it('uses defaults for omitted optional fields', async () => {
    const minimal = { videoId: 'vid1', title: 'Test Song' };
    mockAddTrackToPlaylist.mockReturnValue({ id: 1 });

    await POST(
      new Request('http://localhost/api/playlists/pl-1/tracks', {
        method: 'POST',
        body: JSON.stringify(minimal),
      }),
      { params: Promise.resolve({ id: 'pl-1' }) },
    );

    expect(mockAddTrackToPlaylist).toHaveBeenCalledWith('user1', 'pl-1', {
      videoId: 'vid1',
      title: 'Test Song',
      channel: '',
      thumbnail: '',
      duration: 0,
    });
  });

  it('returns 500 on unexpected error', async () => {
    mockAddTrackToPlaylist.mockImplementation(() => {
      throw new Error('db fail');
    });

    const result = await POST(
      new Request('http://localhost/api/playlists/pl-1/tracks', {
        method: 'POST',
        body: JSON.stringify(trackData),
      }),
      { params: Promise.resolve({ id: 'pl-1' }) },
    );

    expect(result.status).toBe(500);
  });
});

describe('DELETE /api/playlists/:id/tracks', () => {
  it('removes track from playlist', async () => {
    mockRemoveTrackFromPlaylist.mockReturnValue(true);

    const result = await DELETE(
      new Request('http://localhost/api/playlists/pl-1/tracks?videoId=vid1'),
      { params: Promise.resolve({ id: 'pl-1' }) },
    );

    expect(result.status).toBe(200);
    expect(result.body).toEqual({ success: true });
    expect(mockRemoveTrackFromPlaylist).toHaveBeenCalledWith('user1', 'pl-1', 'vid1');
  });

  it('returns 400 when videoId is missing', async () => {
    const result = await DELETE(
      new Request('http://localhost/api/playlists/pl-1/tracks'),
      { params: Promise.resolve({ id: 'pl-1' }) },
    );

    expect(result.status).toBe(400);
  });

  it('returns 404 when track not found in playlist', async () => {
    mockRemoveTrackFromPlaylist.mockReturnValue(false);

    const result = await DELETE(
      new Request('http://localhost/api/playlists/pl-1/tracks?videoId=vid1'),
      { params: Promise.resolve({ id: 'pl-1' }) },
    );

    expect(result.status).toBe(404);
  });

  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValueOnce(null);

    const result = await DELETE(
      new Request('http://localhost/api/playlists/pl-1/tracks?videoId=vid1'),
      { params: Promise.resolve({ id: 'pl-1' }) },
    );

    expect(result.status).toBe(401);
  });

  it('returns 500 on unexpected error', async () => {
    mockRemoveTrackFromPlaylist.mockImplementation(() => {
      throw new Error('db fail');
    });

    const result = await DELETE(
      new Request('http://localhost/api/playlists/pl-1/tracks?videoId=vid1'),
      { params: Promise.resolve({ id: 'pl-1' }) },
    );

    expect(result.status).toBe(500);
  });
});
