import { z } from 'zod';
import { ThumbnailSchema } from './audio';

export const SearchResultAudioSchema = z.object({
  id: z.string(),
  title: z.string(),
  thumbnail: ThumbnailSchema,
  duration: z.number(),
  channel: z.object({
    name: z.string(),
    thumbnail: ThumbnailSchema.optional(),
  }),
});

export const SearchResponseSchema = z.object({
  query: z.string(),
  results: z.array(SearchResultAudioSchema),
  has_continuation: z.boolean().default(false),
});
