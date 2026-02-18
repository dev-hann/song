export const queryKeys = {
  all: ['youtube'] as const,

  search: {
    all: () => [...queryKeys.all, 'search'] as const,
    query: (q: string) => [...queryKeys.search.all(), q] as const,
  },

  audio: {
    all: () => [...queryKeys.all, 'audio'] as const,
    info: (id: string) => [...queryKeys.audio.all(), 'info', id] as const,
    stream: (id: string) => [...queryKeys.audio.all(), 'stream', id] as const,
  },
} as const;
