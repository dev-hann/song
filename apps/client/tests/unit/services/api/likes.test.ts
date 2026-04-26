import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchLikes, addLike, removeLike, checkLike } from '@/services/api/likes';

vi.mock('@/lib/api-client', () => ({
  apiFetch: vi.fn(),
}));

import { apiFetch } from '@/lib/api-client';

describe('fetchLikes', () => {
  beforeEach(() => {
    vi.mocked(apiFetch).mockReset();
  });

  it('returns likes array on success', async () => {
    const mockLikes = [{ id: 1, video_id: 'v1', title: 'Track' }];
    vi.mocked(apiFetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockLikes),
    } as Response);

    const result = await fetchLikes();
    expect(result).toEqual(mockLikes);
    expect(apiFetch).toHaveBeenCalledWith('/api/likes');
  });
});

describe('addLike', () => {
  beforeEach(() => {
    vi.mocked(apiFetch).mockReset();
  });

  it('returns like on success', async () => {
    const mockLike = { id: 1, video_id: 'v1', title: 'Track' };
    vi.mocked(apiFetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockLike),
    } as Response);

    const track = { video_id: 'v1', title: 'Track', channel: 'Ch', thumbnail: '', duration: 120 };
    const result = await addLike(track);
    expect(result).toEqual(mockLike);
    expect(apiFetch).toHaveBeenCalledWith('/api/likes', expect.objectContaining({
      method: 'POST',
    }));
  });
});

describe('removeLike', () => {
  beforeEach(() => {
    vi.mocked(apiFetch).mockReset();
  });

  it('resolves on success', async () => {
    vi.mocked(apiFetch).mockResolvedValueOnce({ ok: true } as Response);

    await expect(removeLike('v1')).resolves.toBeUndefined();
    expect(apiFetch).toHaveBeenCalledWith('/api/likes/v1', expect.objectContaining({
      method: 'DELETE',
    }));
  });
});

describe('checkLike', () => {
  beforeEach(() => {
    vi.mocked(apiFetch).mockReset();
  });

  it('returns check response on success', async () => {
    const mockCheck = { liked: true };
    vi.mocked(apiFetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockCheck),
    } as Response);

    const result = await checkLike('v1');
    expect(result).toEqual(mockCheck);
    expect(apiFetch).toHaveBeenCalledWith('/api/likes/check/v1');
  });
});
