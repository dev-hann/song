import type { MelonChartItem } from '@/types';
import { apiFetch } from '@/lib/api-client';

export type MelonChartType = 'realtime' | 'hot100' | 'daily';

export async function fetchMelonChart(type: MelonChartType = 'realtime'): Promise<MelonChartItem[]> {
  return apiFetch<MelonChartItem[]>(`/api/melon/chart?type=${type}`);
}
