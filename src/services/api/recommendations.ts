import type { RelatedVideosResponse, PersonalizedRecommendationsResponse } from '@/types';
import { apiFetch } from '@/lib/api-client';

export async function fetchRelatedTracks(videoId: string): Promise<RelatedVideosResponse> {
  return apiFetch<RelatedVideosResponse>(`/api/youtube/audio/related?id=${encodeURIComponent(videoId)}`);
}

export async function fetchPersonalizedRecommendations(): Promise<PersonalizedRecommendationsResponse> {
  return apiFetch<PersonalizedRecommendationsResponse>('/api/recommendations');
}
