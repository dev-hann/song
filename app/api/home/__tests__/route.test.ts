// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

const {
  mockAuth,
  mockGetMelonChart,
  mockGetRecentHistory,
  mockGetAllLikes,
  mockGetPersonalizedRecommendations,
} = vi.hoisted(() => ({
  mockAuth: vi.fn(),
  mockGetMelonChart: vi.fn(),
  mockGetRecentHistory: vi.fn(),
  mockGetAllLikes: vi.fn(),
  mockGetPersonalizedRecommendations: vi.fn(),
}));

vi.mock('next/server', () => ({
  NextResponse: {
    json: (body: unknown, init?: { status?: number }) => ({ body, status: init?.status ?? 200 }),
  },
}));

vi.mock('@/server/auth', () => ({
  auth: mockAuth,
}));

vi.mock('@/server/services/melon', () => ({
  getMelonChart: mockGetMelonChart,
}));

vi.mock('@/server/models/history', () => ({
  getRecentHistory: mockGetRecentHistory,
}));

vi.mock('@/server/models/like', () => ({
  getAllLikes: mockGetAllLikes,
}));

vi.mock('@/server/services/recommendations', () => ({
  getPersonalizedRecommendations: mockGetPersonalizedRecommendations,
}));

import { GET } from '../route';

type MockResponse = { body: Record<string, any>; status: number };

const session = { user: { id: 'user1' } };
const chartItems = [
  { rank: 1, title: 'Song 1', artist: 'Artist 1' },
  { rank: 2, title: 'Song 2', artist: 'Artist 2' },
  { rank: 3, title: 'Song 3', artist: 'Artist 3' },
  { rank: 4, title: 'Song 4', artist: 'Artist 4' },
  { rank: 5, title: 'Song 5', artist: 'Artist 5' },
  { rank: 6, title: 'Song 6', artist: 'Artist 6' },
];

beforeEach(() => {
  vi.clearAllMocks();
  mockAuth.mockResolvedValue(session);
  mockGetMelonChart.mockResolvedValue([]);
  mockGetRecentHistory.mockReturnValue([]);
  mockGetAllLikes.mockReturnValue([]);
  mockGetPersonalizedRecommendations.mockResolvedValue({ fromChannels: [], fromRecent: [] });
});

describe('GET /api/home', () => {
  it('returns aggregated home data', async () => {
    mockGetMelonChart.mockImplementation((type: string) =>
      Promise.resolve(chartItems.map(item => ({ ...item, type }))),
    );
    mockGetRecentHistory.mockReturnValue([{ video_id: 'v1' }]);
    mockGetAllLikes.mockReturnValue([{ video_id: 'l1' }, { video_id: 'l2' }]);
    mockGetPersonalizedRecommendations.mockResolvedValue({
      fromChannels: [{ video_id: 'rc1' }],
      fromRecent: [{ video_id: 'rr1' }],
    });

    const result = (await GET(new Request('http://localhost/api/home'), { params: Promise.resolve({}) })) as unknown as MockResponse;

    expect(result.status).toBe(200);
    expect(result.body.likesCount).toBe(2);
    expect(result.body.recent).toEqual([{ video_id: 'v1' }]);
    expect(result.body.recommendations.fromChannels).toHaveLength(1);
    expect(result.body.chart).toHaveLength(5);
    expect(result.body.hot100).toHaveLength(5);
    expect(result.body.dailyChart).toHaveLength(5);
  });

  it('slices chart to 5 items max', async () => {
    mockGetMelonChart.mockResolvedValue(chartItems);

    const result = (await GET(new Request('http://localhost/api/home'), { params: Promise.resolve({}) })) as unknown as MockResponse;

    expect(result.body.chart).toHaveLength(5);
    expect(result.body.hot100).toHaveLength(5);
    expect(result.body.dailyChart).toHaveLength(5);
  });

  it('omits recommendations when empty', async () => {
    mockGetPersonalizedRecommendations.mockResolvedValue({ fromChannels: [], fromRecent: [] });

    const result = (await GET(new Request('http://localhost/api/home'), { params: Promise.resolve({}) })) as unknown as MockResponse;

    expect(result.status).toBe(200);
    expect(result.body.recommendations).toBeUndefined();
  });

  it('includes recommendations when fromChannels has items', async () => {
    mockGetPersonalizedRecommendations.mockResolvedValue({
      fromChannels: [{ video_id: 'rc1' }],
      fromRecent: [],
    });

    const result = (await GET(new Request('http://localhost/api/home'), { params: Promise.resolve({}) })) as unknown as MockResponse;

    expect(result.body.recommendations).toBeDefined();
  });

  it('falls back to empty arrays when melon chart fails', async () => {
    mockGetMelonChart.mockRejectedValue(new Error('melon down'));

    const result = (await GET(new Request('http://localhost/api/home'), { params: Promise.resolve({}) })) as unknown as MockResponse;

    expect(result.status).toBe(200);
    expect(result.body.chart).toEqual([]);
    expect(result.body.hot100).toEqual([]);
    expect(result.body.dailyChart).toEqual([]);
  });

  it('falls back to empty recommendations when service fails', async () => {
    mockGetPersonalizedRecommendations.mockRejectedValue(new Error('recs down'));

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
    mockGetRecentHistory.mockImplementation(() => {
      throw new Error('db fail');
    });

    const result = await GET(new Request('http://localhost/api/home'), { params: Promise.resolve({}) });

    expect(result.status).toBe(500);
  });
});
