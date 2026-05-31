// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockAuth, mockUpdatePlaylist } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockUpdatePlaylist: vi.fn(),
}));

vi.mock('next/server', () => ({
  NextResponse: {
    json: (body: unknown, init?: { status?: number }) => ({ body, status: init?.status ?? 200 }),
  },
}));

vi.mock('@/server/auth', () => ({ auth: mockAuth }));
vi.mock('@/server/application/wiring', () => ({
  useCases: {
    playlists: { update: mockUpdatePlaylist },
  },
}));

import { POST } from '../route';

const session = { user: { id: 'user1' } };

beforeEach(() => {
  vi.clearAllMocks();
  mockAuth.mockResolvedValue(session);
});

describe('POST /api/playlists/:id/share', () => {
  it('enables sharing and returns share info', async () => {
    mockUpdatePlaylist.mockResolvedValue({ isPublic: true, shareId: 'abc-123' });

    const result = await POST(
      new Request('http://localhost/api/playlists/pl-1/share', {
        method: 'POST',
        body: JSON.stringify({ isPublic: true }),
      }),
      { params: Promise.resolve({ id: 'pl-1' }) },
    );

    expect(result.status).toBe(200);
    expect(result.body).toEqual({ isPublic: true, shareId: 'abc-123' });
  });

  it('disables sharing', async () => {
    mockUpdatePlaylist.mockResolvedValue({ isPublic: false, shareId: null });

    const result = await POST(
      new Request('http://localhost/api/playlists/pl-1/share', {
        method: 'POST',
        body: JSON.stringify({ isPublic: false }),
      }),
      { params: Promise.resolve({ id: 'pl-1' }) },
    );

    expect(result.status).toBe(200);
    expect(result.body).toEqual({ isPublic: false, shareId: null });
  });

  it('returns 404 when playlist not found', async () => {
    mockUpdatePlaylist.mockResolvedValue(null);

    const result = await POST(
      new Request('http://localhost/api/playlists/missing/share', {
        method: 'POST',
        body: JSON.stringify({ isPublic: true }),
      }),
      { params: Promise.resolve({ id: 'missing' }) },
    );

    expect(result.status).toBe(404);
  });

  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValueOnce(null);

    const result = await POST(
      new Request('http://localhost/api/playlists/pl-1/share', {
        method: 'POST',
        body: JSON.stringify({ isPublic: true }),
      }),
      { params: Promise.resolve({ id: 'pl-1' }) },
    );

    expect(result.status).toBe(401);
  });
});
