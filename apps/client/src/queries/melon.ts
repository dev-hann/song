import { useQuery } from '@tanstack/react-query';
import { queryKeys } from './keys';
import { fetchMelonChart, type MelonChartType } from '@/services/api';

export function useMelonChart(type: MelonChartType = 'realtime') {
  return useQuery({
    queryKey: queryKeys.melon.chart(type),
    queryFn: () => fetchMelonChart(type),
    staleTime: 60 * 1000,
  });
}
