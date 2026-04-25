import { useQuery } from '@tanstack/react-query';
import { queryKeys } from './keys';
import { fetchHomeData } from '@/services/api';

export function useHomeData() {
  return useQuery({
    queryKey: queryKeys.home.all(),
    queryFn: fetchHomeData,
    staleTime: 60 * 1000,
  });
}
