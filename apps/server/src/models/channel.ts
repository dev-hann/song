import { z } from 'zod';
import type { FollowedChannel as FollowedChannelType } from '@song/types';
import { getDb } from '../lib/db.js';

export const FollowedChannelSchema = z.object({
  user_id: z.string(),
  channel_id: z.string(),
  channel_name: z.string(),
  channel_thumbnail: z.string(),
  subscriber_count: z.string(),
  followed_at: z.string(),
});

export type FollowedChannel = FollowedChannelType;

export function getFollowedChannels(userId: string): FollowedChannel[] {
  const db = getDb();
  return db
    .prepare('SELECT * FROM followed_channels WHERE user_id = ? ORDER BY followed_at DESC')
    .all(userId) as FollowedChannel[];
}

export function followChannel(userId: string, channel: {
  channel_id: string;
  channel_name: string;
  channel_thumbnail: string;
  subscriber_count?: string;
}): FollowedChannel {
  const db = getDb();
  db.prepare(
    `INSERT OR REPLACE INTO followed_channels (user_id, channel_id, channel_name, channel_thumbnail, subscriber_count, followed_at)
     VALUES (?, ?, ?, ?, ?, datetime('now'))`,
  ).run(
    userId,
    channel.channel_id,
    channel.channel_name,
    channel.channel_thumbnail,
    channel.subscriber_count || '',
  );

  return db
    .prepare('SELECT * FROM followed_channels WHERE user_id = ? AND channel_id = ?')
    .get(userId, channel.channel_id) as FollowedChannel;
}

export function unfollowChannel(userId: string, channelId: string): boolean {
  const db = getDb();
  const result = db
    .prepare('DELETE FROM followed_channels WHERE user_id = ? AND channel_id = ?')
    .run(userId, channelId);
  return result.changes > 0;
}

export function isFollowing(userId: string, channelId: string): boolean {
  const db = getDb();
  const row = db
    .prepare('SELECT channel_id FROM followed_channels WHERE user_id = ? AND channel_id = ?')
    .get(userId, channelId);
  return !!row;
}
