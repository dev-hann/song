import type { IChannelRepository } from '@/server/domain/ports/repositories';
import type { FollowedChannel } from '@/types';
import { db } from '@/server/db';
import { followedChannels } from '@/server/db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { toFollowedChannelDTO } from '../mappers/dto';

export const channelRepository: IChannelRepository = {
  async getFollowed(userId): Promise<FollowedChannel[]> {
    const rows = await db.select().from(followedChannels)
      .where(eq(followedChannels.userId, userId))
      .orderBy(desc(followedChannels.followedAt));
    return rows.map(toFollowedChannelDTO);
  },

  async follow(userId, channel): Promise<FollowedChannel> {
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
  },

  async unfollow(userId, channelId): Promise<boolean> {
    const result = await db.delete(followedChannels)
      .where(and(eq(followedChannels.userId, userId), eq(followedChannels.channelId, channelId)))
      .returning();
    return result.length > 0;
  },

  async isFollowing(userId, channelId): Promise<boolean> {
    const rows = await db.select({ channelId: followedChannels.channelId })
      .from(followedChannels)
      .where(and(eq(followedChannels.userId, userId), eq(followedChannels.channelId, channelId)));
    return rows.length > 0;
  },
};
