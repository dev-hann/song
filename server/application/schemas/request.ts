import { z } from 'zod';

export const SearchParamsSchema = z.object({
  q: z.string().min(1, '검색어를 입력해주세요'),
  filter: z.enum(['video', 'channel', 'playlist']).default('video'),
  continuation: z.string().min(1).optional(),
});

export const VideoIdSchema = z.object({
  id: z.string().min(1),
});

export const AddLikeSchema = z.object({
  videoId: z.string().min(1).max(20),
  title: z.string().min(1).max(500),
  channel: z.string().max(200).default(''),
  thumbnail: z.string().max(1000).default(''),
  duration: z.number().int().min(0).default(0),
});

export const AddHistorySchema = z.object({
  videoId: z.string().min(1).max(20),
  title: z.string().min(1).max(500),
  channel: z.string().max(200).default(''),
  thumbnail: z.string().max(1000).default(''),
  duration: z.number().int().min(0).default(0),
});

export const HistoryQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).default(100),
});

export const CreatePlaylistSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).default(''),
});

export const UpdatePlaylistSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  coverImage: z.string().max(2000).optional(),
  rules: z.object({
    match: z.enum(['all', 'any']),
    conditions: z.array(z.object({
      field: z.enum(['channel', 'title', 'minDuration', 'maxDuration', 'addedAfter', 'addedBefore']),
      operator: z.enum(['contains', 'equals', 'startsWith', 'gt', 'lt', 'gte', 'lte']),
      value: z.union([z.string(), z.number()]),
    })).min(1),
  }).nullable().optional(),
  folderId: z.string().nullable().optional(),
  isPublic: z.boolean().optional(),
});

export const AddTrackSchema = z.object({
  videoId: z.string().min(1).max(20),
  title: z.string().min(1).max(500),
  channel: z.string().max(200).default(''),
  thumbnail: z.string().max(1000).default(''),
  duration: z.number().int().min(0).default(0),
});

export const ReorderSchema = z.object({
  trackIds: z.array(z.number().int().positive()).min(1),
});

export const SharePlaylistSchema = z.object({
  isPublic: z.boolean(),
});

export const MoveToFolderSchema = z.object({
  folderId: z.string().nullable(),
});

export const CreateFolderSchema = z.object({
  name: z.string().min(1).max(200),
});

export const UpdateFolderSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  sortOrder: z.number().int().min(0).optional(),
});

export const FollowChannelSchema = z.object({
  channelName: z.string().min(1).max(200),
  channelThumbnail: z.string().url().max(1000).optional().default(''),
  subscriberCount: z.string().max(50).optional(),
});

export const ErrorReportSchema = z.object({
  message: z.string().min(1).max(2000),
  stack: z.string().max(5000).optional(),
  url: z.string().max(500).optional(),
  userAgent: z.string().max(500).optional(),
  context: z.record(z.string(), z.unknown()).optional(),
});

export const PathIdSchema = z.object({
  id: z.string().min(1),
});

export const PathVideoIdSchema = z.object({
  videoId: z.string().min(1),
});

export const PathShareIdSchema = z.object({
  shareId: z.string().min(1),
});
