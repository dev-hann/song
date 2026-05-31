// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockGetInnertube, mockFromBasicInfo } = vi.hoisted(() => ({
  mockGetInnertube: vi.fn(),
  mockFromBasicInfo: vi.fn(),
}));

vi.mock('next/server', () => ({
  NextResponse: {
    json: (body: unknown, init?: { status?: number }) => ({ body, status: init?.status ?? 200 }),
  },
}));

vi.mock('@/server/services/youtube', () => ({
  getInnertube: mockGetInnertube,
}));

vi.mock('@/server/models/audio', () => ({
  fromBasicInfo: mockFromBasicInfo,
}));

vi.mock('@/server/schemas/api', () => ({
  AudioInfoResponseSchema: { parse: (v: unknown) => v },
}));

import { GET } from '../route';

type MockResponse = { body: Record<string, any>; status: number };

beforeEach(() => {
  vi.clearAllMocks();
});

describe('GET /api/youtube/audio/info', () => {
  it('returns audio info for valid video id', async () => {
    const info = { id: 'vid1', title: 'Test Video', duration: 200 };
    const mockInnertube = { getBasicInfo: vi.fn().mockResolvedValue({ id: 'vid1' }) };
    mockGetInnertube.mockResolvedValue(mockInnertube);
    mockFromBasicInfo.mockReturnValue(info);

    const result = await GET(new Request('http://localhost/api/youtube/audio/info?id=vid1'));

    expect(result.status).toBe(200);
    expect(result.body).toEqual(info);
    expect(mockFromBasicInfo).toHaveBeenCalledWith({ id: 'vid1' });
  });

  it('returns 400 for missing id', async () => {
    const result = await GET(new Request('http://localhost/api/youtube/audio/info'));

    expect(result.status).toBe(400);
  });

  it('returns 400 for empty id', async () => {
    const result = await GET(new Request('http://localhost/api/youtube/audio/info?id='));

    expect(result.status).toBe(400);
  });

  it('returns 500 on youtube api error', async () => {
    mockGetInnertube.mockRejectedValue(new Error('youtube down'));

    const result = (await GET(new Request('http://localhost/api/youtube/audio/info?id=vid1'))) as unknown as MockResponse;

    expect(result.status).toBe(500);
    expect(result.body.error).toBe('youtube down');
  });

  it('returns generic message for non-Error throws', async () => {
    mockGetInnertube.mockRejectedValue(null);

    const result = (await GET(new Request('http://localhost/api/youtube/audio/info?id=vid1'))) as unknown as MockResponse;

    expect(result.status).toBe(500);
    expect(result.body.error).toBe('Failed to get audio info');
  });
});
