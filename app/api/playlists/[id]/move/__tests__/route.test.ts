// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockAuth, mockMovePlaylistToFolder } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockMovePlaylistToFolder: vi.fn(),
}));

vi.mock('next/server', () => ({
  NextResponse: {
    json: (body: unknown, init?: { status?: number }) => ({ body, status: init?.status ?? 200 }),
  },
}));

vi.mock('@/server/auth', () => ({ auth: mockAuth }));
vi.mock('@/server/application/wiring', () => ({
  useCases: {
    folders: { movePlaylist: mockMovePlaylistToFolder },
  },
}));

import { POST } from '../route';

const session = { user: { id: 'user1' } };

beforeEach(() => {
  vi.clearAllMocks();
  mockAuth.mockResolvedValue(session);
});

describe('POST /api/playlists/:id/move', () => {
  it('moves playlist to folder', async () => {
    mockMovePlaylistToFolder.mockResolvedValue(true);

    const result = await POST(
      new Request('http://localhost/api/playlists/pl-1/move', {
        method: 'POST',
        body: JSON.stringify({ folderId: 'f-1' }),
      }),
      { params: Promise.resolve({ id: 'pl-1' }) },
    );

    expect(result.status).toBe(200);
    expect(result.body).toEqual({ success: true });
    expect(mockMovePlaylistToFolder).toHaveBeenCalledWith('user1', 'pl-1', 'f-1');
  });

  it('moves playlist out of folder', async () => {
    mockMovePlaylistToFolder.mockResolvedValue(true);

    const result = await POST(
      new Request('http://localhost/api/playlists/pl-1/move', {
        method: 'POST',
        body: JSON.stringify({ folderId: null }),
      }),
      { params: Promise.resolve({ id: 'pl-1' }) },
    );

    expect(result.status).toBe(200);
    expect(mockMovePlaylistToFolder).toHaveBeenCalledWith('user1', 'pl-1', null);
  });

  it('returns 404 when playlist not found', async () => {
    mockMovePlaylistToFolder.mockResolvedValue(false);

    const result = await POST(
      new Request('http://localhost/api/playlists/missing/move', {
        method: 'POST',
        body: JSON.stringify({ folderId: 'f-1' }),
      }),
      { params: Promise.resolve({ id: 'missing' }) },
    );

    expect(result.status).toBe(404);
  });

  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValueOnce(null);

    const result = await POST(
      new Request('http://localhost/api/playlists/pl-1/move', {
        method: 'POST',
        body: JSON.stringify({ folderId: 'f-1' }),
      }),
      { params: Promise.resolve({ id: 'pl-1' }) },
    );

    expect(result.status).toBe(401);
  });
});
