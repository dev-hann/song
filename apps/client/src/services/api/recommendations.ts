import type { RelatedVideosResponse, PersonalizedRecommendationsResponse } from '@/types';
import { apiFetch } from '@/lib/api-client';

export async function fetchRelatedTracks(videoId: string): Promise<RelatedVideosResponse> {
  const res = await apiFetch(`/api/youtube/audio/related?id=${encodeURIComponent(videoId)}`);
  if (!res.ok) throw new Error('Failed to fetch related tracks');
  return res.json();
}

export async function fetchPersonalizedRecommendations(): Promise<PersonalizedRecommendationsResponse> {
  const res = await apiFetch('/api/recommendations');
  if (!res.ok) throw new Error('Failed to fetch recommendations');
  return res.json();
}
