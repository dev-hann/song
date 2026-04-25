import { z } from 'zod';
import type { Like as LikeType } from '@song/types';
import { getDb } from '../lib/db.js';

export const LikeSchema = z.object({
  video_id: z.string(),
  title: z.string(),
  channel: z.string(),
  thumbnail: z.string(),
  duration: z.number(),
  liked_at: z.string(),
});

export type Like = LikeType;

export function getAllLikes(): Like[] {
  const db = getDb();
  return db
    .prepare('SELECT * FROM likes ORDER BY liked_at DESC')
    .all() as Like[];
}

export function addLike(track: {
  video_id: string;
  title: string;
  channel: string;
  thumbnail: string;
  duration: number;
}): Like {
  const db = getDb();

  db.prepare(
    `INSERT OR REPLACE INTO likes (video_id, title, channel, thumbnail, duration, liked_at)
     VALUES (?, ?, ?, ?, ?, datetime('now'))`,
  ).run(
    track.video_id,
    track.title,
    track.channel,
    track.thumbnail,
    track.duration,
  );

  return db
    .prepare('SELECT * FROM likes WHERE video_id = ?')
    .get(track.video_id) as Like;
}

export function removeLike(videoId: string): boolean {
  const db = getDb();
  const result = db.prepare('DELETE FROM likes WHERE video_id = ?').run(videoId);
  return result.changes > 0;
}

export function isLiked(videoId: string): boolean {
  const db = getDb();
  const row = db
    .prepare('SELECT video_id FROM likes WHERE video_id = ?')
    .get(videoId);
  return !!row;
}

export function getLikedVideoIds(): string[] {
  const db = getDb();
  return (db.prepare('SELECT video_id FROM likes').all() as { video_id: string }[]).map(
    (r) => r.video_id,
  );
}
