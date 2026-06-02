import { z } from 'zod';

export const LyricsLineSchema = z.object({
  startTimeMs: z.number(),
  endTimeMs: z.number(),
  text: z.string(),
});

export const LyricsSchema = z.object({
  videoId: z.string(),
  language: z.string(),
  lines: z.array(LyricsLineSchema),
});
