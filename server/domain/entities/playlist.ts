import { z } from 'zod';

export const PlaylistTrackSchema = z.object({
  id: z.number(),
  videoId: z.string(),
  title: z.string(),
  channel: z.string(),
  thumbnail: z.string(),
  duration: z.number(),
  sortOrder: z.number(),
  addedAt: z.string(),
});

export const SmartPlaylistRuleSchema = z.object({
  field: z.enum(['channel', 'title', 'minDuration', 'maxDuration', 'addedAfter', 'addedBefore']),
  operator: z.enum(['contains', 'equals', 'startsWith', 'gt', 'lt', 'gte', 'lte']),
  value: z.union([z.string(), z.number()]),
});

export const SmartPlaylistRulesSchema = z.object({
  match: z.enum(['all', 'any']),
  conditions: z.array(SmartPlaylistRuleSchema).min(1),
});

export const PlaylistSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  coverImage: z.string(),
  isSystem: z.boolean(),
  trackCount: z.number(),
  rules: SmartPlaylistRulesSchema.nullable(),
  folderId: z.string().nullable(),
  isPublic: z.boolean(),
  shareId: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  tracks: z.array(PlaylistTrackSchema).optional(),
});

export const PlaylistFolderSchema = z.object({
  id: z.string(),
  name: z.string(),
  sortOrder: z.number(),
  createdAt: z.string(),
});
