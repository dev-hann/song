import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchSearch } from '@/services/api/search';

vi.mock('@/lib/api-client', () => ({
  apiFetch: vi.fn(),
}));

import { apiFetch } from '@/lib/api-client';

describe('fetchSearch', () => {
  beforeEach(() => {
    vi.mocked(apiFetch).mockReset();
  });

  it('returns results array on success', async () => {
    const mockResults = [
      { id: 'v1', title: 'Video 1', thumbnail: '', duration: 120, channel: { name: 'Ch1' } },
    ];
    vi.mocked(apiFetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ results: mockResults }),
    } as Response);

    const result = await fetchSearch('test query');
    expect(result).toEqual(mockResults);
    expect(apiFetch).toHaveBeenCalledWith('/api/youtube/search?q=test%20query');
  });

  it('throws on error response', async () => {
    vi.mocked(apiFetch).mockResolvedValueOnce({
      ok: false,
      statusText: 'Bad Request',
    } as Response);

    await expect(fetchSearch('fail')).rejects.toThrow('Failed to search: Bad Request');
  });

  it('returns empty array when results is empty', async () => {
    vi.mocked(apiFetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ results: null }),
    } as Response);

    const result = await fetchSearch('empty');
    expect(result).toEqual([]);
  });
});
