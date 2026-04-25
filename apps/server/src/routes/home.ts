import { Router } from 'express';
import { getMelonChart } from '../services/melon.js';
import { getRecentHistory } from '../models/history.js';
import { getAllLikes } from '../models/like.js';

const router = Router();

router.get('/', async (_req, res) => {
  try {
    const [chart, recentHistory, likes] = await Promise.all([
      getMelonChart().catch(() => []),
      Promise.resolve(getRecentHistory(6)),
      Promise.resolve(getAllLikes()),
    ]);

    res.json({
      chart: chart.slice(0, 20),
      recent: recentHistory,
      likesCount: likes.length,
    });
  } catch (error) {
    console.error('[Home] Error:', error);
    res.status(500).json({ error: 'Failed to fetch home data' });
  }
});

export default router;
