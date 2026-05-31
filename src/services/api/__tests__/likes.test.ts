import { vi, describe, it, expect } from 'vitest';

import { apiFetch } from '@/lib/api-client';
import { fetchLikes, addLike, removeLike, checkLike } from '../likes';

vi.mock('@/lib/api-client', () => ({
  apiFetch: vi.fn(),
}));

const mockApiFetch = vi.mocked(apiFetch);

describe('fetchLikes', () => {
  it('returns array of likes', async () => {
    const likes = [
      {
        videoId: 'v1',
        title: 'Song 1',
        channel: 'Artist 1',
        thumbnail: 'https://img.test/1.jpg',
        duration: 200,
        likedAt: '2025-01-01T00:00:00Z',
      },
    ];

    mockApiFetch.mockResolvedValueOnce(likes);

    const result = await fetchLikes();

    expect(result).toEqual(likes);
    expect(result).toHaveLength(1);
  });
});

describe('addLike', () => {
  it('POSTs and returns Like', async () => {
    const track = {
      videoId: 'v1',
      title: 'Song',
      channel: 'Artist',
      thumbnail: 'https://img.test/1.jpg',
      duration: 200,
    };
    const returned = {
      ...track,
      likedAt: '2025-06-01T00:00:00Z',
    };

    mockApiFetch.mockResolvedValueOnce(returned);

    const result = await addLike(track);

    expect(result).toEqual(returned);
    expect(mockApiFetch).toHaveBeenCalledWith('/api/likes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(track),
    });
  });
});

describe('removeLike', () => {
  it('DELETEs the like', async () => {
    mockApiFetch.mockResolvedValueOnce(undefined);

    await removeLike('v1');

    expect(mockApiFetch).toHaveBeenCalledWith('/api/likes/v1', {
      method: 'DELETE',
    });
  });
});

describe('checkLike', () => {
  it('returns LikeCheckResponse', async () => {
    const response = { videoId: 'v1', liked: true };

    mockApiFetch.mockResolvedValueOnce(response);

    const result = await checkLike('v1');

    expect(result).toEqual(response);
    expect(result.liked).toBe(true);
  });
});
