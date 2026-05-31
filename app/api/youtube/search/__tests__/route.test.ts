// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

type MockResponse = { body: Record<string, unknown>; status: number };

const { mockSearch } = vi.hoisted(() => ({
  mockSearch: vi.fn(),
}));

vi.mock('next/server', () => ({
  NextResponse: {
    json: (body: unknown, init?: { status?: number }) => ({ body, status: init?.status ?? 200 }),
  },
}));

vi.mock('@/server/application/wiring', () => ({
  useCases: {
    audio: { search: mockSearch },
  },
}));

vi.mock('@/server/application/schemas/response', () => ({
  SearchResponseValidationSchema: { parse: (v: unknown) => v },
}));

import { GET } from '../route';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('GET /api/youtube/search', () => {
  it('returns search results for valid query', async () => {
    const searchResponse = { query: 'test', results: [{ type: 'video', id: 'vid1', title: 'Test' }], filters: {} };
    mockSearch.mockResolvedValue(searchResponse);

    const result = (await GET(new Request('http://localhost/api/youtube/search?q=test'))) as unknown as MockResponse;

    expect(result.status).toBe(200);
    expect(result.body.results).toHaveLength(1);
    expect(mockSearch).toHaveBeenCalledWith('test');
  });

  it('returns 400 for missing query', async () => {
    const result = (await GET(new Request('http://localhost/api/youtube/search'))) as unknown as MockResponse;

    expect(result.status).toBe(400);
  });

  it('returns 400 for empty query', async () => {
    const result = (await GET(new Request('http://localhost/api/youtube/search?q='))) as unknown as MockResponse;

    expect(result.status).toBe(400);
  });

  it('returns 500 on youtube api error', async () => {
    mockSearch.mockRejectedValue(new Error('youtube down'));

    const result = (await GET(new Request('http://localhost/api/youtube/search?q=test'))) as unknown as MockResponse;

    expect(result.status).toBe(500);
    expect(result.body.error).toBe('youtube down');
  });

  it('returns generic message for non-Error throws', async () => {
    mockSearch.mockRejectedValue('string error');

    const result = (await GET(new Request('http://localhost/api/youtube/search?q=test'))) as unknown as MockResponse;

    expect(result.status).toBe(500);
    expect(result.body.error).toBe('Failed to search');
  });
});
