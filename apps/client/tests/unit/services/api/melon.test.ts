import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchMelonChart } from '@/services/api/melon';

vi.mock('@/lib/api-client', () => ({
  apiFetch: vi.fn(),
}));

import { apiFetch } from '@/lib/api-client';

describe('fetchMelonChart', () => {
  beforeEach(() => {
    vi.mocked(apiFetch).mockReset();
  });

  it('returns chart on success', async () => {
    const mockChart = [{ rank: 1, title: 'Song', artist: 'Artist' }];
    vi.mocked(apiFetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockChart),
    } as Response);

    const result = await fetchMelonChart('realtime');
    expect(result).toEqual(mockChart);
    expect(apiFetch).toHaveBeenCalledWith('/api/melon/chart?type=realtime');
  });

  it('uses realtime as default type', async () => {
    vi.mocked(apiFetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve([]),
    } as Response);

    await fetchMelonChart();
    expect(apiFetch).toHaveBeenCalledWith('/api/melon/chart?type=realtime');
  });

  it('throws on error response', async () => {
    vi.mocked(apiFetch).mockResolvedValueOnce({ ok: false } as Response);

    await expect(fetchMelonChart()).rejects.toThrow('Failed to fetch melon chart');
  });
});
