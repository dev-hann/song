import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchRelatedTracks, fetchPersonalizedRecommendations } from '@/services/api/recommendations';

vi.mock('@/lib/api-client', () => ({
  apiFetch: vi.fn(),
}));

import { apiFetch } from '@/lib/api-client';

describe('fetchRelatedTracks', () => {
  beforeEach(() => {
    vi.mocked(apiFetch).mockReset();
  });

  it('returns related videos on success', async () => {
    const mockRelated = { videos: [{ id: 'v2', title: 'Related', thumbnail: '', duration: 100, channel: { name: 'Ch' } }] };
    vi.mocked(apiFetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockRelated),
    } as Response);

    const result = await fetchRelatedTracks('v1');
    expect(result).toEqual(mockRelated);
    expect(apiFetch).toHaveBeenCalledWith('/api/youtube/audio/related?id=v1');
  });

  it('throws on error response', async () => {
    vi.mocked(apiFetch).mockResolvedValueOnce({ ok: false } as Response);

    await expect(fetchRelatedTracks('bad')).rejects.toThrow('Failed to fetch related tracks');
  });
});

describe('fetchPersonalizedRecommendations', () => {
  beforeEach(() => {
    vi.mocked(apiFetch).mockReset();
  });

  it('returns recommendations on success', async () => {
    const mockRecs = { fromChannels: [], fromRecent: [] };
    vi.mocked(apiFetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockRecs),
    } as Response);

    const result = await fetchPersonalizedRecommendations();
    expect(result).toEqual(mockRecs);
    expect(apiFetch).toHaveBeenCalledWith('/api/recommendations');
  });

  it('throws on error response', async () => {
    vi.mocked(apiFetch).mockResolvedValueOnce({ ok: false } as Response);

    await expect(fetchPersonalizedRecommendations()).rejects.toThrow('Failed to fetch recommendations');
  });
});
