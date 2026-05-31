import { http, HttpResponse } from 'msw';
import type { SearchResponse, HomeResponse } from '@/types';

export const handlers = [
  http.get('/api/health', () => {
    return HttpResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: 1,
    });
  }),

  http.get('/api/youtube/search', ({ request }) => {
    const url = new URL(request.url);
    const q = url.searchParams.get('q');

    if (!q) {
      return HttpResponse.json(
        { error: 'Query parameter "q" is required' },
        { status: 400 },
      );
    }

    return HttpResponse.json({
      query: q,
      results: [
        {
          id: 'mock-video-id-1',
          title: `Mock result for "${q}"`,
          thumbnail: 'https://i.ytimg.com/vi/mock/default.jpg',
          duration: 200,
          channel: { name: 'Mock Artist' },
        },
      ],
      has_continuation: false,
    } satisfies SearchResponse);
  }),

  http.get('/api/youtube/audio/info', ({ request }) => {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return HttpResponse.json(
        { error: 'ID parameter is required' },
        { status: 400 },
      );
    }

    return HttpResponse.json({
      id,
      type: 'video',
      title: 'Mock Video Title',
      description: 'Mock description',
      duration: 200,
      viewCount: 1000000,
      thumbnail: 'https://i.ytimg.com/vi/mock/default.jpg',
      channel: {
        id: 'mock-channel-id',
        name: 'Mock Channel',
      },
    });
  }),

  http.get('/api/youtube/audio/stream/:id', ({ params }) => {
    const { id } = params;

    if (!id) {
      return HttpResponse.json(
        { error: 'Audio ID is required' },
        { status: 400 },
      );
    }

    const audioData = new TextEncoder().encode('mock-audio-data');
    return new HttpResponse(audioData, {
      status: 200,
      headers: {
        'content-type': 'audio/webm',
        'content-length': String(audioData.length),
        'accept-ranges': 'bytes',
      },
    });
  }),

  http.get('/api/home', () => {
    return HttpResponse.json({
      chart: [],
      hot100: [],
      dailyChart: [],
      recent: [],
      likesCount: 0,
    } satisfies HomeResponse);
  }),

  http.get('/api/melon/chart', () => {
    return HttpResponse.json([
      { rank: 1, title: 'Mock Song', artist: 'Mock Artist', album: 'Mock Album', albumArt: '' },
    ]);
  }),

  http.get('/api/playlists', () => {
    return HttpResponse.json([]);
  }),

  http.get('/api/likes', () => {
    return HttpResponse.json([]);
  }),

  http.get('/api/history', () => {
    return HttpResponse.json([]);
  }),

  http.get('/api/recommendations', () => {
    return HttpResponse.json({
      fromChannels: [],
      fromRecent: [],
    });
  }),
];
