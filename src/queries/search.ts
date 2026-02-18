import { useQuery } from '@tanstack/react-query';
import type { SearchResultAudio } from '@/types';
import { queryKeys } from './keys';
import { queryOptions } from './options';
import { fetchSearch } from '@/services/api';

export function useSearchQuery(query: string) {
  return useQuery({
    queryKey: queryKeys.search.query(query),
    queryFn: () => fetchSearch(query),
    enabled: query.trim().length > 0,
    ...queryOptions.search,
  }) as ReturnType<typeof useQuery<SearchResultAudio[]>>;
}
