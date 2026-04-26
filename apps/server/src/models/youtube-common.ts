import { z } from 'zod';

export const YouTubeVideoItemSchema = z.object({
  type: z.literal('Video').optional(),
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

export function extractVideoFields(data: z.infer<typeof YouTubeVideoItemSchema>) {
  const id = data.video_id || (typeof data.id === 'string' ? data.id : '');
  const title = typeof data.title === 'string' ? data.title : data.title?.text || '';
  const thumbnail = data.thumbnails?.[0]?.url || '';
  const duration = data.duration?.seconds || 0;
  const channelName = data.author?.name || '';
  const channelThumbnail = data.author?.thumbnails?.[0]?.url;

  return { id, title, thumbnail, duration, channelName, channelThumbnail };
}

export function isAudioContent(duration: number): boolean {
  return duration >= 30 && duration <= 900;
}
