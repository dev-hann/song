import { z } from 'zod';
import { isAudioContent } from './youtube-common.js';
import { YouTubeVideoItemSchema, extractVideoFields } from './youtube-common.js';
import type { SearchResultAudio } from '@song/types';

export const RelatedVideosResponseSchema = z.object({
  videoId: z.string(),
  results: z.array(z.object({
    id: z.string(),
    title: z.string(),
    thumbnail: z.string(),
    duration: z.number(),
    channel: z.object({
      name: z.string(),
      thumbnail: z.string().optional(),
    }),
  })),
});

export function toRelatedAudio(item: unknown): SearchResultAudio | null {
  const result = YouTubeVideoItemSchema.safeParse(item);
  if (!result.success) return null;

  const { id, title, thumbnail, duration, channelName, channelThumbnail } = extractVideoFields(result.data);

  if (!id || !title) return null;
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

export function extractRelatedVideos(
  watchNextFeed: unknown,
  videoId: string,
  excludeIds: string[] = [],
  limit = 5,
) {
  if (!Array.isArray(watchNextFeed)) {
    return { videoId, results: [] };
  }

  const seen = new Set<string>(excludeIds);
  const results: SearchResultAudio[] = [];

  for (const item of watchNextFeed) {
    if (results.length >= limit) break;

    const audio = toRelatedAudio(item);
    if (!audio) continue;
    if (seen.has(audio.id)) continue;

    seen.add(audio.id);
    results.push(audio);
  }

  return { videoId, results };
}
