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

export interface SearchResponse {
  query: string;
  results: SearchResultAudio[];
  has_continuation: boolean;
}

export type SearchFilter = 'video';
