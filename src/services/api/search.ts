import type { SearchPage, SearchResultAudio } from '@/types';
import { apiFetch } from '@/lib/api-client';

export async function fetchSearchPage(query: string, continuationToken?: string): Promise<SearchPage> {
  let url = `/api/youtube/search?q=${encodeURIComponent(query)}`;
  if (continuationToken) {
    url += `&continuation=${encodeURIComponent(continuationToken)}`;
  }
  return apiFetch<SearchPage>(url);
}

export async function fetchSearch(query: string): Promise<SearchResultAudio[]> {
  const page = await fetchSearchPage(query);
  return page.results;
}
