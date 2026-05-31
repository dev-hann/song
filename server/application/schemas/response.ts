import { z } from 'zod';
import { ExtendedAudioSchema } from '@/server/domain/entities/audio';
import { SearchResponseSchema } from '@/server/domain/entities/search';
import { RelatedVideosResponseSchema } from '@/server/domain/entities/related';
import { MelonChartItemSchema } from '@/server/domain/entities/melon';
import { HistoryItemSchema } from '@/server/domain/entities/history';
import { LikeSchema } from '@/server/domain/entities/like';
import { PlaylistSchema } from '@/server/domain/entities/playlist';
import { ChannelInfoSchema, FollowedChannelSchema } from '@/server/domain/entities/channel';

export const AudioInfoResponseSchema = ExtendedAudioSchema;

export const SearchResponseValidationSchema = SearchResponseSchema;

export const RelatedVideosResponseValidationSchema = RelatedVideosResponseSchema;

export const LikesResponseSchema = z.array(LikeSchema);

export const LikeCheckResponseSchema = z.object({
  videoId: z.string(),
  liked: z.boolean(),
});

export const HistoryResponseSchema = z.array(HistoryItemSchema);

export const MelonChartResponseSchema = z.array(MelonChartItemSchema);

export const PlaylistsResponseSchema = z.array(PlaylistSchema);

export const PlaylistResponseSchema = PlaylistSchema;

export const ChannelsResponseSchema = z.array(FollowedChannelSchema);

export const ChannelResponseSchema = ChannelInfoSchema;

export const HomeResponseSchema = z.object({
  chart: z.array(MelonChartItemSchema),
  hot100: z.array(MelonChartItemSchema),
  dailyChart: z.array(MelonChartItemSchema),
  recent: z.array(HistoryItemSchema),
  likesCount: z.number(),
  recommendations: z.object({
    fromChannels: z.array(z.any()),
    fromRecent: z.array(z.any()),
  }).optional(),
});
