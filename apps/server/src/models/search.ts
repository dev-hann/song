import { z } from 'zod';
import type { SearchResultAudio as SearchResultAudioType, SearchResponse as SearchResponseType } from '@song/types';
import { ThumbnailSchema } from './audio.js';
import { YouTubeVideoItemSchema, extractVideoFields, isAudioContent } from './youtube-common.js';

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

export type SearchResultAudio = SearchResultAudioType;
export type SearchResponse = SearchResponseType;

export { isAudioContent };

export function toSearchResultAudio(item: unknown): SearchResultAudio | null {
  const result = YouTubeVideoItemSchema.safeParse(item);
  if (!result.success) return null;

  const { id, title, thumbnail, duration, channelName, channelThumbnail } = extractVideoFields(result.data);

  if (!isAudioContent(duration)) return null;

  return {
    id,
    title,
    thumbnail,
    duration,
    channel: {
      name: channelName,
      thumbnail: channelThumbnail,
    },
  };
}

export function toSearchResponse(
  ytSearch: unknown,
  query: string,
): SearchResponse {
  if (!ytSearch || typeof ytSearch !== 'object') {
    return { query, results: [], has_continuation: false };
  }

  const obj = ytSearch as Record<string, unknown>;
  const results = Array.isArray(obj.results) ? obj.results : [];
  const mappedResults = results
    .map(toSearchResultAudio)
    .filter((item): item is NonNullable<typeof item> => item !== null);

  return {
    query,
    results: mappedResults,
    has_continuation: false,
  };
}
