import { useQuery } from '@tanstack/react-query';
import { queryKeys } from './keys';
import { fetchRelatedTracks, fetchPersonalizedRecommendations } from '@/services/api';

export function useRelatedTracks(videoId: string | null) {
  return useQuery({
    queryKey: queryKeys.recommendations.related(videoId || ''),
    queryFn: () => fetchRelatedTracks(videoId!),
    enabled: !!videoId,
    staleTime: 5 * 60 * 1000,
  });
}

export function usePersonalizedRecommendations() {
  return useQuery({
    queryKey: queryKeys.recommendations.personalized(),
    queryFn: fetchPersonalizedRecommendations,
    staleTime: 10 * 60 * 1000,
  });
}
