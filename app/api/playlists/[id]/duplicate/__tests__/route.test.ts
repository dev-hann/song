// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockAuth, mockDuplicatePlaylist } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockDuplicatePlaylist: vi.fn(),
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
    playlists: { duplicate: mockDuplicatePlaylist },
  },
}));

import { POST } from '../route';

type MockResponse = { body: Record<string, unknown>; status: number } | Response;

const toMockResponse = (res: MockResponse): { body: Record<string, unknown>; status: number } => {
  if (res instanceof Response) {
    return { body: { error: 'Response' }, status: res.status };
  }
  return res;
};

const session = { user: { id: 'user1' } };
const duplicatedPlaylist = {
  id: 'pl-new',
  name: 'My Playlist (사본)',
  isSystem: false,
  trackCount: 3,
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('POST /api/playlists/:id/duplicate', () => {
  it('returns 201 with duplicated playlist', async () => {
    mockAuth.mockResolvedValue(session);
    mockDuplicatePlaylist.mockResolvedValue(duplicatedPlaylist);

    const request = new Request('http://localhost/api/playlists/pl-1/duplicate', { method: 'POST' });
    const response: MockResponse = await POST(request, { params: Promise.resolve({ id: 'pl-1' }) });

    expect(response.status).toBe(201);
    expect(response.body).toEqual(duplicatedPlaylist);
    expect(mockDuplicatePlaylist).toHaveBeenCalledWith('user1', 'pl-1');
  });

  it('returns 401 when unauthenticated', async () => {
    mockAuth.mockResolvedValue(null);

    const request = new Request('http://localhost/api/playlists/pl-1/duplicate', { method: 'POST' });
    const response: MockResponse = await POST(request, { params: Promise.resolve({ id: 'pl-1' }) });

    expect(response.status).toBe(401);
  });

  it('returns 404 when playlist not found', async () => {
    mockAuth.mockResolvedValue(session);
    mockDuplicatePlaylist.mockResolvedValue(null);

    const request = new Request('http://localhost/api/playlists/pl-999/duplicate', { method: 'POST' });
    const response: MockResponse = await POST(request, { params: Promise.resolve({ id: 'pl-999' }) });

    expect(response.status).toBe(404);
  });

  it('returns 500 on server error', async () => {
    mockAuth.mockResolvedValue(session);
    mockDuplicatePlaylist.mockRejectedValue(new Error('DB error'));

    const request = new Request('http://localhost/api/playlists/pl-1/duplicate', { method: 'POST' });
    const response: MockResponse = await POST(request, { params: Promise.resolve({ id: 'pl-1' }) });

    expect(response.status).toBe(500);
  });
});
