import { z } from 'zod';
import type { Like as LikeType } from '@song/types';
import { getDb } from '../lib/db.js';

export const LikeSchema = z.object({
  user_id: z.string(),
  video_id: z.string(),
  title: z.string(),
  channel: z.string(),
  thumbnail: z.string(),
  duration: z.number(),
  liked_at: z.string(),
});

export type Like = LikeType;

export function getAllLikes(userId: string): Like[] {
  const db = getDb();
  return db
    .prepare('SELECT * FROM likes WHERE user_id = ? ORDER BY liked_at DESC')
    .all(userId) as Like[];
}

export function addLike(userId: string, track: {
  video_id: string;
  title: string;
  channel: string;
  thumbnail: string;
  duration: number;
}): Like {
  const db = getDb();

  db.prepare(
    `INSERT OR REPLACE INTO likes (user_id, video_id, title, channel, thumbnail, duration, liked_at)
     VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`,
  ).run(
    userId,
    track.video_id,
    track.title,
    track.channel,
    track.thumbnail,
    track.duration,
  );

  return db
    .prepare('SELECT * FROM likes WHERE user_id = ? AND video_id = ?')
    .get(userId, track.video_id) as Like;
}

export function removeLike(userId: string, videoId: string): boolean {
  const db = getDb();
  const result = db.prepare('DELETE FROM likes WHERE user_id = ? AND video_id = ?').run(userId, videoId);
  return result.changes > 0;
}

export function isLiked(userId: string, videoId: string): boolean {
  const db = getDb();
  const row = db
    .prepare('SELECT video_id FROM likes WHERE user_id = ? AND video_id = ?')
    .get(userId, videoId);
  return !!row;
}

export function getLikedVideoIds(userId: string): string[] {
  const db = getDb();
  return (db.prepare('SELECT video_id FROM likes WHERE user_id = ?').all(userId) as { video_id: string }[]).map(
    (r) => r.video_id,
  );
}
