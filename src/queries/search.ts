import { useQuery } from '@tanstack/react-query';
import { queryKeys } from './keys';
import { STALE_TIME } from './options';
import { fetchSearch } from '@/services/api';

export function useSearchQuery(query: string) {
  return useQuery({
    queryKey: queryKeys.youtube.search.query(query),
    queryFn: () => fetchSearch(query),
    enabled: query.trim().length > 0,
    staleTime: STALE_TIME.SEARCH,
    refetchOnWindowFocus: false,
    retry: 1,
  });
}
