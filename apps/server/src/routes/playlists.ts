import { Router } from 'express';
import { z } from 'zod';
import { authMiddleware } from '../middleware/auth.js';
import {
  getAllPlaylists,
  getPlaylistById,
  createPlaylist,
  getOrCreateLikedPlaylist,
  updatePlaylist,
  deletePlaylist,
  addTrackToPlaylist,
  removeTrackFromPlaylist,
  reorderPlaylistTracks,
} from '../models/playlist.js';
import { getLikedVideoIds } from '../models/like.js';

const router = Router();
router.use(authMiddleware);

const CreatePlaylistSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).default(''),
});

const UpdatePlaylistSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
});

const AddTrackSchema = z.object({
  video_id: z.string().min(1).max(20),
  title: z.string().min(1).max(500),
  channel: z.string().max(200).default(''),
  thumbnail: z.string().max(1000).default(''),
  duration: z.number().int().min(0).default(0),
});

const ReorderSchema = z.object({
  trackIds: z.array(z.number().int().positive()).min(1),
});

router.get('/', (req, res) => {
  try {
    const playlists = getAllPlaylists(req.user!.id);
    const likedPlaylist = getOrCreateLikedPlaylist(req.user!.id);
    const allPlaylists = [likedPlaylist, ...playlists.filter(p => p.id !== likedPlaylist.id)];
    res.json(allPlaylists);
  } catch (error) {
    console.error('[Playlists] Error:', error);
    res.status(500).json({ error: 'Failed to fetch playlists' });
  }
});

router.post('/', (req, res) => {
  const result = CreatePlaylistSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: result.error.issues[0].message });
    return;
  }

  try {
    const playlist = createPlaylist(req.user!.id, result.data.name, result.data.description);
    res.status(201).json(playlist);
  } catch (error) {
    console.error('[Playlists] Create Error:', error);
    res.status(500).json({ error: 'Failed to create playlist' });
  }
});

router.get('/:id', (req, res) => {
  try {
    const playlist = getPlaylistById(req.user!.id, req.params.id);
    if (!playlist) {
      res.status(404).json({ error: 'Playlist not found' });
      return;
    }

    if (playlist.is_system) {
      const likedIds = getLikedVideoIds(req.user!.id);
      res.json({ ...playlist, track_count: likedIds.length });
      return;
    }

    res.json(playlist);
  } catch (error) {
    console.error('[Playlists] Get Error:', error);
    res.status(500).json({ error: 'Failed to fetch playlist' });
  }
});

router.patch('/:id', (req, res) => {
  const result = UpdatePlaylistSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: result.error.issues[0].message });
    return;
  }

  try {
    const playlist = updatePlaylist(req.user!.id, req.params.id, result.data);
    if (!playlist) {
      res.status(404).json({ error: 'Playlist not found' });
      return;
    }
    res.json(playlist);
  } catch (error) {
    console.error('[Playlists] Update Error:', error);
    res.status(500).json({ error: 'Failed to update playlist' });
  }
});

router.delete('/:id', (req, res) => {
  try {
    const deleted = deletePlaylist(req.user!.id, req.params.id);
    if (!deleted) {
      res.status(404).json({ error: 'Playlist not found or is system playlist' });
      return;
    }
    res.json({ success: true });
  } catch (error) {
    console.error('[Playlists] Delete Error:', error);
    res.status(500).json({ error: 'Failed to delete playlist' });
  }
});

router.post('/:id/tracks', (req, res) => {
  const result = AddTrackSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: result.error.issues[0].message });
    return;
  }

  try {
    const track = addTrackToPlaylist(req.user!.id, req.params.id, result.data);
    if (!track) {
      res.status(409).json({ error: 'Track already in playlist or playlist not found' });
      return;
    }
    res.status(201).json(track);
  } catch (error) {
    console.error('[Playlists] Add Track Error:', error);
    res.status(500).json({ error: 'Failed to add track' });
  }
});

router.delete('/:id/tracks/:videoId', (req, res) => {
  try {
    const removed = removeTrackFromPlaylist(req.user!.id, req.params.id, req.params.videoId);
    if (!removed) {
      res.status(404).json({ error: 'Track not found in playlist' });
      return;
    }
    res.json({ success: true });
  } catch (error) {
    console.error('[Playlists] Remove Track Error:', error);
    res.status(500).json({ error: 'Failed to remove track' });
  }
});

router.put('/:id/reorder', (req, res) => {
  const result = ReorderSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: result.error.issues[0].message });
    return;
  }

  try {
    reorderPlaylistTracks(req.user!.id, req.params.id, result.data.trackIds);
    const playlist = getPlaylistById(req.user!.id, req.params.id);
    res.json(playlist);
  } catch (error) {
    console.error('[Playlists] Reorder Error:', error);
    res.status(500).json({ error: 'Failed to reorder tracks' });
  }
});

export default router;
