import type { SearchResponse, SearchResultAudio } from '@/types';
import { apiFetch } from '@/lib/api-client';

export async function fetchSearch(query: string): Promise<SearchResultAudio[]> {
  const data = await apiFetch<SearchResponse>(`/api/youtube/search?q=${encodeURIComponent(query)}`);
  return data.results;
}
