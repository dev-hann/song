import { z } from 'zod';
import type { FollowedChannel as FollowedChannelType } from '@/types';
import { db } from '@/server/db';
import { followedChannels } from '@/server/db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { toFollowedChannelDTO } from './dto';

export const FollowedChannelSchema = z.object({
  channelId: z.string(),
  channelName: z.string(),
  channelThumbnail: z.string(),
  subscriberCount: z.string(),
  followedAt: z.string(),
});

export type FollowedChannel = FollowedChannelType;

export async function getFollowedChannels(userId: string): Promise<FollowedChannelType[]> {
  const rows = await db.select().from(followedChannels)
    .where(eq(followedChannels.userId, userId))
    .orderBy(desc(followedChannels.followedAt));
  return rows.map(toFollowedChannelDTO);
}

export async function followChannel(userId: string, channel: {
  channelId: string;
  channelName: string;
  channelThumbnail: string;
  subscriberCount?: string;
}): Promise<FollowedChannelType> {
  const now = new Date().toISOString().replace('T', ' ').slice(0, 19);

  await db.insert(followedChannels).values({
    userId,
    channelId: channel.channelId,
    channelName: channel.channelName,
    channelThumbnail: channel.channelThumbnail,
    subscriberCount: channel.subscriberCount ?? '',
    followedAt: now,
  }).onConflictDoUpdate({
    target: [followedChannels.userId, followedChannels.channelId],
    set: {
      channelName: channel.channelName,
      channelThumbnail: channel.channelThumbnail,
      subscriberCount: channel.subscriberCount ?? '',
      followedAt: now,
    },
  });

  const rows = await db.select().from(followedChannels)
    .where(and(eq(followedChannels.userId, userId), eq(followedChannels.channelId, channel.channelId)));
  return toFollowedChannelDTO(rows[0]);
}

export async function unfollowChannel(userId: string, channelId: string): Promise<boolean> {
  const result = await db.delete(followedChannels)
    .where(and(eq(followedChannels.userId, userId), eq(followedChannels.channelId, channelId)))
    .returning();
  return result.length > 0;
}

export async function isFollowing(userId: string, channelId: string): Promise<boolean> {
  const rows = await db.select({ channelId: followedChannels.channelId })
    .from(followedChannels)
    .where(and(eq(followedChannels.userId, userId), eq(followedChannels.channelId, channelId)));
  return rows.length > 0;
}
