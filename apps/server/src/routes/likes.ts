import { Router } from 'express';
import { authMiddleware } from '../middleware/auth.js';
import {
  getAllLikes,
  addLike,
  removeLike,
  isLiked,
} from '../models/like.js';

const router = Router();
router.use(authMiddleware);

router.get('/', (req, res) => {
  try {
    const likes = getAllLikes(req.user!.id);
    res.json(likes);
  } catch (error) {
    console.error('[Likes] Error:', error);
    res.status(500).json({ error: 'Failed to fetch likes' });
  }
});

router.post('/', (req, res) => {
  const { video_id, title, channel, thumbnail, duration } = req.body;

  if (!video_id || !title) {
    res.status(400).json({ error: 'video_id and title are required' });
    return;
  }

  try {
    const like = addLike(req.user!.id, {
      video_id,
      title,
      channel: channel || '',
      thumbnail: thumbnail || '',
      duration: duration || 0,
    });
    res.status(201).json(like);
  } catch (error) {
    console.error('[Likes] Add Error:', error);
    res.status(500).json({ error: 'Failed to add like' });
  }
});

router.delete('/:videoId', (req, res) => {
  try {
    const removed = removeLike(req.user!.id, req.params.videoId);
    if (!removed) {
      res.status(404).json({ error: 'Like not found' });
      return;
    }
    res.json({ success: true });
  } catch (error) {
    console.error('[Likes] Remove Error:', error);
    res.status(500).json({ error: 'Failed to remove like' });
  }
});

router.get('/check/:videoId', (req, res) => {
  try {
    const liked = isLiked(req.user!.id, req.params.videoId);
    res.json({ video_id: req.params.videoId, liked });
  } catch (error) {
    console.error('[Likes] Check Error:', error);
    res.status(500).json({ error: 'Failed to check like status' });
  }
});

export default router;
