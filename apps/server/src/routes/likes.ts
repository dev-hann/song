import { Router } from 'express';
import { z } from 'zod';
import { authMiddleware } from '../middleware/auth.js';
import {
  getAllLikes,
  addLike,
  removeLike,
  isLiked,
} from '../models/like.js';

const router = Router();
router.use(authMiddleware);

const AddLikeSchema = z.object({
  video_id: z.string().min(1).max(20),
  title: z.string().min(1).max(500),
  channel: z.string().max(200).default(''),
  thumbnail: z.string().max(1000).default(''),
  duration: z.number().int().min(0).default(0),
});

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
  const result = AddLikeSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: result.error.issues[0].message });
    return;
  }

  try {
    const like = addLike(req.user!.id, result.data);
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
