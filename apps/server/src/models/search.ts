import { z } from 'zod';
import type { SearchResultAudio as SearchResultAudioType, SearchResponse as SearchResponseType } from '@song/types';
import { ThumbnailSchema } from './audio.js';

const YouTubeSearchResultSchema = z.object({
  type: z.literal('Video'),
  id: z.union([z.string(), z.object({ video_id: z.string() })]),
  video_id: z.string().optional(),
  title: z.union([z.string(), z.object({ text: z.string() })]),
  thumbnails: z
    .array(
      z.object({
        url: z.string(),
      }),
    )
    .optional(),
  duration: z
    .object({
      seconds: z.number().optional(),
    })
    .optional(),
  author: z
    .object({
      name: z.string(),
      thumbnails: z
        .array(
          z.object({
            url: z.string(),
          }),
        )
        .optional(),
    })
    .optional(),
});

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

export function toSearchResultAudio(item: unknown): SearchResultAudio | null {
  const result = YouTubeSearchResultSchema.safeParse(item);
  if (!result.success) return null;

  const data = result.data;
  const id = data.video_id || (typeof data.id === 'string' ? data.id : '');
  const title = typeof data.title === 'string' ? data.title : data.title.text;
  const thumbnail = data.thumbnails?.[0]?.url || '';
  const duration = data.duration?.seconds || 0;
  const channelName = data.author?.name || '';
  const channelThumbnail = data.author?.thumbnails?.[0]?.url;

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
