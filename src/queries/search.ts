import { useInfiniteQuery } from '@tanstack/react-query';
import { queryKeys } from './keys';
import { STALE_TIME } from './options';
import { fetchSearchPage } from '@/services/api';
import type { SearchPage } from '@/types';

export function useSearchQuery(query: string) {
  return useInfiniteQuery({
    queryKey: queryKeys.youtube.search.query(query),
    queryFn: ({ pageParam }) => fetchSearchPage(query, pageParam ?? undefined),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage: SearchPage) => lastPage.continuationToken ?? undefined,
    enabled: query.trim().length > 0,
    staleTime: STALE_TIME.SEARCH,
    refetchOnWindowFocus: false,
    retry: 1,
  });
}
