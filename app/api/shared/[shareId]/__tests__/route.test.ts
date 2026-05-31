// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockGetSharedPlaylist } = vi.hoisted(() => ({
  mockGetSharedPlaylist: vi.fn(),
}));

vi.mock('next/server', () => ({
  NextResponse: {
    json: (body: unknown, init?: { status?: number }) => ({ body, status: init?.status ?? 200 }),
  },
}));

vi.mock('@/server/lib/route-helpers', () => ({
  handleErrors: (fn: Function) => fn,
  validateParams: (_schema: unknown, params: Record<string, string>) => ({ data: params, error: null }),
}));

vi.mock('@/server/application/wiring', () => ({
  useCases: {
    playlists: { getShared: mockGetSharedPlaylist },
  },
}));

import { GET } from '../route';

beforeEach(() => {
  vi.clearAllMocks();
});

type MockResponse = { body: Record<string, unknown>; status: number };

describe('GET /api/shared/:shareId', () => {
  it('returns shared playlist', async () => {
    const playlist = {
      id: 'pl-1',
      name: 'Shared Playlist',
      description: '',
      coverImage: '',
      trackCount: 3,
      tracks: [{ videoId: 'v1', title: 'Song' }],
      createdAt: '2025-01-01',
    };
    mockGetSharedPlaylist.mockResolvedValue(playlist);

    const result = await GET(
      new Request('http://localhost/api/shared/abc-123'),
      { params: Promise.resolve({ shareId: 'abc-123' }) },
    ) as unknown as MockResponse;

    expect(result.status).toBe(200);
    expect(result.body.name).toBe('Shared Playlist');
    expect(result.body.tracks).toHaveLength(1);
  });

  it('returns 404 when not found', async () => {
    mockGetSharedPlaylist.mockResolvedValue(null);

    const result = await GET(
      new Request('http://localhost/api/shared/missing'),
      { params: Promise.resolve({ shareId: 'missing' }) },
    ) as unknown as MockResponse;

    expect(result.status).toBe(404);
  });
});
