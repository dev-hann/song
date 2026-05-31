import { vi, describe, it, expect } from 'vitest';

import { apiFetch } from '@/lib/api-client';
import { fetchAudioInfo } from '../audio';

vi.mock('@/lib/api-client', () => ({
  apiFetch: vi.fn(),
}));

const mockApiFetch = vi.mocked(apiFetch);

describe('fetchAudioInfo', () => {
  it('returns ExtendedAudio on success', async () => {
    const audio = {
      id: 'vid1',
      type: 'video' as const,
      title: 'Test Video',
      description: 'A test video',
      duration: 300,
      viewCount: 1000,
      published: '2025-01-01',
      thumbnail: 'https://img.test/thumb.jpg',
      channel: { name: 'Channel', id: 'ch1' },
    };

    mockApiFetch.mockResolvedValueOnce(audio);

    const result = await fetchAudioInfo('vid1');

    expect(result).toEqual(audio);
    expect(result.id).toBe('vid1');
    expect(result.title).toBe('Test Video');
  });

  it('throws on non-ok response', async () => {
    mockApiFetch.mockRejectedValueOnce(new Error('API Error: 404 Not Found'));

    await expect(fetchAudioInfo('bad-id')).rejects.toThrow('API Error: 404');
  });
});
