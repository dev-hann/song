// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockGetLyrics } = vi.hoisted(() => ({
  mockGetLyrics: vi.fn(),
}));

vi.mock('next/server', () => ({
  NextResponse: {
    json: (body: unknown, init?: { status?: number }) => ({ body, status: init?.status ?? 200 }),
  },
}));

vi.mock('@/server/application/wiring', () => ({
  useCases: {
    lyrics: { get: mockGetLyrics },
  },
}));

import { GET } from '../route';

type MockResponse = { body: Record<string, unknown>; status: number };

beforeEach(() => {
  vi.clearAllMocks();
});

describe('GET /api/youtube/audio/lyrics', () => {
  const sampleLyrics = {
    videoId: 'vid1',
    language: 'ko',
    lines: [
      { startTimeMs: 0, endTimeMs: 5000, text: '안녕하세요' },
      { startTimeMs: 5000, endTimeMs: 10000, text: '반갑습니다' },
    ],
  };

  it('returns lyrics for valid video id', async () => {
    mockGetLyrics.mockResolvedValue(sampleLyrics);

    const result = await GET(new Request('http://localhost/api/youtube/audio/lyrics?id=vid1'));

    expect(result.status).toBe(200);
    expect(result.body).toEqual(sampleLyrics);
    expect(mockGetLyrics).toHaveBeenCalledWith('vid1');
  });

  it('returns null lyrics when no transcript available', async () => {
    mockGetLyrics.mockResolvedValue(null);

    const result = (await GET(new Request('http://localhost/api/youtube/audio/lyrics?id=vid1'))) as unknown as MockResponse;

    expect(result.status).toBe(200);
    expect(result.body).toEqual({ lyrics: null });
  });

  it('returns 400 for missing id', async () => {
    const result = (await GET(new Request('http://localhost/api/youtube/audio/lyrics'))) as unknown as MockResponse;

    expect(result.status).toBe(400);
  });

  it('returns 400 for empty id', async () => {
    const result = (await GET(new Request('http://localhost/api/youtube/audio/lyrics?id='))) as unknown as MockResponse;

    expect(result.status).toBe(400);
  });

  it('returns 500 on youtube api error', async () => {
    mockGetLyrics.mockRejectedValue(new Error('youtube down'));

    const result = (await GET(new Request('http://localhost/api/youtube/audio/lyrics?id=vid1'))) as unknown as MockResponse;

    expect(result.status).toBe(500);
    expect(result.body.error).toBe('youtube down');
  });

  it('returns generic message for non-Error throws', async () => {
    mockGetLyrics.mockRejectedValue(null);

    const result = (await GET(new Request('http://localhost/api/youtube/audio/lyrics?id=vid1'))) as unknown as MockResponse;

    expect(result.status).toBe(500);
    expect(result.body.error).toBe('Failed to get lyrics');
  });
});
