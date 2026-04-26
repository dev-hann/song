import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import {
  getRecentHistory,
  addToHistory,
  clearHistory,
} from '../models/history.js';

const router = Router();
router.use(authMiddleware);

router.get('/', (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 100;
    const history = getRecentHistory(req.user!.id, limit);
    res.json(history);
  } catch (error) {
    console.error('[History] Error:', error);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

router.post('/', (req, res) => {
  const { video_id, title, channel, thumbnail, duration } = req.body;

  if (!video_id || !title) {
    res.status(400).json({ error: 'video_id and title are required' });
    return;
  }

  try {
    addToHistory(req.user!.id, {
      video_id,
      title,
      channel: channel || '',
      thumbnail: thumbnail || '',
      duration: duration || 0,
    });
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
