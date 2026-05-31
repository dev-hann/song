// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockGetMelonChart } = vi.hoisted(() => ({
  mockGetMelonChart: vi.fn(),
}));

vi.mock('next/server', () => ({
  NextResponse: {
    json: (body: unknown, init?: { status?: number }) => ({ body, status: init?.status ?? 200 }),
  },
}));

vi.mock('@/server/services/melon', () => ({
  getMelonChart: mockGetMelonChart,
}));

import { GET } from '../route';

type MockResponse = { body: Record<string, any>; status: number };

beforeEach(() => {
  vi.clearAllMocks();
});

describe('GET /api/melon/chart', () => {
  it('returns realtime chart by default', async () => {
    const chart = [{ rank: 1, title: 'Song 1' }];
    mockGetMelonChart.mockResolvedValue(chart);

    const result = await GET(new Request('http://localhost/api/melon/chart'));

    expect(result.status).toBe(200);
    expect(result.body).toEqual(chart);
    expect(mockGetMelonChart).toHaveBeenCalledWith('realtime');
  });

  it('returns hot100 chart when specified', async () => {
    const chart = [{ rank: 1, title: 'Hot Song' }];
    mockGetMelonChart.mockResolvedValue(chart);

    const result = await GET(new Request('http://localhost/api/melon/chart?type=hot100'));

    expect(result.status).toBe(200);
    expect(mockGetMelonChart).toHaveBeenCalledWith('hot100');
  });

  it('returns daily chart when specified', async () => {
    mockGetMelonChart.mockResolvedValue([]);

    const result = await GET(new Request('http://localhost/api/melon/chart?type=daily'));

    expect(result.status).toBe(200);
    expect(mockGetMelonChart).toHaveBeenCalledWith('daily');
  });

  it('defaults to realtime for invalid type', async () => {
    mockGetMelonChart.mockResolvedValue([]);

    const result = await GET(new Request('http://localhost/api/melon/chart?type=invalid'));

    expect(result.status).toBe(200);
    expect(mockGetMelonChart).toHaveBeenCalledWith('realtime');
  });

  it('returns 500 on service error', async () => {
    mockGetMelonChart.mockRejectedValue(new Error('melon down'));

    const result = (await GET(new Request('http://localhost/api/melon/chart'))) as unknown as MockResponse;

    expect(result.status).toBe(500);
    expect(result.body.error).toBe('Failed to fetch chart');
  });
});
