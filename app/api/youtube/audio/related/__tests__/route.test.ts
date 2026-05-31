// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockGetRelated } = vi.hoisted(() => ({
  mockGetRelated: vi.fn(),
}));

vi.mock('next/server', () => ({
  NextResponse: {
    json: (body: unknown, init?: { status?: number }) => ({ body, status: init?.status ?? 200 }),
  },
}));

vi.mock('@/server/application/wiring', () => ({
  useCases: {
    recommendations: { getRelated: mockGetRelated },
  },
}));

vi.mock('@/server/application/schemas/response', () => ({
  RelatedVideosResponseValidationSchema: { parse: (v: unknown) => v },
}));

import { GET } from '../route';

type MockResponse = { body: Record<string, any>; status: number };

beforeEach(() => {
  vi.clearAllMocks();
});

describe('GET /api/youtube/audio/related', () => {
  it('returns related videos for valid video id', async () => {
    const related = [{ id: 'rel1', title: 'Related 1' }, { id: 'rel2', title: 'Related 2' }];
    mockGetRelated.mockResolvedValue(related);

    const result = await GET(new Request('http://localhost/api/youtube/audio/related?id=vid1'));

    expect(result.status).toBe(200);
    expect(result.body).toEqual(related);
    expect(mockGetRelated).toHaveBeenCalledWith('vid1');
  });

  it('returns 400 for missing id', async () => {
    const result = await GET(new Request('http://localhost/api/youtube/audio/related'));

    expect(result.status).toBe(400);
  });

  it('returns 400 for empty id', async () => {
    const result = await GET(new Request('http://localhost/api/youtube/audio/related?id='));

    expect(result.status).toBe(400);
  });

  it('returns 500 on service error', async () => {
    mockGetRelated.mockRejectedValue(new Error('service down'));

    const result = (await GET(new Request('http://localhost/api/youtube/audio/related?id=vid1'))) as unknown as MockResponse;

    expect(result.status).toBe(500);
    expect(result.body.error).toBe('service down');
  });

  it('returns generic message for non-Error throws', async () => {
    mockGetRelated.mockRejectedValue(undefined);

    const result = (await GET(new Request('http://localhost/api/youtube/audio/related?id=vid1'))) as unknown as MockResponse;

    expect(result.status).toBe(500);
    expect(result.body.error).toBe('Failed to get related videos');
  });
});
