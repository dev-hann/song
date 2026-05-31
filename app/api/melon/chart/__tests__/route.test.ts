// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockGetChart } = vi.hoisted(() => ({
  mockGetChart: vi.fn(),
}));

vi.mock('next/server', () => ({
  NextResponse: {
    json: (body: unknown, init?: { status?: number }) => ({ body, status: init?.status ?? 200 }),
  },
}));

vi.mock('@/server/application/wiring', () => ({
  melonProvider: { getChart: mockGetChart },
}));

vi.mock('@/server/application/schemas/response', () => ({
  MelonChartResponseSchema: { parse: (v: unknown) => v },
}));

import { GET } from '../route';

type MockResponse = { body: Record<string, any>; status: number };

beforeEach(() => {
  vi.clearAllMocks();
});

describe('GET /api/melon/chart', () => {
  it('returns realtime chart by default', async () => {
    const chart = [{ rank: 1, title: 'Song 1' }];
    mockGetChart.mockResolvedValue(chart);

    const result = await GET(new Request('http://localhost/api/melon/chart'));

    expect(result.status).toBe(200);
    expect(result.body).toEqual(chart);
    expect(mockGetChart).toHaveBeenCalledWith('realtime');
  });

  it('returns hot100 chart when specified', async () => {
    const chart = [{ rank: 1, title: 'Hot Song' }];
    mockGetChart.mockResolvedValue(chart);

    const result = await GET(new Request('http://localhost/api/melon/chart?type=hot100'));

    expect(result.status).toBe(200);
    expect(mockGetChart).toHaveBeenCalledWith('hot100');
  });

  it('returns daily chart when specified', async () => {
    mockGetChart.mockResolvedValue([]);

    const result = await GET(new Request('http://localhost/api/melon/chart?type=daily'));

    expect(result.status).toBe(200);
    expect(mockGetChart).toHaveBeenCalledWith('daily');
  });

  it('defaults to realtime for invalid type', async () => {
    mockGetChart.mockResolvedValue([]);

    const result = await GET(new Request('http://localhost/api/melon/chart?type=invalid'));

    expect(result.status).toBe(200);
    expect(mockGetChart).toHaveBeenCalledWith('realtime');
  });

  it('returns 500 on service error', async () => {
    mockGetChart.mockRejectedValue(new Error('melon down'));

    const result = (await GET(new Request('http://localhost/api/melon/chart'))) as unknown as MockResponse;

    expect(result.status).toBe(500);
    expect(result.body.error).toBe('Failed to fetch chart');
  });
});
