import { useQuery } from '@tanstack/react-query';
import { queryKeys } from './keys';
import { STALE_TIME } from './options';
import { fetchRelatedTracks, fetchPersonalizedRecommendations } from '@/services/api';

export function useRelatedTracks(videoId: string | null) {
  return useQuery({
    queryKey: queryKeys.recommendations.related(videoId ?? ''),
    queryFn: () => {
      if (!videoId) { throw new Error('No video ID'); }
      return fetchRelatedTracks(videoId);
    },
    enabled: !!videoId,
    staleTime: STALE_TIME.RELATED,
    refetchOnWindowFocus: false,
    retry: 1,
  });
}

export function usePersonalizedRecommendations() {
  return useQuery({
    queryKey: queryKeys.recommendations.personalized(),
    queryFn: fetchPersonalizedRecommendations,
    staleTime: STALE_TIME.RECOMMENDATIONS,
    refetchOnWindowFocus: false,
    retry: 1,
  });
}
