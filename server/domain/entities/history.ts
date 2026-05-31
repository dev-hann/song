import { z } from 'zod';

export const HistoryItemSchema = z.object({
  id: z.number(),
  videoId: z.string(),
  title: z.string(),
  channel: z.string(),
  thumbnail: z.string(),
  duration: z.number(),
  playedAt: z.string(),
});
