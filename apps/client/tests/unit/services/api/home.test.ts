import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchHomeData } from '@/services/api/home';

vi.mock('@/lib/api-client', () => ({
  apiFetch: vi.fn(),
}));

import { apiFetch } from '@/lib/api-client';

describe('fetchHomeData', () => {
  beforeEach(() => {
    vi.mocked(apiFetch).mockReset();
  });

  it('returns home data on success', async () => {
    const mockHome = {
      chart: [],
      hot100: [],
      dailyChart: [],
      recent: [],
      likesCount: 5,
    };
    vi.mocked(apiFetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockHome),
    } as Response);

    const result = await fetchHomeData();
    expect(result).toEqual(mockHome);
    expect(apiFetch).toHaveBeenCalledWith('/api/home');
  });

  it('throws on error response', async () => {
    vi.mocked(apiFetch).mockResolvedValueOnce({ ok: false } as Response);

    await expect(fetchHomeData()).rejects.toThrow('Failed to fetch home data');
  });
});
