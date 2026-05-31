import { z } from 'zod';

export const LikeSchema = z.object({
  videoId: z.string(),
  title: z.string(),
  channel: z.string(),
  thumbnail: z.string(),
  duration: z.number(),
  likedAt: z.string(),
});

export const LikeCheckResponseSchema = z.object({
  videoId: z.string(),
  liked: z.boolean(),
});
