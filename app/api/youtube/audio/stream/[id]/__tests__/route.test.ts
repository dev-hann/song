// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

const { mockGetAudioStreamUrl } = vi.hoisted(() => ({
  mockGetAudioStreamUrl: vi.fn(),
}));

vi.mock('@/server/services/youtube', () => ({
  getAudioStreamUrl: mockGetAudioStreamUrl,
}));

import { GET } from '../route';

describe('GET /api/youtube/audio/stream/:id', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 400 for empty id', async () => {
    const result = await GET(
      new Request('http://localhost/api/youtube/audio/stream/'),
      { params: Promise.resolve({ id: '' }) },
    );

    expect(result.status).toBe(400);
    const body = await result.json();
    expect(body.error).toBe('Audio ID is required');
  });

  it('proxies opus audio stream', async () => {
    const mockBody = new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode('audio data'));
        controller.close();
      },
    });
    const mockUpstream = new Response(mockBody, {
      status: 200,
      headers: {
        'content-type': 'audio/webm',
        'content-length': '10',
      },
    });

    const originalFetch = globalThis.fetch;
    globalThis.fetch = vi.fn().mockResolvedValue(mockUpstream);

    mockGetAudioStreamUrl.mockResolvedValue({
      url: 'https://stream.example.com/opus-audio',
      mime_type: 'audio/webm; codecs="opus"',
    });

    const result = await GET(
      new Request('http://localhost/api/youtube/audio/stream/test-proxy'),
      { params: Promise.resolve({ id: 'test-proxy' }) },
    );

    expect(result.status).toBe(200);
    expect(result.headers.get('content-type')).toBe('audio/webm');
    expect(result.headers.get('Accept-Ranges')).toBe('bytes');

    globalThis.fetch = originalFetch;
  });

  it('passes range header to upstream', async () => {
    const mockUpstream = new Response(null, {
      status: 206,
      headers: {
        'content-type': 'audio/webm',
        'content-range': 'bytes 0-1023/10240',
        'content-length': '1024',
      },
    });

    const originalFetch = globalThis.fetch;
    globalThis.fetch = vi.fn().mockResolvedValue(mockUpstream);

    mockGetAudioStreamUrl.mockResolvedValue({
      url: 'https://stream.example.com/test-range',
      mime_type: 'audio/webm; codecs="opus"',
    });

    const result = await GET(
      new Request('http://localhost/api/youtube/audio/stream/test-range', {
        headers: { range: 'bytes=0-1023' },
      }),
      { params: Promise.resolve({ id: 'test-range' }) },
    );

    expect(result.status).toBe(206);
    expect(result.headers.get('content-range')).toBe('bytes 0-1023/10240');
    expect(globalThis.fetch).toHaveBeenCalledWith(
      'https://stream.example.com/test-range',
      expect.objectContaining({
        headers: { range: 'bytes=0-1023' },
      }),
    );

    globalThis.fetch = originalFetch;
  });

  it('returns 500 on youtube api error', async () => {
    mockGetAudioStreamUrl.mockRejectedValue(new Error('youtube down'));

    const result = await GET(
      new Request('http://localhost/api/youtube/audio/stream/test-err'),
      { params: Promise.resolve({ id: 'test-err' }) },
    );

    expect(result.status).toBe(500);
    const body = await result.json();
    expect(body.error).toBe('Failed to stream audio');
  });

  it('returns error when upstream is not ok', async () => {
    const mockUpstream = new Response(null, { status: 403 });
    const originalFetch = globalThis.fetch;
    globalThis.fetch = vi.fn().mockResolvedValue(mockUpstream);

    mockGetAudioStreamUrl.mockResolvedValue({
      url: 'https://stream.example.com/test-upstream',
      mime_type: 'video/mp4',
    });

    const result = await GET(
      new Request('http://localhost/api/youtube/audio/stream/test-upstream'),
      { params: Promise.resolve({ id: 'test-upstream' }) },
    );

    expect(result.status).toBe(403);

    globalThis.fetch = originalFetch;
  });

  it('caches stream url and reuses on second request', async () => {
    const mockUpstream = new Response(new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode('audio'));
        controller.close();
      },
    }), {
      status: 200,
      headers: { 'content-type': 'audio/webm' },
    });

    const originalFetch = globalThis.fetch;
    globalThis.fetch = vi.fn().mockResolvedValue(mockUpstream);

    mockGetAudioStreamUrl.mockResolvedValue({
      url: 'https://stream.example.com/test-cache',
      mime_type: 'audio/webm; codecs="opus"',
    });

    await GET(
      new Request('http://localhost/api/youtube/audio/stream/test-cache'),
      { params: Promise.resolve({ id: 'test-cache' }) },
    );
    await GET(
      new Request('http://localhost/api/youtube/audio/stream/test-cache'),
      { params: Promise.resolve({ id: 'test-cache' }) },
    );

    expect(mockGetAudioStreamUrl).toHaveBeenCalledTimes(1);

    globalThis.fetch = originalFetch;
  });

  it('retries on fetch failure and invalidates cache', async () => {
    const mockUpstream = new Response(new ReadableStream({
      start(controller) {
        controller.enqueue(new TextEncoder().encode('audio'));
        controller.close();
      },
    }), {
      status: 200,
      headers: { 'content-type': 'audio/webm' },
    });

    const originalFetch = globalThis.fetch;
    globalThis.fetch = vi.fn()
      .mockRejectedValueOnce(new Error('network error'))
      .mockResolvedValueOnce(mockUpstream);

    mockGetAudioStreamUrl.mockResolvedValue({
      url: 'https://stream.example.com/test-retry',
      mime_type: 'audio/webm; codecs="opus"',
    });

    const result = await GET(
      new Request('http://localhost/api/youtube/audio/stream/test-retry'),
      { params: Promise.resolve({ id: 'test-retry' }) },
    );

    expect(result.status).toBe(200);
    expect(mockGetAudioStreamUrl).toHaveBeenCalledTimes(2);

    globalThis.fetch = originalFetch;
  });

  it('returns 500 when no streaming data available', async () => {
    mockGetAudioStreamUrl.mockRejectedValue(new Error('No streaming data available'));

    const result = await GET(
      new Request('http://localhost/api/youtube/audio/stream/test-nodata'),
      { params: Promise.resolve({ id: 'test-nodata' }) },
    );

    expect(result.status).toBe(500);
    const body = await result.json();
    expect(body.error).toBe('Failed to stream audio');
  });
});
