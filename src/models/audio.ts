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
  const validated = YouTubeBasicInfoSchema.parse(ytBasicInfo);
  const { basic_info, channel } = validated;
  
  const thumbnail = basic_info.thumbnail[0]?.url || '';
  const channelThumbnail = channel?.thumbnails[0]?.url;
  const uploadDate = basic_info.upload_date ? new Date(basic_info.upload_date) : undefined;
  
  return {
    id: basic_info.id,
    type: 'video',
    title: basic_info.title,
    description: basic_info.short_description,
    duration: basic_info.duration,
    viewCount: basic_info.view_count,
    published: basic_info.upload_date,
    thumbnail,
    channel: {
      id: basic_info.channel_id,
      name: channel?.name || '',
      thumbnail: channelThumbnail
    },
    uploadDate
  };
}
