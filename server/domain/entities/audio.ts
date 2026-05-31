import { z } from 'zod';

export const ThumbnailSchema = z.string();

export const AudioSchema = z.object({
  id: z.string().min(1),
  type: z.literal('video'),
  title: z.string(),
  description: z.string(),
  duration: z.number(),
  viewCount: z.number(),
  published: z.string().optional(),
  thumbnail: z.string(),
  channel: z.object({
    id: z.string().optional(),
    name: z.string(),
    thumbnail: z.string().optional(),
  }),
});

export const ExtendedAudioSchema = AudioSchema.extend({
  uploadDate: z.date().optional(),
});
