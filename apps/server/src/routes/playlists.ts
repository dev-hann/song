import { Router } from 'express';
import {
  getAllPlaylists,
  getPlaylistById,
  createPlaylist,
  updatePlaylist,
  deletePlaylist,
  addTrackToPlaylist,
  removeTrackFromPlaylist,
  reorderPlaylistTracks,
} from '../models/playlist.js';
import { getLikedVideoIds } from '../models/like.js';

const router = Router();

router.get('/', (_req, res) => {
  try {
    const playlists = getAllPlaylists();
    res.json(playlists);
  } catch (error) {
    console.error('[Playlists] Error:', error);
    res.status(500).json({ error: 'Failed to fetch playlists' });
  }
});

router.post('/', (req, res) => {
  const { name, description } = req.body;
  if (!name || typeof name !== 'string' || !name.trim()) {
    res.status(400).json({ error: 'Name is required' });
    return;
  }

  try {
    const playlist = createPlaylist(name.trim(), (description || '').trim());
    res.status(201).json(playlist);
  } catch (error) {
    console.error('[Playlists] Create Error:', error);
    res.status(500).json({ error: 'Failed to create playlist' });
  }
});

router.get('/:id', (req, res) => {
  try {
    const playlist = getPlaylistById(req.params.id);
    if (!playlist) {
      res.status(404).json({ error: 'Playlist not found' });
      return;
    }

    if (playlist.id === 'liked') {
      const likedIds = getLikedVideoIds();
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
  const { name, description } = req.body;

  try {
    const playlist = updatePlaylist(req.params.id, { name, description });
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
    const deleted = deletePlaylist(req.params.id);
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
  const { video_id, title, channel, thumbnail, duration } = req.body;

  if (!video_id || !title) {
    res.status(400).json({ error: 'video_id and title are required' });
    return;
  }

  try {
    const track = addTrackToPlaylist(req.params.id, {
      video_id,
      title,
      channel: channel || '',
      thumbnail: thumbnail || '',
      duration: duration || 0,
    });
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
    const removed = removeTrackFromPlaylist(req.params.id, req.params.videoId);
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
  const { trackIds } = req.body;
  if (!Array.isArray(trackIds)) {
    res.status(400).json({ error: 'trackIds array is required' });
    return;
  }

  try {
    reorderPlaylistTracks(req.params.id, trackIds);
    const playlist = getPlaylistById(req.params.id);
    res.json(playlist);
  } catch (error) {
    console.error('[Playlists] Reorder Error:', error);
    res.status(500).json({ error: 'Failed to reorder tracks' });
  }
});

export default router;
