import { z } from 'zod';
import { isAudioContent } from './search.js';
import type { SearchResultAudio } from '@song/types';

const RelatedVideoSchema = z.object({
  id: z.union([z.string(), z.object({ video_id: z.string() })]),
  video_id: z.string().optional(),
  title: z.union([z.string(), z.object({ text: z.string() })]),
  thumbnails: z
    .array(z.object({ url: z.string() }))
    .optional(),
  duration: z
    .object({ seconds: z.number().optional() })
    .optional(),
  author: z
    .object({
      name: z.string(),
      thumbnails: z.array(z.object({ url: z.string() })).optional(),
    })
    .optional(),
});

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
  const result = RelatedVideoSchema.safeParse(item);
  if (!result.success) return null;

  const data = result.data;
  const id = data.video_id || (typeof data.id === 'string' ? data.id : '');
  const title = typeof data.title === 'string' ? data.title : data.title.text;
  const thumbnail = data.thumbnails?.[0]?.url || '';
  const duration = data.duration?.seconds || 0;
  const channelName = data.author?.name || '';
  const channelThumbnail = data.author?.thumbnails?.[0]?.url;

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
