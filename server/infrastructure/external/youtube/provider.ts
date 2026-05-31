import type { IYouTubeProvider } from '@/server/domain/ports/providers';
import type { ExtendedAudio, ChannelInfo, SearchResultAudio } from '@/types';
import { getInnertube, getAudioStreamUrl, markMwebFailed } from './client';
import { parseBasicInfo, toSearchResponse, toSearchResultAudio, extractRelatedVideos, parseChannelData } from './parsers';


export const youTubeProvider: IYouTubeProvider = {
  async search(query) {
    const innertube = await getInnertube();
    const search = await innertube.search(query);
    return toSearchResponse(search, query);
  },

  async getInfo(videoId): Promise<ExtendedAudio> {
    const innertube = await getInnertube();
    const info = await innertube.getInfo(videoId);
    return parseBasicInfo(info);
  },

  async getStreamUrl(videoId) {
    return getAudioStreamUrl(videoId);
  },

  async getRelated(videoId, excludeIds, limit) {
    const innertube = await getInnertube();
    const info = await innertube.getInfo(videoId);
    const feed = info.watch_next_feed;
    return extractRelatedVideos(feed as unknown[], videoId, excludeIds, limit);
  },

  async getChannel(channelId): Promise<ChannelInfo> {
    const innertube = await getInnertube();
    const channel = await innertube.getChannel(channelId);
    return parseChannelData(channel, channelId, false);
  },

  markMwebFailed(id: string): void {
    markMwebFailed(id);
  },

  async searchTracks(query, limit): Promise<SearchResultAudio[]> {
    const result = await youTubeProvider.search(query);
    const tracks: SearchResultAudio[] = [];
    for (const item of result.results) {
      if (tracks.length >= limit) {break;}
      const mapped = toSearchResultAudio(item);
      if (mapped) {tracks.push(mapped);}
    }
    return tracks;
  },
};
