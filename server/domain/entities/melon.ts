import { z } from 'zod';

export const MelonChartItemSchema = z.object({
  rank: z.number(),
  title: z.string(),
  artist: z.string(),
  album: z.string(),
  albumArt: z.string(),
});
