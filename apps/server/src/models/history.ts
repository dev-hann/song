import { z } from 'zod';
import type { HistoryItem } from '@song/types';
import { getDb } from '../lib/db.js';

export const HistorySchema = z.object({
  id: z.number(),
  video_id: z.string(),
  title: z.string(),
  channel: z.string(),
  thumbnail: z.string(),
  duration: z.number(),
  played_at: z.string(),
});

export type History = HistoryItem;

export function getRecentHistory(limit = 100): History[] {
  const db = getDb();
  return db
    .prepare(
      `SELECT * FROM play_history ORDER BY played_at DESC LIMIT ?`,
    )
    .all(limit) as History[];
}

export function addToHistory(track: {
  video_id: string;
  title: string;
  channel: string;
  thumbnail: string;
  duration: number;
}): void {
  const db = getDb();

  const existing = db
    .prepare('SELECT id FROM play_history WHERE video_id = ? ORDER BY played_at DESC LIMIT 1')
    .get(track.video_id) as { id: number } | undefined;

  if (existing) {
    db.prepare("UPDATE play_history SET played_at = datetime('now') WHERE id = ?").run(existing.id);
  } else {
    db.prepare(
      `INSERT INTO play_history (video_id, title, channel, thumbnail, duration, played_at)
       VALUES (?, ?, ?, ?, ?, datetime('now'))`,
    ).run(track.video_id, track.title, track.channel, track.thumbnail, track.duration);
  }

  const count = (db.prepare('SELECT COUNT(*) as count FROM play_history').get() as { count: number }).count;
  if (count > 200) {
    db.prepare(
      'DELETE FROM play_history WHERE id NOT IN (SELECT id FROM play_history ORDER BY played_at DESC LIMIT 100)',
    ).run();
  }
}

export function clearHistory(): void {
  const db = getDb();
  db.prepare('DELETE FROM play_history').run();
}
