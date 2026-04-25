import { z } from 'zod';
import type { FollowedChannel as FollowedChannelType } from '@song/types';
import { getDb } from '../lib/db.js';

export const FollowedChannelSchema = z.object({
  channel_id: z.string(),
  channel_name: z.string(),
  channel_thumbnail: z.string(),
  subscriber_count: z.string(),
  followed_at: z.string(),
});

export type FollowedChannel = FollowedChannelType;

export function getFollowedChannels(): FollowedChannel[] {
  const db = getDb();
  return db
    .prepare('SELECT * FROM followed_channels ORDER BY followed_at DESC')
    .all() as FollowedChannel[];
}

export function followChannel(channel: {
  channel_id: string;
  channel_name: string;
  channel_thumbnail: string;
  subscriber_count?: string;
}): FollowedChannel {
  const db = getDb();
  db.prepare(
    `INSERT OR REPLACE INTO followed_channels (channel_id, channel_name, channel_thumbnail, subscriber_count, followed_at)
     VALUES (?, ?, ?, ?, datetime('now'))`,
  ).run(
    channel.channel_id,
    channel.channel_name,
    channel.channel_thumbnail,
    channel.subscriber_count || '',
  );

  return db
    .prepare('SELECT * FROM followed_channels WHERE channel_id = ?')
    .get(channel.channel_id) as FollowedChannel;
}

export function unfollowChannel(channelId: string): boolean {
  const db = getDb();
  const result = db
    .prepare('DELETE FROM followed_channels WHERE channel_id = ?')
    .run(channelId);
  return result.changes > 0;
}

export function isFollowing(channelId: string): boolean {
  const db = getDb();
  const row = db
    .prepare('SELECT channel_id FROM followed_channels WHERE channel_id = ?')
    .get(channelId);
  return !!row;
}
