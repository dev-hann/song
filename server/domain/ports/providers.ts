import type { SearchResultAudio, ExtendedAudio, ChannelInfo, MelonChartItem } from '@/types';

export interface AudioStreamResult {
  url: string;
  mime_type: string;
}

export interface IYouTubeProvider {
  search(query: string): Promise<{ results: unknown[]; has_continuation: boolean }>;
  getInfo(videoId: string): Promise<ExtendedAudio>;
  getStreamUrl(videoId: string): Promise<AudioStreamResult>;
  getRelated(videoId: string, excludeIds: string[], limit: number): Promise<{ videoId: string; results: SearchResultAudio[] }>;
  getChannel(channelId: string): Promise<ChannelInfo>;
  markMwebFailed(id: string): void;
  searchTracks(query: string, limit: number): Promise<SearchResultAudio[]>;
}

export type MelonChartType = 'realtime' | 'hot100' | 'daily';

export interface IMelonProvider {
  getChart(type: MelonChartType): Promise<MelonChartItem[]>;
}
