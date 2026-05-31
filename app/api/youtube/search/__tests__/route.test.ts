// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

type MockResponse = { body: Record<string, unknown>; status: number };

const { mockGetInnertube, mockToSearchResponse } = vi.hoisted(() => ({
  mockGetInnertube: vi.fn(),
  mockToSearchResponse: vi.fn(),
}));

vi.mock('next/server', () => ({
  NextResponse: {
    json: (body: unknown, init?: { status?: number }) => ({ body, status: init?.status ?? 200 }),
  },
}));

vi.mock('@/server/services/youtube', () => ({
  getInnertube: mockGetInnertube,
}));

vi.mock('@/server/models/search', () => ({
  toSearchResponse: mockToSearchResponse,
  SearchResponseSchema: { parse: (v: unknown) => v },
}));

import { GET } from '../route';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('GET /api/youtube/search', () => {
  it('returns search results for valid query', async () => {
    const searchResult = { results: [{ type: 'video', id: 'vid1', title: 'Test' }] };
    const searchResponse = { query: 'test', results: searchResult.results, filters: {} };
    const mockInnertube = { search: vi.fn().mockResolvedValue(searchResult) };
    mockGetInnertube.mockResolvedValue(mockInnertube);
    mockToSearchResponse.mockReturnValue(searchResponse);

    const result = (await GET(new Request('http://localhost/api/youtube/search?q=test'))) as unknown as MockResponse;

    expect(result.status).toBe(200);
    expect(result.body.results).toHaveLength(1);
    expect(mockToSearchResponse).toHaveBeenCalledWith(searchResult, 'test');
  });

  it('returns 400 for missing query', async () => {
    const result = (await GET(new Request('http://localhost/api/youtube/search'))) as unknown as MockResponse;

    expect(result.status).toBe(400);
  });

  it('returns 400 for empty query', async () => {
    const result = (await GET(new Request('http://localhost/api/youtube/search?q='))) as unknown as MockResponse;

    expect(result.status).toBe(400);
  });

  it('uses default filter when filter param is omitted', async () => {
    const mockInnertube = { search: vi.fn().mockResolvedValue({}) };
    mockGetInnertube.mockResolvedValue(mockInnertube);
    mockToSearchResponse.mockReturnValue({ query: 'test', results: [], filters: {} });

    await GET(new Request('http://localhost/api/youtube/search?q=test'));

    expect(mockInnertube.search).toHaveBeenCalledWith('test');
  });

  it('returns 500 on youtube api error', async () => {
    mockGetInnertube.mockRejectedValue(new Error('youtube down'));

    const result = (await GET(new Request('http://localhost/api/youtube/search?q=test'))) as unknown as MockResponse;

    expect(result.status).toBe(500);
    expect(result.body.error).toBe('youtube down');
  });

  it('returns generic message for non-Error throws', async () => {
    mockGetInnertube.mockRejectedValue('string error');

    const result = (await GET(new Request('http://localhost/api/youtube/search?q=test'))) as unknown as MockResponse;

    expect(result.status).toBe(500);
    expect(result.body.error).toBe('Failed to search');
  });
});
