// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockAuth, mockRemoveLike } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockRemoveLike: vi.fn(),
}));

vi.mock('next/server', () => ({
  NextResponse: {
    json: (body: unknown, init?: { status?: number }) => ({ body, status: init?.status ?? 200 }),
  },
}));

vi.mock('@/server/auth', () => ({
  auth: mockAuth,
}));

vi.mock('@/server/models/like', () => ({
  removeLike: mockRemoveLike,
}));

import { DELETE } from '../route';

const session = { user: { id: 'user1' } };

beforeEach(() => {
  vi.clearAllMocks();
  mockAuth.mockResolvedValue(session);
});

describe('DELETE /api/likes/:videoId', () => {
  it('removes a like and returns success', async () => {
    mockRemoveLike.mockReturnValue(true);

    const result = await DELETE(
      new Request('http://localhost/api/likes/vid1'),
      { params: Promise.resolve({ videoId: 'vid1' }) },
    );

    expect(result.status).toBe(200);
    expect(result.body).toEqual({ success: true });
    expect(mockRemoveLike).toHaveBeenCalledWith('user1', 'vid1');
  });

  it('returns 404 when like not found', async () => {
    mockRemoveLike.mockReturnValue(false);

    const result = await DELETE(
      new Request('http://localhost/api/likes/missing'),
      { params: Promise.resolve({ videoId: 'missing' }) },
    );

    expect(result.status).toBe(404);
  });

  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValueOnce(null);

    const result = await DELETE(
      new Request('http://localhost/api/likes/vid1'),
      { params: Promise.resolve({ videoId: 'vid1' }) },
    );

    expect(result.status).toBe(401);
  });

  it('returns 500 on unexpected error', async () => {
    mockRemoveLike.mockImplementation(() => {
      throw new Error('db fail');
    });

    const result = await DELETE(
      new Request('http://localhost/api/likes/vid1'),
      { params: Promise.resolve({ videoId: 'vid1' }) },
    );

    expect(result.status).toBe(500);
  });
});
