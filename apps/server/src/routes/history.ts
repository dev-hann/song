import { Router } from 'express';
import { z } from 'zod';
import { authMiddleware } from '../middleware/auth.js';
import {
  getRecentHistory,
  addToHistory,
  clearHistory,
} from '../models/history.js';

const router = Router();
router.use(authMiddleware);

const HistoryQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(500).default(100),
});

const AddHistorySchema = z.object({
  video_id: z.string().min(1).max(20),
  title: z.string().min(1).max(500),
  channel: z.string().max(200).default(''),
  thumbnail: z.string().max(1000).default(''),
  duration: z.number().int().min(0).default(0),
});

router.get('/', (req, res) => {
  const paramsResult = HistoryQuerySchema.safeParse(req.query);
  if (!paramsResult.success) {
    res.status(400).json({ error: paramsResult.error.issues[0].message });
    return;
  }

  try {
    const history = getRecentHistory(req.user!.id, paramsResult.data.limit);
    res.json(history);
  } catch (error) {
    console.error('[History] Error:', error);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

router.post('/', (req, res) => {
  const result = AddHistorySchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: result.error.issues[0].message });
    return;
  }

  try {
    addToHistory(req.user!.id, result.data);
    res.status(201).json({ success: true });
  } catch (error) {
    console.error('[History] Add Error:', error);
    res.status(500).json({ error: 'Failed to add to history' });
  }
});

router.delete('/', (req, res) => {
  try {
    clearHistory(req.user!.id);
    res.json({ success: true });
  } catch (error) {
    console.error('[History] Clear Error:', error);
    res.status(500).json({ error: 'Failed to clear history' });
  }
});

export default router;
