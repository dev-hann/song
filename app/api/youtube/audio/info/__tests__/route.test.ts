// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockGetInfo } = vi.hoisted(() => ({
  mockGetInfo: vi.fn(),
}));

vi.mock('next/server', () => ({
  NextResponse: {
    json: (body: unknown, init?: { status?: number }) => ({ body, status: init?.status ?? 200 }),
  },
}));

vi.mock('@/server/application/wiring', () => ({
  useCases: {
    audio: { getInfo: mockGetInfo },
  },
}));

vi.mock('@/server/application/schemas/response', () => ({
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
    mockGetInfo.mockResolvedValue(info);

    const result = await GET(new Request('http://localhost/api/youtube/audio/info?id=vid1'));

    expect(result.status).toBe(200);
    expect(result.body).toEqual(info);
    expect(mockGetInfo).toHaveBeenCalledWith('vid1');
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
    mockGetInfo.mockRejectedValue(new Error('youtube down'));

    const result = (await GET(new Request('http://localhost/api/youtube/audio/info?id=vid1'))) as unknown as MockResponse;

    expect(result.status).toBe(500);
    expect(result.body.error).toBe('youtube down');
  });

  it('returns generic message for non-Error throws', async () => {
    mockGetInfo.mockRejectedValue(null);

    const result = (await GET(new Request('http://localhost/api/youtube/audio/info?id=vid1'))) as unknown as MockResponse;

    expect(result.status).toBe(500);
    expect(result.body.error).toBe('Failed to get audio info');
  });
});
