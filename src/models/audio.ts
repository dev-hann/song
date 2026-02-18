import { z } from 'zod';

export const ThumbnailSchema = z.string();

const YouTubeBasicInfoSchema = z.object({
  basic_info: z.object({
    id: z.string(),
    title: z.string(),
    short_description: z.string(),
    duration: z.union([
      z.number(),
      z.object({ seconds: z.number() })
    ]).transform(val => typeof val === 'number' ? val : val.seconds),
    view_count: z.number(),
    upload_date: z.string().optional(),
    channel_id: z.string().optional(),
    thumbnail: z.array(z.object({
      url: z.string()
    })).default([])
  }),
  channel: z.object({
    name: z.string(),
    id: z.string().optional(),
    thumbnails: z.array(z.object({
      url: z.string()
    })).default([])
  }).optional()
});

export const AudioSchema = z.object({
  id: z.string().min(1, 'Audio ID is required'),
  type: z.literal('video'),
  title: z.string(),
  description: z.string(),
  duration: z.number(),
  viewCount: z.number(),
  published: z.string().optional(),
  thumbnail: z.string(),
  channel: z.object({
    id: z.string().optional(),
    name: z.string(),
    thumbnail: z.string().optional()
  })
});

export const ExtendedAudioSchema = AudioSchema.extend({
  uploadDate: z.date().optional()
});

export type Audio = z.infer<typeof AudioSchema>;
export type ExtendedAudio = Omit<z.infer<typeof AudioSchema>, 'isLive'> & { uploadDate?: Date };

export function fromBasicInfo(ytBasicInfo: unknown): ExtendedAudio {
  // Handle case where basic_info might be undefined (YouTube bot detection)
  const rawData = ytBasicInfo as any;
  
  // If basic_info exists, validate it; otherwise use raw data
  const basic_info = rawData.basic_info;
  const channel = rawData.channel;
  
  // Fallback: extract data from raw response if basic_info is missing
  const primaryInfo = rawData.primary_info;
  const id = basic_info?.id || rawData.id || primaryInfo?.id;
  const title = basic_info?.title || rawData.title || (primaryInfo?.title?.runs?.[0]?.text || '');
  const shortDescription = basic_info?.short_description || primaryInfo?.description?.text || '';
  const duration = basic_info?.duration || rawData.duration || parseFloat((primaryInfo?.lengthText?.runs?.[0]?.text || '0').replace(' seconds', '')) || 0;
  const viewCount = basic_info?.view_count || rawData.view_count || 0;
  const uploadDate = basic_info?.upload_date || rawData.upload_date;
  const channelId = basic_info?.channel_id || rawData.channel_id || primaryInfo?.channelId;
  const channelName = channel?.name || rawData.channel?.name || (primaryInfo?.longBylineText?.runs?.[0]?.text || '');
  const channelThumbnail = channel?.thumbnails?.[0]?.url || primaryInfo?.thumbnail?.thumbnails?.[0]?.url;
  const thumbnail = basic_info?.thumbnail?.[0]?.url || rawData.thumbnail || primaryInfo?.thumbnail?.thumbnails?.[0]?.url || '';
  
  if (!id || !title) {
    throw new Error(`Required video info missing: id=${String(id)}, title=${String(title)}. Primary info: ${JSON.stringify(primaryInfo)}`);
  }
  
  return {
    id,
    type: 'video',
    title,
    description: shortDescription,
    duration,
    viewCount,
    published: uploadDate,
    thumbnail,
    channel: {
      id: channelId,
      name: channelName,
      thumbnail: channelThumbnail
    },
    uploadDate: uploadDate ? new Date(uploadDate) : undefined
  };
}
