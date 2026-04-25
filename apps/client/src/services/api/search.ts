import type { SearchResultAudio } from '@/types';
import { apiFetch } from '@/lib/api-client';

export async function fetchSearch(
  query: string,
): Promise<SearchResultAudio[]> {
  const response = await apiFetch(
    `/api/youtube/search?q=${encodeURIComponent(query)}`,
  );

  if (!response.ok) {
    throw new Error(`Failed to search: ${response.statusText}`);
  }

  const data = await response.json();
  return data.results || [];
}
