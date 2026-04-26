import { Router } from 'express';
import { getInnertube } from '../services/youtube.js';
import { authMiddleware } from '../middleware/auth.js';
import {
  getFollowedChannels,
  followChannel,
  unfollowChannel,
  isFollowing,
} from '../models/channel.js';

const router = Router();

router.get('/followed', authMiddleware, (req, res) => {
  try {
    const channels = getFollowedChannels(req.user!.id);
    res.json(channels);
  } catch (error) {
    console.error('[Channels] Followed Error:', error);
    res.status(500).json({ error: 'Failed to fetch followed channels' });
  }
});

router.get('/:id', async (req, res) => {
  const channelId = req.params.id;

  try {
    const innertube = await getInnertube();
    const channel = await innertube.getChannel(channelId);

    const videos: Array<{
      id: string;
      title: string;
      thumbnail: string;
      duration: number;
      channel: { name: string; thumbnail?: string };
    }> = [];

    const channelVideos = (channel as any).videos;
    if (channelVideos) {
      for (const video of channelVideos) {
        const v = video as any;
        const videoId = v.id || v.video_id || '';
        const title =
          typeof v.title === 'string' ? v.title : v.title?.text || '';
        const thumbnail = v.thumbnails?.[0]?.url || '';
        const duration = v.duration?.seconds || 0;

        if (videoId) {
          videos.push({
            id: videoId,
            title,
            thumbnail,
            duration,
            channel: {
              name: v.author?.name || '',
              thumbnail: v.author?.thumbnails?.[0]?.url,
            },
          });
        }
      }
    }

    const meta = (channel as any).metadata || {};
    const following = req.user ? isFollowing(req.user.id, channelId) : false;

    res.json({
      id: channelId,
      name: meta.title || '',
      thumbnail: meta.avatar?.[0]?.url || '',
      subscriber_count: meta.subscriber_count || '',
      following,
      videos,
    });
  } catch (error) {
    console.error('[Channels] Get Error:', error);
    res.status(500).json({ error: 'Failed to fetch channel' });
  }
});

router.post('/:id/follow', authMiddleware, (req, res) => {
  const { channel_name, channel_thumbnail, subscriber_count } = req.body;

  if (!channel_name) {
    res.status(400).json({ error: 'channel_name is required' });
    return;
  }

  try {
    const channel = followChannel(req.user!.id, {
      channel_id: req.params.id as string,
      channel_name,
      channel_thumbnail: channel_thumbnail || '',
      subscriber_count,
    });
    res.status(201).json(channel);
  } catch (error) {
    console.error('[Channels] Follow Error:', error);
    res.status(500).json({ error: 'Failed to follow channel' });
  }
});

router.delete('/:id/follow', authMiddleware, (req, res) => {
  try {
    const removed = unfollowChannel(req.user!.id, req.params.id as string);
    if (!removed) {
      res.status(404).json({ error: 'Not following this channel' });
      return;
    }
    res.json({ success: true });
  } catch (error) {
    console.error('[Channels] Unfollow Error:', error);
    res.status(500).json({ error: 'Failed to unfollow channel' });
  }
});

export default router;
