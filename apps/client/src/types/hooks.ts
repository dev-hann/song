import type { SearchResultAudio } from '@song/types';
import { SearchStatus } from '@song/types';

export interface UseSearchReturn {
  query: string;
  results: SearchResultAudio[];
  status: SearchStatus;
  recentSearches: string[];
  
  setQuery: (query: string) => void;
  search: () => Promise<void>;
  clearResults: () => void;
  clearRecentSearches: () => void;
  removeRecentSearch: (search: string) => void;
}
