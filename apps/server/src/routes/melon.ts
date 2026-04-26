import { Router } from 'express';
import { getMelonChart, type MelonChartType } from '../services/melon.js';

const router = Router();

const VALID_TYPES: MelonChartType[] = ['realtime', 'hot100', 'daily'];

router.get('/chart', async (req, res) => {
  try {
    const raw = req.query.type as string | undefined;
    const type: MelonChartType = VALID_TYPES.includes(raw as MelonChartType)
      ? (raw as MelonChartType)
      : 'realtime';
    const chart = await getMelonChart(type);
    res.json(chart);
  } catch (error) {
    console.error('[Melon] Chart Error:', error);
    res.status(500).json({ error: 'Failed to fetch chart' });
  }
});

export default router;
