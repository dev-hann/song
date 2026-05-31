// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockAuth, mockGetPlaylistById, mockGetSmartPlaylistTracks } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockGetPlaylistById: vi.fn(),
  mockGetSmartPlaylistTracks: vi.fn(),
}));

vi.mock('next/server', () => ({
  NextResponse: {
    json: (body: unknown, init?: { status?: number }) => ({ body, status: init?.status ?? 200 }),
  },
}));

vi.mock('@/server/auth', () => ({ auth: mockAuth }));
vi.mock('@/server/models/playlist', () => ({
  getPlaylistById: mockGetPlaylistById,
  getSmartPlaylistTracks: mockGetSmartPlaylistTracks,
}));

import { GET } from '../route';

const session = { user: { id: 'user1' } };

beforeEach(() => {
  vi.clearAllMocks();
  mockAuth.mockResolvedValue(session);
});

describe('GET /api/playlists/:id/smart-tracks', () => {
  it('returns smart playlist tracks', async () => {
    mockGetPlaylistById.mockResolvedValue({ id: 'pl-1', rules: { match: 'all', conditions: [{ field: 'channel', operator: 'contains', value: 'BTS' }] } });
    mockGetSmartPlaylistTracks.mockResolvedValue([{ videoId: 'v1', title: 'Song' }]);

    const result = await GET(
      new Request('http://localhost/api/playlists/pl-1/smart-tracks'),
      { params: Promise.resolve({ id: 'pl-1' }) },
    );

    expect(result.status).toBe(200);
    expect(result.body).toHaveLength(1);
  });

  it('returns 404 when playlist not found', async () => {
    mockGetPlaylistById.mockResolvedValue(null);

    const result = await GET(
      new Request('http://localhost/api/playlists/missing'),
      { params: Promise.resolve({ id: 'missing' }) },
    );

    expect(result.status).toBe(404);
  });

  it('returns 400 when not a smart playlist', async () => {
    mockGetPlaylistById.mockResolvedValue({ id: 'pl-1', rules: null });

    const result = await GET(
      new Request('http://localhost/api/playlists/pl-1/smart-tracks'),
      { params: Promise.resolve({ id: 'pl-1' }) },
    );

    expect(result.status).toBe(400);
  });

  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValueOnce(null);

    const result = await GET(
      new Request('http://localhost/api/playlists/pl-1/smart-tracks'),
      { params: Promise.resolve({ id: 'pl-1' }) },
    );

    expect(result.status).toBe(401);
  });
});
