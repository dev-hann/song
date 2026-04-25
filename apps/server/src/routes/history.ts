import { Router } from 'express';
import {
  getRecentHistory,
  addToHistory,
  clearHistory,
} from '../models/history.js';

const router = Router();

router.get('/', (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 100;
    const history = getRecentHistory(limit);
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
    addToHistory({
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

router.delete('/', (_req, res) => {
  try {
    clearHistory();
    res.json({ success: true });
  } catch (error) {
    console.error('[History] Clear Error:', error);
    res.status(500).json({ error: 'Failed to clear history' });
  }
});

export default router;
