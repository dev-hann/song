import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchAudioInfo, fetchAudioStream } from '@/services/api/audio';

vi.mock('@/lib/api-client', () => ({
  apiFetch: vi.fn(),
}));

import { apiFetch } from '@/lib/api-client';

const mockAudioInfo = {
  id: 'video123',
  type: 'video',
  title: 'Test Video',
  description: 'Test Description',
  duration: 120,
  viewCount: 5000,
  thumbnail: 'https://example.com/thumb.jpg',
  channel: { id: 'ch1', name: 'Test Channel' },
};

describe('fetchAudioInfo', () => {
  beforeEach(() => {
    vi.mocked(apiFetch).mockReset();
  });

  it('returns audio info on success', async () => {
    vi.mocked(apiFetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockAudioInfo),
    } as Response);

    const result = await fetchAudioInfo('video123');
    expect(result).toEqual(mockAudioInfo);
    expect(apiFetch).toHaveBeenCalledWith('/api/youtube/audio/info?id=video123');
  });

  it('throws on error response', async () => {
    vi.mocked(apiFetch).mockResolvedValueOnce({
      ok: false,
      statusText: 'Not Found',
    } as Response);

    await expect(fetchAudioInfo('bad')).rejects.toThrow('Failed to fetch audio info: Not Found');
  });

  it('throws when data contains error', async () => {
    vi.mocked(apiFetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ error: 'Video not found' }),
    } as Response);

    await expect(fetchAudioInfo('bad')).rejects.toThrow('Video not found');
  });
});

describe('fetchAudioStream', () => {
  beforeEach(() => {
    vi.mocked(apiFetch).mockReset();
  });

  it('returns stream URL on success', async () => {
    const mockStream = { url: 'https://example.com/stream.mp3' };
    vi.mocked(apiFetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockStream),
    } as Response);

    const result = await fetchAudioStream('video123');
    expect(result).toEqual(mockStream);
    expect(apiFetch).toHaveBeenCalledWith('/api/youtube/audio/stream?id=video123');
  });

  it('throws on error response', async () => {
    vi.mocked(apiFetch).mockResolvedValueOnce({
      ok: false,
      statusText: 'Server Error',
    } as Response);

    await expect(fetchAudioStream('bad')).rejects.toThrow('Failed to fetch audio stream: Server Error');
  });
});
