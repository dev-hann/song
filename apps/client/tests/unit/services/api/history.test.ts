import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchHistory, addToHistory, clearHistory } from '@/services/api/history';

vi.mock('@/lib/api-client', () => ({
  apiFetch: vi.fn(),
}));

import { apiFetch } from '@/lib/api-client';

describe('fetchHistory', () => {
  beforeEach(() => {
    vi.mocked(apiFetch).mockReset();
  });

  it('returns history array on success', async () => {
    const mockHistory = [{ id: 1, video_id: 'v1', title: 'Track' }];
    vi.mocked(apiFetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockHistory),
    } as Response);

    const result = await fetchHistory(50);
    expect(result).toEqual(mockHistory);
    expect(apiFetch).toHaveBeenCalledWith('/api/history?limit=50');
  });
});

describe('addToHistory', () => {
  beforeEach(() => {
    vi.mocked(apiFetch).mockReset();
  });

  it('resolves on success', async () => {
    vi.mocked(apiFetch).mockResolvedValueOnce({ ok: true } as Response);

    const track = { video_id: 'v1', title: 'Track', channel: 'Ch', thumbnail: '', duration: 120 };
    await expect(addToHistory(track)).resolves.toBeUndefined();
    expect(apiFetch).toHaveBeenCalledWith('/api/history', expect.objectContaining({
      method: 'POST',
    }));
  });
});

describe('clearHistory', () => {
  beforeEach(() => {
    vi.mocked(apiFetch).mockReset();
  });

  it('resolves on success', async () => {
    vi.mocked(apiFetch).mockResolvedValueOnce({ ok: true } as Response);

    await expect(clearHistory()).resolves.toBeUndefined();
    expect(apiFetch).toHaveBeenCalledWith('/api/history', expect.objectContaining({
      method: 'DELETE',
    }));
  });
});
