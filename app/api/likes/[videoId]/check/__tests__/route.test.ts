// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockAuth, mockIsLiked } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockIsLiked: vi.fn(),
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
    likes: { check: mockIsLiked },
  },
}));

vi.mock('@/server/application/schemas/response', () => ({
  LikeCheckResponseSchema: { parse: (v: unknown) => v },
}));

import { GET } from '../route';

const session = { user: { id: 'user1' } };

beforeEach(() => {
  vi.clearAllMocks();
  mockAuth.mockResolvedValue(session);
});

describe('GET /api/likes/check/:videoId', () => {
  it('returns liked status as true', async () => {
    mockIsLiked.mockReturnValue({ videoId: 'vid1', liked: true });

    const result = await GET(
      new Request('http://localhost/api/likes/check/vid1'),
      { params: Promise.resolve({ videoId: 'vid1' }) },
    );

    expect(result.status).toBe(200);
    expect(result.body).toEqual({ videoId: 'vid1', liked: true });
  });

  it('returns liked status as false', async () => {
    mockIsLiked.mockReturnValue({ videoId: 'vid1', liked: false });

    const result = await GET(
      new Request('http://localhost/api/likes/check/vid1'),
      { params: Promise.resolve({ videoId: 'vid1' }) },
    );

    expect(result.status).toBe(200);
    expect(result.body).toEqual({ videoId: 'vid1', liked: false });
  });

  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValueOnce(null);

    const result = await GET(
      new Request('http://localhost/api/likes/check/vid1'),
      { params: Promise.resolve({ videoId: 'vid1' }) },
    );

    expect(result.status).toBe(401);
  });

  it('returns 500 on unexpected error', async () => {
    mockIsLiked.mockImplementation(() => {
      throw new Error('db fail');
    });

    const result = await GET(
      new Request('http://localhost/api/likes/check/vid1'),
      { params: Promise.resolve({ videoId: 'vid1' }) },
    );

    expect(result.status).toBe(500);
  });
});
