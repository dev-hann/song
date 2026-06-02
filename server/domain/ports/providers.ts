import type { SearchResultAudio, ExtendedAudio, ChannelInfo, MelonChartItem, Lyrics } from '@/types';

export interface AudioStreamResult {
  url: string;
  mime_type: string;
}

export interface SearchPage {
  results: unknown[];
  has_continuation: boolean;
  continuationToken?: string;
}

export interface IYouTubeProvider {
  search(query: string): Promise<SearchPage>;
  searchMore(continuationToken: string): Promise<SearchPage>;
  getInfo(videoId: string): Promise<ExtendedAudio>;
  getStreamUrl(videoId: string): Promise<AudioStreamResult>;
  getRelated(videoId: string, excludeIds: string[], limit: number): Promise<{ videoId: string; results: SearchResultAudio[] }>;
  getChannel(channelId: string): Promise<ChannelInfo>;
  getLyrics(videoId: string): Promise<Lyrics | null>;
  markMwebFailed(id: string): void;
  searchTracks(query: string, limit: number): Promise<SearchResultAudio[]>;
}

export type MelonChartType = 'realtime' | 'hot100' | 'daily';

export interface IMelonProvider {
  getChart(type: MelonChartType): Promise<MelonChartItem[]>;
}
