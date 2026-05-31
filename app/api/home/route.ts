import { NextResponse } from 'next/server';
import { requireAuth, handleErrors } from '@/server/lib/route-helpers';
import { getMelonChart } from '@/server/services/melon';
import { getRecentHistory } from '@/server/models/history';
import { getAllLikes } from '@/server/models/like';
import { getPersonalizedRecommendations } from '@/server/services/recommendations';

export const GET = handleErrors(async () => {
  const { session, error } = await requireAuth();
  if (error) {return error;}

  const userId = session.user.id;
  const [chart, hot100, dailyChart, recentHistory, likes, recommendations] = await Promise.all([
    getMelonChart('realtime').catch(() => []),
    getMelonChart('hot100').catch(() => []),
    getMelonChart('daily').catch(() => []),
    getRecentHistory(userId, 6),
    getAllLikes(userId),
    getPersonalizedRecommendations(userId).catch(() => ({
      fromChannels: [],
      fromRecent: [],
    })),
  ]);

  return NextResponse.json({
    chart: chart.slice(0, 5),
    hot100: hot100.slice(0, 5),
    dailyChart: dailyChart.slice(0, 5),
    recent: recentHistory,
    likesCount: likes.length,
    recommendations: recommendations.fromChannels.length > 0 || recommendations.fromRecent.length > 0
      ? recommendations
      : undefined,
  });
});
