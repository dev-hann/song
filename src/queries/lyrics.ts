import { useQuery } from '@tanstack/react-query';
import { queryKeys } from './keys';
import { STALE_TIME } from './options';
import { fetchLyrics } from '@/services/api';

export function useLyricsQuery(videoId: string | null) {
  return useQuery({
    queryKey: queryKeys.youtube.audio.lyrics(videoId ?? ''),
    queryFn: () => {
      if (!videoId) { throw new Error('No video ID'); }
      return fetchLyrics(videoId);
    },
    enabled: !!videoId,
    staleTime: STALE_TIME.LYRICS,
    refetchOnWindowFocus: false,
    retry: 1,
  });
}
