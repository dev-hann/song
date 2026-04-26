export const queryKeys = {
  all: ['song'] as const,

  youtube: {
    all: () => [...queryKeys.all, 'youtube'] as const,
    search: {
      all: () => [...queryKeys.youtube.all(), 'search'] as const,
      query: (q: string) => [...queryKeys.youtube.all(), 'search', q] as const,
    },
    audio: {
      all: () => [...queryKeys.youtube.all(), 'audio'] as const,
      info: (id: string) => [...queryKeys.youtube.all(), 'audio', 'info', id] as const,
      stream: (id: string) => [...queryKeys.youtube.all(), 'audio', 'stream', id] as const,
    },
  },

  playlists: {
    all: () => [...queryKeys.all, 'playlists'] as const,
    detail: (id: string) => [...queryKeys.all, 'playlists', id] as const,
  },

  likes: {
    all: () => [...queryKeys.all, 'likes'] as const,
    check: (videoId: string) => [...queryKeys.all, 'likes', 'check', videoId] as const,
  },

  history: {
    all: () => [...queryKeys.all, 'history'] as const,
  },

  channels: {
    detail: (id: string) => [...queryKeys.all, 'channels', id] as const,
    followed: () => [...queryKeys.all, 'channels', 'followed'] as const,
  },

  home: {
    all: () => [...queryKeys.all, 'home'] as const,
  },

  melon: {
    chart: (type: string = 'realtime') => [...queryKeys.all, 'melon', 'chart', type] as const,
  },

  recommendations: {
    all: () => [...queryKeys.all, 'recommendations'] as const,
    related: (videoId: string) => [...queryKeys.all, 'recommendations', 'related', videoId] as const,
    personalized: () => [...queryKeys.all, 'recommendations', 'personalized'] as const,
  },
} as const;
