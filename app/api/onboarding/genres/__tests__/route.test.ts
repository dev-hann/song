// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockAuth, mockGetGenres } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockGetGenres: vi.fn(),
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
    onboarding: { getGenres: mockGetGenres },
  },
}));

import { GET } from '../route';

const session = { user: { id: 'user1' } };
const genres = [
  { id: 'GN0100', name: '발라드', artists: [{ name: 'IU', albumArt: 'https://img.jpg' }] },
  { id: 'GN0200', name: '댄스', artists: [{ name: 'BTS', albumArt: 'https://img2.jpg' }] },
];

beforeEach(() => {
  vi.clearAllMocks();
  mockAuth.mockResolvedValue(session);
});

describe('GET /api/onboarding/genres', () => {
  it('returns genres for authenticated user', async () => {
    mockGetGenres.mockResolvedValue(genres);

    const result = await GET(new Request('http://localhost/api/onboarding/genres'), { params: Promise.resolve({}) });

    expect(result.status).toBe(200);
    expect(result.body).toEqual({ genres });
    expect(mockGetGenres).toHaveBeenCalled();
  });

  it('returns empty genres array', async () => {
    mockGetGenres.mockResolvedValue([]);

    const result = await GET(new Request('http://localhost/api/onboarding/genres'), { params: Promise.resolve({}) });

    expect(result.status).toBe(200);
    expect(result.body).toEqual({ genres: [] });
  });

  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValueOnce(null);

    const result = await GET(new Request('http://localhost/api/onboarding/genres'), { params: Promise.resolve({}) });

    expect(result.status).toBe(401);
  });

  it('returns 500 on unexpected error', async () => {
    mockGetGenres.mockRejectedValue(new Error('Melon fail'));

    const result = await GET(new Request('http://localhost/api/onboarding/genres'), { params: Promise.resolve({}) });

    expect(result.status).toBe(500);
  });
});
