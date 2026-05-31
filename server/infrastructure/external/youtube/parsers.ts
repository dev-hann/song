import type { SearchResultAudio, ExtendedAudio, ChannelInfo } from '@/types';
import { YouTubeVideoItemSchema, extractVideoFields, YouTubeBasicInfoSchema } from './schemas';
import { isAudioContent } from '@/server/domain/rules/audio-filter';
import { ExtendedAudioSchema } from '@/server/domain/entities/audio';
import { SearchResultAudioSchema } from '@/server/domain/entities/search';
import { ChannelInfoSchema } from '@/server/domain/entities/channel';

export function parseBasicInfo(ytBasicInfo: unknown): ExtendedAudio {
  const validated = YouTubeBasicInfoSchema.parse(ytBasicInfo);
  const { basic_info, channel } = validated;

  const thumbnail = basic_info.thumbnail[0]?.url ?? '';
  const channelThumbnail = channel?.thumbnails[0]?.url;
  const uploadDate = basic_info.upload_date
    ? new Date(basic_info.upload_date)
    : undefined;

  return ExtendedAudioSchema.parse({
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
      name: channel?.name ?? '',
      thumbnail: channelThumbnail,
    },
    uploadDate,
  });
}

export function toSearchResultAudio(item: unknown): SearchResultAudio | null {
  const result = YouTubeVideoItemSchema.safeParse(item);
  if (!result.success) {return null;}

  const { id, title, thumbnail, duration, channelName, channelThumbnail } = extractVideoFields(result.data);

  if (!isAudioContent(duration)) {return null;}

  return SearchResultAudioSchema.parse({
    id,
    title,
    thumbnail,
    duration,
    channel: { name: channelName, thumbnail: channelThumbnail },
  });
}

export function toSearchResponse(
  ytSearch: unknown,
  query: string,
): { query: string; results: SearchResultAudio[]; has_continuation: boolean } {
  if (!ytSearch || typeof ytSearch !== 'object') {
    return { query, results: [], has_continuation: false };
  }

  const obj = ytSearch as Record<string, unknown>;
  const results = Array.isArray(obj.results) ? obj.results : [];
  const mappedResults = results
    .map(toSearchResultAudio)
    .filter((item): item is NonNullable<typeof item> => item != null);

  return {
    query,
    results: mappedResults,
    has_continuation: false,
  };
}

function parseDuration(text: string): number {
  const parts = text.split(':').map(Number);
  if (parts.length === 3) {return parts[0] * 3600 + parts[1] * 60 + parts[2];}
  if (parts.length === 2) {return parts[0] * 60 + parts[1];}
  return 0;
}

function extractFromLockupView(item: Record<string, unknown>): SearchResultAudio | null {
  const contentId = item.content_id as string | undefined;
  if (!contentId) {return null;}

  const lockupMetadata = item.metadata as Record<string, unknown> | undefined;
  const contentMetadata = lockupMetadata?.metadata as Record<string, unknown> | undefined;
  const contentImage = item.content_image as Record<string, unknown> | undefined;

  const titleObj = lockupMetadata?.title as Record<string, unknown> | undefined;
  const title = (titleObj?.text as string) || '';

  const metadataRows = contentMetadata?.metadata_rows as Record<string, unknown>[] | undefined;
  const firstRow = metadataRows?.[0];
  const metadataParts = firstRow?.metadata_parts as Record<string, unknown>[] | undefined;
  const channelPart = metadataParts?.[0];
  const channelTextObj = channelPart?.text as Record<string, unknown> | undefined;
  const channelName = (channelTextObj?.text as string) || '';

  const images = contentImage?.image as Record<string, unknown>[] | undefined;
  const thumbnail = (images?.[0]?.url as string) || '';

  const overlays = contentImage?.overlays as Record<string, unknown>[] | undefined;
  const firstOverlay = overlays?.[0];
  const badges = firstOverlay?.badges as Record<string, unknown>[] | undefined;
  const durationText = (badges?.[0]?.text as string) || '';
  const duration = parseDuration(durationText);

  if (!title) {return null;}
  if (duration > 0 && !isAudioContent(duration)) {return null;}

  return {
    id: contentId,
    title,
    thumbnail,
    duration,
    channel: { name: channelName },
  };
}

function extractFromLegacyVideo(item: Record<string, unknown>): SearchResultAudio | null {
  const result = YouTubeVideoItemSchema.safeParse(item);
  if (!result.success) {return null;}

  const { id, title, thumbnail, duration, channelName } = extractVideoFields(result.data);

  if (!id || !title) {return null;}
  if (!isAudioContent(duration)) {return null;}

  return {
    id,
    title,
    thumbnail,
    duration,
    channel: { name: channelName },
  };
}

export function toRelatedAudio(item: unknown): SearchResultAudio | null {
  if (!item || typeof item !== 'object') {return null;}
  const record = item as Record<string, unknown>;

  if (record.type === 'LockupView') {
    return extractFromLockupView(record);
  }

  return extractFromLegacyVideo(record);
}

export function extractRelatedVideos(
  watchNextFeed: unknown[],
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
    if (results.length >= limit) {break;}

    const audio = toRelatedAudio(item);
    if (!audio) {continue;}
    if (seen.has(audio.id)) {continue;}

    seen.add(audio.id);
    results.push(audio);
  }

  return { videoId, results };
}

export function parseChannelData(
  rawChannel: unknown,
  channelId: string,
  following: boolean,
): ChannelInfo {
  const channel = rawChannel as Record<string, unknown>;
  const videos: Array<{
    id: string;
    title: string;
    thumbnail: string;
    duration: number;
    channel: { name: string; thumbnail?: string };
  }> = [];

  const channelVideos = (channel).videos as Array<Record<string, unknown>> | undefined;
  if (channelVideos) {
    for (const video of channelVideos) {
      const rawId = video.id as string | { videoId: string } | undefined;
      const videoId = (typeof rawId === 'string' ? rawId : rawId?.videoId) ?? '';
      const rawTitle = video.title as string | { text: string } | undefined;
      const title = typeof rawTitle === 'string' ? rawTitle : rawTitle?.text ?? '';
      const rawThumbs = video.thumbnails as Array<{ url: string }> | undefined;
      const thumbnail = rawThumbs?.[0]?.url ?? '';
      const rawDuration = video.duration as { seconds: number } | undefined;
      const duration = rawDuration?.seconds ?? 0;

      if (videoId) {
        videos.push({
          id: videoId,
          title,
          thumbnail,
          duration,
          channel: {
            name: (video.author as { name: string } | undefined)?.name ?? '',
            thumbnail: (video.author as { thumbnails: Array<{ url: string }> } | undefined)?.thumbnails[0]?.url,
          },
        });
      }
    }
  }

  const meta = ((channel).metadata ?? {}) as Record<string, unknown>;

  return ChannelInfoSchema.parse({
    id: channelId,
    name: meta.title as string,
    thumbnail: (meta.avatar as Array<{ url: string }> | undefined)?.[0]?.url ?? '',
    subscriberCount: (meta.subscriberCount as string | undefined) ?? '',
    following,
    videos,
  });
}
