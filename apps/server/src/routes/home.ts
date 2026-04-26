import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { getMelonChart } from '../services/melon.js';
import { getRecentHistory } from '../models/history.js';
import { getAllLikes } from '../models/like.js';
import { getPersonalizedRecommendations } from '../services/recommendations.js';

const router = Router();

router.get('/', authMiddleware, async (req, res) => {
  try {
    const userId = req.user!.id;
    const [chart, hot100, dailyChart, recentHistory, likes, recommendations] = await Promise.all([
      getMelonChart('realtime').catch(() => []),
      getMelonChart('hot100').catch(() => []),
      getMelonChart('daily').catch(() => []),
      Promise.resolve(getRecentHistory(userId, 6)),
      Promise.resolve(getAllLikes(userId)),
      getPersonalizedRecommendations(userId).catch(() => ({
        fromChannels: [],
        fromRecent: [],
      })),
    ]);

    res.json({
      chart: chart.slice(0, 5),
      hot100: hot100.slice(0, 5),
      dailyChart: dailyChart.slice(0, 5),
      recent: recentHistory,
      likesCount: likes.length,
      recommendations: recommendations.fromChannels.length > 0 || recommendations.fromRecent.length > 0
        ? recommendations
        : undefined,
    });
  } catch (error) {
    console.error('[Home] Error:', error);
    res.status(500).json({ error: 'Failed to fetch home data' });
  }
});

export default router;
