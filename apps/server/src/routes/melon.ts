import { Router } from 'express';
import { getMelonChart } from '../services/melon.js';

const router = Router();

router.get('/chart', async (_req, res) => {
  try {
    const chart = await getMelonChart();
    res.json(chart);
  } catch (error) {
    console.error('[Melon] Chart Error:', error);
    res.status(500).json({ error: 'Failed to fetch chart' });
  }
});

export default router;
