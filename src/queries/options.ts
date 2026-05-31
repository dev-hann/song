export const STALE_TIME = {
  SEARCH: 5 * 60 * 1000,
  AUDIO_INFO: 10 * 60 * 1000,
  LIKES: 30 * 1000,
  PLAYLISTS: 30 * 1000,
  HISTORY: 30 * 1000,
  CHANNELS: 5 * 60 * 1000,
  HOME: 60 * 1000,
  MELON: 60 * 1000,
  RECOMMENDATIONS: 10 * 60 * 1000,
  RELATED: 5 * 60 * 1000,
} as const;

export const REFETCH_ON_WINDOW_FOCUS = false;
export const RETRY = 1;
