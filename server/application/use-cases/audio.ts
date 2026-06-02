import type { IYouTubeProvider } from '@/server/domain/ports/providers';
import type { ExtendedAudio } from '@/types';

export function createSearchYouTube(youtube: IYouTubeProvider) {
  return (query: string) => youtube.search(`${query} official audio`);
}

export function createSearchMoreYouTube(youtube: IYouTubeProvider) {
  return (continuationToken: string) => youtube.searchMore(continuationToken);
}

export function createGetAudioInfo(youtube: IYouTubeProvider) {
  return (videoId: string): Promise<ExtendedAudio> => youtube.getInfo(videoId);
}

export function createGetStreamUrl(youtube: IYouTubeProvider) {
  return (videoId: string) => youtube.getStreamUrl(videoId);
}
