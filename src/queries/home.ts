import { useQuery } from '@tanstack/react-query';
import { queryKeys } from './keys';
import { STALE_TIME } from './options';
import { fetchHomeData } from '@/services/api';

export function useHomeData() {
  return useQuery({
    queryKey: queryKeys.home.all(),
    queryFn: fetchHomeData,
    staleTime: STALE_TIME.HOME,
    refetchOnWindowFocus: false,
    retry: 1,
  });
}
