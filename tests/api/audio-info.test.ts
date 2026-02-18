import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '@/app/api/youtube/audio/info/route';
import { NextRequest } from 'next/server';

vi.mock('@/lib/youtube', () => ({
  getInnertube: vi.fn(),
}));

describe('GET /api/youtube/audio/info', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 400 for missing audio ID', async () => {
    const request = new NextRequest('http://localhost:3000/api/youtube/audio/info');

    const response = await GET(request);

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toContain('required');
  });

  it('should return audio info for valid ID', async () => {
    const { getInnertube } = await import('@/lib/youtube');

    const mockBasicInfo = {
      id: 'audio123',
      title: 'Test Audio',
      short_description: 'Test Description',
      duration: { seconds: 120 },
      view_count: 5000,
      upload_date: '2024-01-01',
      thumbnail: [{ url: 'https://example.com/thumb.jpg' }],
      channel_id: 'channel123',
      channel: {
        name: 'Test Channel',
        thumbnails: [{ url: 'https://example.com/channel.jpg' }],
      },
      is_live: 0,
    };

    vi.mocked(getInnertube).mockResolvedValue({
      getBasicInfo: vi.fn().mockResolvedValue({
        basic_info: mockBasicInfo,
      }),
    } as unknown as Awaited<ReturnType<typeof getInnertube>>);

    const request = new NextRequest('http://localhost:3000/api/youtube/audio/info?id=audio123');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.id).toBe('audio123');
    expect(data.title).toBe('Test Audio');
    expect(data.duration).toBe(120);
  });

  it('should return 500 on error', async () => {
    const { getInnertube } = await import('@/lib/youtube');

    vi.mocked(getInnertube).mockRejectedValue(new Error('Audio not found'));

    const request = new NextRequest('http://localhost:3000/api/youtube/audio/info?id=audio123');
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe('Audio not found');
  });
});
