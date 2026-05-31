import { useQuery } from '@tanstack/react-query';
import { queryKeys } from './keys';
import { STALE_TIME } from './options';
import { fetchMelonChart, type MelonChartType } from '@/services/api';

export function useMelonChart(type: MelonChartType = 'realtime') {
  return useQuery({
    queryKey: queryKeys.melon.chart(type),
    queryFn: () => fetchMelonChart(type),
    staleTime: STALE_TIME.MELON,
    refetchOnWindowFocus: false,
    retry: 1,
  });
}
