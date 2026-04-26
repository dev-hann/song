import type { MelonChartItem } from '@/types';
import { apiFetch } from '@/lib/api-client';

export type MelonChartType = 'realtime' | 'hot100' | 'daily';

export async function fetchMelonChart(type: MelonChartType = 'realtime'): Promise<MelonChartItem[]> {
  const res = await apiFetch(`/api/melon/chart?type=${type}`);
  if (!res.ok) throw new Error('Failed to fetch melon chart');
  return res.json();
}
