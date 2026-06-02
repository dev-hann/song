import type { IYouTubeProvider } from '@/server/domain/ports/providers';
import type { Lyrics } from '@/types';

export function createGetLyrics(youtube: IYouTubeProvider) {
  return (videoId: string): Promise<Lyrics | null> => youtube.getLyrics(videoId);
}
