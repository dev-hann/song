import { z } from 'zod';
import crypto from 'crypto';
import type { Playlist as PlaylistType, PlaylistTrack as PlaylistTrackType } from '@song/types';
import { getDb } from '../lib/db.js';

export const PlaylistTrackSchema = z.object({
  id: z.number(),
  video_id: z.string(),
  title: z.string(),
  channel: z.string(),
  thumbnail: z.string(),
  duration: z.number(),
  sort_order: z.number(),
  added_at: z.string(),
});

export const PlaylistSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  name: z.string(),
  description: z.string(),
  cover_image: z.string(),
  is_system: z.number(),
  track_count: z.number(),
  created_at: z.string(),
  updated_at: z.string(),
  tracks: z.array(PlaylistTrackSchema).optional(),
});

export type Playlist = PlaylistType;
export type PlaylistTrack = PlaylistTrackType;

export function getAllPlaylists(userId: string): Playlist[] {
  const db = getDb();
  return db
    .prepare(
      `SELECT p.*, COUNT(pt.id) as track_count
       FROM playlists p
       LEFT JOIN playlist_tracks pt ON p.id = pt.playlist_id
       WHERE p.user_id = ?
       GROUP BY p.id
       ORDER BY p.is_system DESC, p.updated_at DESC`,
    )
    .all(userId) as Playlist[];
}

export function getPlaylistById(userId: string, id: string): Playlist | null {
  const db = getDb();
  const playlist = db
    .prepare('SELECT * FROM playlists WHERE id = ? AND user_id = ?')
    .get(id, userId) as Playlist | undefined;
  if (!playlist) return null;

  const tracks = db
    .prepare(
      'SELECT * FROM playlist_tracks WHERE playlist_id = ? ORDER BY sort_order ASC, added_at ASC',
    )
    .all(id) as PlaylistTrack[];

  return { ...playlist, tracks, track_count: tracks.length };
}

export function createPlaylist(userId: string, name: string, description = ''): Playlist {
  const db = getDb();
  const id = `pl_${crypto.randomUUID()}`;
  db.prepare(
    'INSERT INTO playlists (id, user_id, name, description) VALUES (?, ?, ?, ?)',
  ).run(id, userId, name, description);
  return getPlaylistById(userId, id)!;
}

export function getOrCreateLikedPlaylist(userId: string): Playlist {
  const db = getDb();
  let playlist = db
    .prepare("SELECT * FROM playlists WHERE user_id = ? AND is_system = 1 AND name = '좋아요한 곡'")
    .get(userId) as Playlist | undefined;

  if (!playlist) {
    const id = `liked_${userId}`;
    db.prepare(
      "INSERT INTO playlists (id, user_id, name, description, is_system) VALUES (?, ?, '좋아요한 곡', '', 1)",
    ).run(id, userId);
    playlist = getPlaylistById(userId, id)!;
  }

  return playlist;
}

export function updatePlaylist(
  userId: string,
  id: string,
  data: { name?: string; description?: string },
): Playlist | null {
  const db = getDb();
  const existing = db
    .prepare('SELECT * FROM playlists WHERE id = ? AND user_id = ?')
    .get(id, userId);
  if (!existing) return null;

  if (data.name) {
    db.prepare(
      "UPDATE playlists SET name = ?, updated_at = datetime('now') WHERE id = ?",
    ).run(data.name, id);
  }
  if (data.description !== undefined) {
    db.prepare(
      "UPDATE playlists SET description = ?, updated_at = datetime('now') WHERE id = ?",
    ).run(data.description, id);
  }

  return getPlaylistById(userId, id);
}

export function deletePlaylist(userId: string, id: string): boolean {
  const db = getDb();
  const playlist = db
    .prepare('SELECT * FROM playlists WHERE id = ? AND user_id = ?')
    .get(id, userId) as Playlist | undefined;
  if (!playlist || playlist.is_system) return false;

  db.prepare('DELETE FROM playlist_tracks WHERE playlist_id = ?').run(id);
  db.prepare('DELETE FROM playlists WHERE id = ?').run(id);
  return true;
}

export function addTrackToPlaylist(
  userId: string,
  playlistId: string,
  track: {
    video_id: string;
    title: string;
    channel: string;
    thumbnail: string;
    duration: number;
  },
): PlaylistTrack | null {
  const db = getDb();
  const playlist = db
    .prepare('SELECT * FROM playlists WHERE id = ? AND user_id = ?')
    .get(playlistId, userId);
  if (!playlist) return null;

  const existing = db
    .prepare(
      'SELECT id FROM playlist_tracks WHERE playlist_id = ? AND video_id = ?',
    )
    .get(playlistId, track.video_id);
  if (existing) return null;

  const maxOrder = db
    .prepare(
      'SELECT MAX(sort_order) as max_order FROM playlist_tracks WHERE playlist_id = ?',
    )
    .get(playlistId) as { max_order: number | null };

  const sortOrder = (maxOrder?.max_order ?? -1) + 1;

  const result = db
    .prepare(
      `INSERT INTO playlist_tracks (playlist_id, video_id, title, channel, thumbnail, duration, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      playlistId,
      track.video_id,
      track.title,
      track.channel,
      track.thumbnail,
      track.duration,
      sortOrder,
    );

  db.prepare(
    "UPDATE playlists SET updated_at = datetime('now') WHERE id = ?",
  ).run(playlistId);

  return db
    .prepare('SELECT * FROM playlist_tracks WHERE id = ?')
    .get(result.lastInsertRowid) as PlaylistTrack;
}

export function removeTrackFromPlaylist(
  userId: string,
  playlistId: string,
  videoId: string,
): boolean {
  const db = getDb();
  const playlist = db
    .prepare('SELECT * FROM playlists WHERE id = ? AND user_id = ?')
    .get(playlistId, userId);
  if (!playlist) return false;

  const result = db
    .prepare(
      'DELETE FROM playlist_tracks WHERE playlist_id = ? AND video_id = ?',
    )
    .run(playlistId, videoId);

  db.prepare(
    "UPDATE playlists SET updated_at = datetime('now') WHERE id = ?",
  ).run(playlistId);

  return result.changes > 0;
}

export function reorderPlaylistTracks(
  userId: string,
  playlistId: string,
  trackIds: number[],
): boolean {
  const db = getDb();
  const playlist = db
    .prepare('SELECT * FROM playlists WHERE id = ? AND user_id = ?')
    .get(playlistId, userId);
  if (!playlist) return false;

  const update = db.prepare(
    'UPDATE playlist_tracks SET sort_order = ? WHERE id = ? AND playlist_id = ?',
  );

  db.transaction(() => {
    for (let i = 0; i < trackIds.length; i++) {
      update.run(i, trackIds[i], playlistId);
    }
  })();

  db.prepare(
    "UPDATE playlists SET updated_at = datetime('now') WHERE id = ?",
  ).run(playlistId);

  return true;
}
