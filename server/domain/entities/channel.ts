import { z } from 'zod';

export const FollowedChannelSchema = z.object({
  channelId: z.string(),
  channelName: z.string(),
  channelThumbnail: z.string(),
  subscriberCount: z.string(),
  followedAt: z.string(),
});

export const ChannelVideoSchema = z.object({
  id: z.string(),
  title: z.string(),
  thumbnail: z.string(),
  duration: z.number(),
  channel: z.object({
    name: z.string(),
    thumbnail: z.string().optional(),
  }),
});

export const ChannelInfoSchema = z.object({
  id: z.string(),
  name: z.string(),
  thumbnail: z.string(),
  subscriberCount: z.string(),
  following: z.boolean(),
  videos: z.array(ChannelVideoSchema),
});
