import { http, HttpResponse } from 'msw';

export const handlers = [
  http.get('/api/youtube/search', () => {
    return HttpResponse.json({
      query: 'test',
      results: [
        {
          id: 'video123',
          type: 'video',
          title: 'Test Video',
          description: 'Test Description',
          duration: 120,
          viewCount: 5000,
          thumbnail: 'https://example.com/thumb.jpg',
          channel: {
            id: 'channel123',
            name: 'Test Channel',
            thumbnail: 'https://example.com/channel.jpg',
          },
        },
      ],
      has_continuation: false,
    });
  }),

  http.get('/api/youtube/video/info', () => {
    return HttpResponse.json({
      id: 'video123',
      type: 'video',
      title: 'Test Video',
      description: 'Test Description',
      duration: 120,
      viewCount: 5000,
      published: '2024-01-01',
      thumbnail: 'https://example.com/thumb.jpg',
      channel: {
        id: 'channel123',
        name: 'Test Channel',
        thumbnail: 'https://example.com/channel.jpg',
      },
      isLive: false,
      uploadDate: '2024-01-01T00:00:00.000Z',
    });
  }),

  http.get('/api/youtube/channel/:id', () => {
    return HttpResponse.json({
      id: 'channel123',
      name: 'Test Channel',
      description: 'Test Description',
      thumbnail: 'https://example.com/channel.jpg',
      videos: [],
    });
  }),

  http.get('/api/youtube/playlist/:id', () => {
    return HttpResponse.json({
      id: 'playlist123',
      title: 'Test Playlist',
      description: 'Test Description',
      author: 'Test Channel',
      videoCount: 10,
      thumbnail: 'https://example.com/playlist.jpg',
      videos: [],
    });
  }),

  http.get('/api/youtube/video/download', () => {
    return HttpResponse.json({
      url: 'https://example.com/video.mp4',
    });
  }),
];
