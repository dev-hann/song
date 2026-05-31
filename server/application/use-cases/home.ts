import type { IMelonProvider, IYouTubeProvider } from '@/server/domain/ports/providers';
import type { ILikeRepository, IHistoryRepository, IChannelRepository } from '@/server/domain/ports/repositories';
import type { HomeResponse } from '@/types';
import { createGetPersonalizedRecommendations } from './recommendations';

export function createGetHomeData(
  melon: IMelonProvider,
  historyRepo: IHistoryRepository,
  likeRepo: ILikeRepository,
  channelRepo: IChannelRepository,
  youtube: IYouTubeProvider,
) {
  return async (userId: string): Promise<HomeResponse> => {
    const getRecommendations = createGetPersonalizedRecommendations(likeRepo, historyRepo, channelRepo, youtube, melon);

    const [chart, hot100, dailyChart, recentHistory, likes, recommendations] = await Promise.all([
      melon.getChart('realtime').catch(() => []),
      melon.getChart('hot100').catch(() => []),
      melon.getChart('daily').catch(() => []),
      historyRepo.getRecent(userId, 6),
      likeRepo.getAll(userId),
      getRecommendations(userId).catch(() => ({
        fromChannels: [],
        fromRecent: [],
        fromChart: [],
      })),
    ]);

    const hasPersonalized = recommendations.fromChannels.length > 0 || recommendations.fromRecent.length > 0;

    return {
      chart: chart.slice(0, 5),
      hot100: hot100.slice(0, 5),
      dailyChart: dailyChart.slice(0, 5),
      recent: recentHistory,
      likesCount: likes.length,
      recommendations: hasPersonalized || recommendations.fromChart.length > 0
        ? recommendations
        : undefined,
    };
  };
}
