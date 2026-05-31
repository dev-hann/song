import type { IYouTubeProvider } from '@/server/domain/ports/providers';
import type { ILikeRepository, IHistoryRepository, IChannelRepository } from '@/server/domain/ports/repositories';
import type { SearchResultAudio, PersonalizedRecommendationsResponse } from '@/types';

export function createGetRelatedVideos(youtube: IYouTubeProvider) {
  return (videoId: string, excludeIds: string[] = [], limit = 5) =>
    youtube.getRelated(videoId, excludeIds, limit);
}

export function createGetRecommendationsFromChannels(
  likeRepo: ILikeRepository,
  historyRepo: IHistoryRepository,
  channelRepo: IChannelRepository,
  youtube: IYouTubeProvider,
) {
  return async (userId: string): Promise<SearchResultAudio[]> => {
    const history = await historyRepo.getRecent(userId, 50);
    const likes = await likeRepo.getAll(userId);
    const followed = await channelRepo.getFollowed(userId);

    const channelCount = new Map<string, { name: string; count: number }>();
    for (const item of [...history, ...likes]) {
      const name = item.channel;
      if (!name) {continue;}
      const existing = channelCount.get(name);
      if (existing) {existing.count++;}
      else {channelCount.set(name, { name, count: 1 });}
    }

    const topChannels = [...channelCount.values()]
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);

    const results: SearchResultAudio[] = [];
    const seen = new Set<string>();

    const channelNames = [
      ...topChannels.map((c) => c.name),
      ...followed.map((f) => f.channelName),
    ];

    const searchPromises = channelNames.map(async (channelName) => {
      try {
        const searchResult = await youtube.search(channelName);
        return searchResult.results
          .map((item: unknown) => {
            if (typeof item === 'object' && item != null && 'id' in item) {return item as SearchResultAudio;}
            return null;
          })
          .filter((a): a is SearchResultAudio => a != null && !seen.has(a.id));
      } catch {
        return [];
      }
    });

    const batchResults = await Promise.all(searchPromises);
    for (const batch of batchResults) {
      for (const audio of batch) {
        if (results.length >= 5) {break;}
        if (!seen.has(audio.id)) {
          seen.add(audio.id);
          results.push(audio);
        }
      }
      if (results.length >= 5) {break;}
    }

    return results;
  };
}

export function createGetRecommendationsFromRecent(
  likeRepo: ILikeRepository,
  historyRepo: IHistoryRepository,
  youtube: IYouTubeProvider,
) {
  return async (userId: string): Promise<SearchResultAudio[]> => {
    const history = await historyRepo.getRecent(userId, 3);
    if (history.length === 0) {return [];}

    const allHistory = await historyRepo.getRecent(userId, 100);
    const allLikes = await likeRepo.getAll(userId);
    const excludeIds = new Set([
      ...allHistory.map((h) => h.videoId),
      ...allLikes.map((l) => l.videoId),
    ]);

    const results: SearchResultAudio[] = [];
    const seen = new Set<string>();

    for (const item of history) {
      if (results.length >= 5) {break;}
      try {
        const related = await youtube.getRelated(
          item.videoId,
          [...excludeIds, ...seen],
          5,
        );
        for (const audio of related.results) {
          if (results.length >= 5) {break;}
          if (seen.has(audio.id)) {continue;}
          seen.add(audio.id);
          results.push(audio);
        }
      } catch {}
    }

    return results;
  };
}

export function createGetPersonalizedRecommendations(
  likeRepo: ILikeRepository,
  historyRepo: IHistoryRepository,
  channelRepo: IChannelRepository,
  youtube: IYouTubeProvider,
) {
  return async (userId: string): Promise<PersonalizedRecommendationsResponse> => {
    const getFromChannels = createGetRecommendationsFromChannels(likeRepo, historyRepo, channelRepo, youtube);
    const getFromRecent = createGetRecommendationsFromRecent(likeRepo, historyRepo, youtube);

    const [fromChannels, fromRecent] = await Promise.all([
      getFromChannels(userId).catch(() => []),
      getFromRecent(userId).catch(() => []),
    ]);

    return { fromChannels, fromRecent };
  };
}
