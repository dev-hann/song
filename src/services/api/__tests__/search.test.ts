import { vi, describe, it, expect } from 'vitest';

import { apiFetch } from '@/lib/api-client';
import { fetchSearchPage } from '../search';

vi.mock('@/lib/api-client', () => ({
  apiFetch: vi.fn(),
}));

const mockApiFetch = vi.mocked(apiFetch);

describe('fetchSearchPage', () => {
  it('returns SearchPage on success', async () => {
    const page = {
      query: 'test',
      results: [
        {
          id: 'abc123',
          title: 'Test Song',
          thumbnail: 'https://img.test/thumb.jpg',
          duration: 240,
          channel: { name: 'Test Artist' },
        },
      ],
      has_continuation: true,
      continuationToken: 'token123',
    };

    mockApiFetch.mockResolvedValueOnce(page);

    const result = await fetchSearchPage('test');

    expect(result).toEqual(page);
    expect(result.has_continuation).toBe(true);
    expect(result.continuationToken).toBe('token123');
  });

  it('passes continuation token in URL when provided', async () => {
    const page = {
      query: 'test',
      results: [],
      has_continuation: false,
    };

    mockApiFetch.mockResolvedValueOnce(page);

    await fetchSearchPage('test', 'token123');

    expect(mockApiFetch).toHaveBeenCalledWith(
      '/api/youtube/search?q=test&continuation=token123',
    );
  });

  it('encodes query parameter in URL', async () => {
    const page = {
      query: 'hello world',
      results: [],
      has_continuation: false,
    };

    mockApiFetch.mockResolvedValueOnce(page);

    await fetchSearchPage('hello world & more');

    expect(mockApiFetch).toHaveBeenCalledWith(
      '/api/youtube/search?q=hello%20world%20%26%20more',
    );
  });

  it('throws on non-ok response', async () => {
    mockApiFetch.mockRejectedValueOnce(new Error('API Error: 500 Internal Server Error'));

    await expect(fetchSearchPage('test')).rejects.toThrow('API Error: 500');
  });
});
