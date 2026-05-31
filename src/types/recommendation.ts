import type { SearchResultAudio } from './search';

export interface RelatedVideosResponse {
  videoId: string;
  results: SearchResultAudio[];
}

export interface PersonalizedRecommendationsResponse {
  fromChannels: SearchResultAudio[];
  fromRecent: SearchResultAudio[];
}
