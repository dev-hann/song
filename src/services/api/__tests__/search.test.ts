import { vi, describe, it, expect } from 'vitest';

import { apiFetch } from '@/lib/api-client';
import { fetchSearch } from '../search';

vi.mock('@/lib/api-client', () => ({
  apiFetch: vi.fn(),
}));

const mockApiFetch = vi.mocked(apiFetch);

describe('fetchSearch', () => {
  it('returns array of SearchResultAudio on success', async () => {
    const results = [
      {
        id: 'abc123',
        title: 'Test Song',
        thumbnail: 'https://img.test/thumb.jpg',
        duration: 240,
        channel: { name: 'Test Artist' },
      },
    ];
    const data = {
      query: 'test',
      results,
      has_continuation: false,
    };

    mockApiFetch.mockResolvedValueOnce(data);

    const result = await fetchSearch('test');

    expect(result).toEqual(results);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('abc123');
  });

  it('throws on non-ok response', async () => {
    mockApiFetch.mockRejectedValueOnce(new Error('API Error: 500 Internal Server Error'));

    await expect(fetchSearch('test')).rejects.toThrow('API Error: 500');
  });

  it('passes encoded query parameter in URL', async () => {
    const data = {
      query: 'hello world',
      results: [],
      has_continuation: false,
    };

    mockApiFetch.mockResolvedValueOnce(data);

    await fetchSearch('hello world & more');

    expect(mockApiFetch).toHaveBeenCalledWith(
      '/api/youtube/search?q=hello%20world%20%26%20more',
    );
  });
});
