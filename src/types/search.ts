export interface SearchResultAudio {
  id: string;
  title: string;
  thumbnail: string;
  duration: number;
  channel: {
    name: string;
    thumbnail?: string;
  };
}

export interface SearchPage {
  query: string;
  results: SearchResultAudio[];
  has_continuation: boolean;
  continuationToken?: string;
}

export interface SearchResponse {
  query: string;
  results: SearchResultAudio[];
  has_continuation: boolean;
  continuationToken?: string;
}

export type SearchFilter = 'video';
