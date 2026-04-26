import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { getPersonalizedRecommendations } from '../services/recommendations.js';

const router = Router();

router.get('/', authMiddleware, async (req, res) => {
  try {
    const recommendations = await getPersonalizedRecommendations(req.user!.id);
    res.json(recommendations);
  } catch (error) {
    console.error('[Recommendations] Error:', error);
    res.status(500).json({ error: 'Failed to fetch recommendations' });
  }
});

export default router;
