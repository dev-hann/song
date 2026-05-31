import { z } from 'zod';
import { SearchResultAudioSchema } from './search';

export const RelatedVideosResponseSchema = z.object({
  videoId: z.string(),
  results: z.array(SearchResultAudioSchema),
});
