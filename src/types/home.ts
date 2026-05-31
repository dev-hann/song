import type { MelonChartItem } from './melon';
import type { HistoryItem } from './history';
import type { SearchResultAudio } from './search';

export interface HomeRecommendations {
  fromChannels: SearchResultAudio[];
  fromRecent: SearchResultAudio[];
}

export interface HomeResponse {
  chart: MelonChartItem[];
  hot100: MelonChartItem[];
  dailyChart: MelonChartItem[];
  recent: HistoryItem[];
  likesCount: number;
  recommendations?: HomeRecommendations;
}
