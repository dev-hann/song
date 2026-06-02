import type { IYouTubeProvider, SearchPage } from '@/server/domain/ports/providers';
import type { ExtendedAudio, ChannelInfo, SearchResultAudio, Lyrics } from '@/types';
import { getInnertube, getAudioStreamUrl, markMwebFailed } from './client';
import { parseBasicInfo, toSearchResponse, extractRelatedVideos, parseChannelData, parseTranscriptSegments } from './parsers';
import { storeSearch, retrieveSearch, replaceSearch } from './search-cache';
import { LyricsSchema } from '@/server/domain/entities/lyrics';

export const youTubeProvider: IYouTubeProvider = {
  async search(query): Promise<SearchPage> {
    const innertube = await getInnertube();
    const search = await innertube.search(query);
    const hasContinuation = search.has_continuation;
    const response = toSearchResponse(search, query, hasContinuation);

    if (hasContinuation) {
      const token = storeSearch(query, search);
      return { ...response, continuationToken: token };
    }

    return response;
  },

  async searchMore(continuationToken: string): Promise<SearchPage> {
    const cached = retrieveSearch(continuationToken);
    if (!cached) {
      return { results: [], has_continuation: false };
    }

    const nextSearch = await cached.getContinuation();
    const hasContinuation = nextSearch.has_continuation;
    const response = toSearchResponse(nextSearch, '', hasContinuation);

    if (hasContinuation) {
      const newToken = replaceSearch(continuationToken, nextSearch);
      return { ...response, continuationToken: newToken };
    }

    return response;
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
    return result.results
      .filter((item): item is SearchResultAudio =>
        typeof item === 'object' && item != null && 'id' in item && 'title' in item,
      )
      .slice(0, limit);
  },

  async getLyrics(videoId): Promise<Lyrics | null> {
    const innertube = await getInnertube();
    const info = await innertube.getInfo(videoId);

    if (!info.captions) {
      return null;
    }

    const transcriptInfo = await info.getTranscript();
    const transcript = transcriptInfo.transcript;
    const content = transcript.content;

    if (!content?.body?.initial_segments) {
      return null;
    }

    const lines = parseTranscriptSegments(
      content.body.initial_segments,
    );

    if (lines.length === 0) {
      return null;
    }

    const language = transcriptInfo.selectedLanguage || 'unknown';

    return LyricsSchema.parse({
      videoId,
      language,
      lines,
    });
  },
};
