import type { MelonChartItem } from './melon';
import type { HistoryItem } from './history';

export interface HomeResponse {
  chart: MelonChartItem[];
  recent: HistoryItem[];
  likesCount: number;
}
