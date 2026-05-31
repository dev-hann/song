// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockAuth, mockGetPersonalizedRecommendations } = vi.hoisted(() => ({
  mockAuth: vi.fn(),
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

vi.mock('@/server/services/recommendations', () => ({
  getPersonalizedRecommendations: mockGetPersonalizedRecommendations,
}));

import { GET } from '../route';

const session = { user: { id: 'user1' } };

beforeEach(() => {
  vi.clearAllMocks();
  mockAuth.mockResolvedValue(session);
});

describe('GET /api/recommendations', () => {
  it('returns personalized recommendations', async () => {
    const recs = {
      fromChannels: [{ video_id: 'rc1', title: 'Channel Rec' }],
      fromRecent: [{ video_id: 'rr1', title: 'Recent Rec' }],
    };
    mockGetPersonalizedRecommendations.mockResolvedValue(recs);

    const result = await GET(new Request('http://localhost/api/recommendations'), { params: Promise.resolve({}) });

    expect(result.status).toBe(200);
    expect(result.body).toEqual(recs);
    expect(mockGetPersonalizedRecommendations).toHaveBeenCalledWith('user1');
  });

  it('returns empty arrays when no recommendations', async () => {
    mockGetPersonalizedRecommendations.mockResolvedValue({ fromChannels: [], fromRecent: [] });

    const result = await GET(new Request('http://localhost/api/recommendations'), { params: Promise.resolve({}) });

    expect(result.status).toBe(200);
    expect(result.body).toEqual({ fromChannels: [], fromRecent: [] });
  });

  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValueOnce(null);

    const result = await GET(new Request('http://localhost/api/recommendations'), { params: Promise.resolve({}) });

    expect(result.status).toBe(401);
  });

  it('returns 500 on unexpected error', async () => {
    mockGetPersonalizedRecommendations.mockRejectedValue(new Error('service fail'));

    const result = await GET(new Request('http://localhost/api/recommendations'), { params: Promise.resolve({}) });

    expect(result.status).toBe(500);
  });
});
