// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockAuth, mockGetHome } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockGetHome: vi.fn(),
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
    home: { get: mockGetHome },
  },
}));

import { GET } from '../route';

type MockResponse = { body: Record<string, any>; status: number };

const session = { user: { id: 'user1' } };

beforeEach(() => {
  vi.clearAllMocks();
  mockAuth.mockResolvedValue(session);
});

describe('GET /api/home', () => {
  it('returns aggregated home data', async () => {
    const homeData = {
      likesCount: 2,
      recent: [{ video_id: 'v1' }],
      recommendations: { fromChannels: [{ video_id: 'rc1' }], fromRecent: [] },
      chart: [{ rank: 1 }, { rank: 2 }, { rank: 3 }, { rank: 4 }, { rank: 5 }],
      hot100: [{ rank: 1 }, { rank: 2 }, { rank: 3 }, { rank: 4 }, { rank: 5 }],
      dailyChart: [{ rank: 1 }, { rank: 2 }, { rank: 3 }, { rank: 4 }, { rank: 5 }],
    };
    mockGetHome.mockResolvedValue(homeData);

    const result = (await GET(new Request('http://localhost/api/home'), { params: Promise.resolve({}) })) as unknown as MockResponse;

    expect(result.status).toBe(200);
    expect(result.body.likesCount).toBe(2);
    expect(result.body.recent).toEqual([{ video_id: 'v1' }]);
    expect(result.body.recommendations.fromChannels).toHaveLength(1);
    expect(result.body.chart).toHaveLength(5);
    expect(result.body.hot100).toHaveLength(5);
    expect(result.body.dailyChart).toHaveLength(5);
    expect(mockGetHome).toHaveBeenCalledWith('user1');
  });

  it('omits recommendations when empty', async () => {
    mockGetHome.mockResolvedValue({
      likesCount: 0,
      recent: [],
      chart: [],
      hot100: [],
      dailyChart: [],
    });

    const result = (await GET(new Request('http://localhost/api/home'), { params: Promise.resolve({}) })) as unknown as MockResponse;

    expect(result.status).toBe(200);
    expect(result.body.recommendations).toBeUndefined();
  });

  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValueOnce(null);

    const result = await GET(new Request('http://localhost/api/home'), { params: Promise.resolve({}) });

    expect(result.status).toBe(401);
  });

  it('returns 500 on unexpected error', async () => {
    mockGetHome.mockRejectedValue(new Error('db fail'));

    const result = await GET(new Request('http://localhost/api/home'), { params: Promise.resolve({}) });

    expect(result.status).toBe(500);
  });
});
