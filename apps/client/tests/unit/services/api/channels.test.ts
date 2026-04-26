import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchChannel, followChannel, unfollowChannel } from '@/services/api/channels';

vi.mock('@/lib/api-client', () => ({
  apiFetch: vi.fn(),
}));

import { apiFetch } from '@/lib/api-client';

describe('fetchChannel', () => {
  beforeEach(() => {
    vi.mocked(apiFetch).mockReset();
  });

  it('returns channel info on success', async () => {
    const mockChannel = { id: 'ch1', name: 'Test Channel', description: 'Desc', thumbnail: '' };
    vi.mocked(apiFetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockChannel),
    } as Response);

    const result = await fetchChannel('ch1');
    expect(result).toEqual(mockChannel);
    expect(apiFetch).toHaveBeenCalledWith('/api/channels/ch1');
  });

  it('throws on error response', async () => {
    vi.mocked(apiFetch).mockResolvedValueOnce({ ok: false } as Response);

    await expect(fetchChannel('bad')).rejects.toThrow('Failed to fetch channel');
  });
});

describe('followChannel', () => {
  beforeEach(() => {
    vi.mocked(apiFetch).mockReset();
  });

  it('returns followed channel on success', async () => {
    const mockFollowed = { id: 1, channel_id: 'ch1', channel_name: 'Test' };
    vi.mocked(apiFetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockFollowed),
    } as Response);

    const data = { channel_id: 'ch1', channel_name: 'Test' };
    const result = await followChannel(data);
    expect(result).toEqual(mockFollowed);
    expect(apiFetch).toHaveBeenCalledWith('/api/channels/ch1/follow', expect.objectContaining({
      method: 'POST',
    }));
  });
});

describe('unfollowChannel', () => {
  beforeEach(() => {
    vi.mocked(apiFetch).mockReset();
  });

  it('resolves on success', async () => {
    vi.mocked(apiFetch).mockResolvedValueOnce({ ok: true } as Response);

    await expect(unfollowChannel('ch1')).resolves.toBeUndefined();
    expect(apiFetch).toHaveBeenCalledWith('/api/channels/ch1/follow', expect.objectContaining({
      method: 'DELETE',
    }));
  });
});
