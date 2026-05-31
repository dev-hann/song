import type { User, Like, Playlist, PlaylistTrack, HistoryItem, FollowedChannel, PlaylistFolder } from '@/types';
import type { users, playlists, playlistTracks, likes, playHistory, followedChannels, playlistFolders } from '@/server/db/schema';
import { LikeSchema } from '@/server/domain/entities/like';
import { HistoryItemSchema } from '@/server/domain/entities/history';
import { PlaylistTrackSchema } from '@/server/domain/entities/playlist';
import { FollowedChannelSchema } from '@/server/domain/entities/channel';
import { UserSchema } from '@/server/domain/entities/user';

type UserRow = typeof users.$inferSelect;
type LikeRow = typeof likes.$inferSelect;
type PlaylistRow = typeof playlists.$inferSelect;
type PlaylistTrackRow = typeof playlistTracks.$inferSelect;
type HistoryRow = typeof playHistory.$inferSelect;
type FollowedChannelRow = typeof followedChannels.$inferSelect;
type PlaylistFolderRow = typeof playlistFolders.$inferSelect;

function s(val: string | null | undefined): string {
  return val ?? '';
}

function n(val: number | null | undefined, fallback = 0): number {
  return val ?? fallback;
}

function b(val: boolean | null | undefined, fallback = false): boolean {
  return val ?? fallback;
}

export function toUserDTO(row: UserRow): User {
  return UserSchema.parse({
    id: row.id,
    email: row.email,
    name: row.name,
    picture: row.picture ?? undefined,
    registeredAt: s(row.registeredAt),
    lastLogin: s(row.lastLogin),
    isActive: row.isActive,
  });
}

export function toLikeDTO(row: LikeRow): Like {
  return LikeSchema.parse({
    videoId: row.videoId,
    title: row.title,
    channel: row.channel,
    thumbnail: s(row.thumbnail),
    duration: n(row.duration),
    likedAt: s(row.likedAt),
  });
}

export function toPlaylistDTO(row: PlaylistRow, tracks?: PlaylistTrack[]): Playlist {
  const result: Playlist = {
    id: row.id,
    name: row.name,
    description: s(row.description),
    coverImage: s(row.coverImage),
    isSystem: row.isSystem,
    trackCount: n(row.trackCount),
    rules: row.rules as Playlist['rules'] ?? null,
    folderId: row.folderId ?? null,
    isPublic: b(row.isPublic),
    shareId: row.shareId ?? null,
    createdAt: s(row.createdAt),
    updatedAt: s(row.updatedAt),
    tracks,
  };
  return result;
}

export function toPlaylistTrackDTO(row: PlaylistTrackRow): PlaylistTrack {
  return PlaylistTrackSchema.parse({
    id: row.id,
    videoId: row.videoId,
    title: row.title,
    channel: row.channel,
    thumbnail: s(row.thumbnail),
    duration: n(row.duration),
    sortOrder: row.sortOrder,
    addedAt: s(row.addedAt),
  });
}

export function toHistoryDTO(row: HistoryRow): HistoryItem {
  return HistoryItemSchema.parse({
    id: row.id,
    videoId: row.videoId,
    title: row.title,
    channel: row.channel,
    thumbnail: s(row.thumbnail),
    duration: n(row.duration),
    playedAt: s(row.playedAt),
  });
}

export function toFollowedChannelDTO(row: FollowedChannelRow): FollowedChannel {
  return FollowedChannelSchema.parse({
    channelId: row.channelId,
    channelName: row.channelName,
    channelThumbnail: s(row.channelThumbnail),
    subscriberCount: s(row.subscriberCount),
    followedAt: s(row.followedAt),
  });
}

export function toPlaylistFolderDTO(row: PlaylistFolderRow): PlaylistFolder {
  return {
    id: row.id,
    name: row.name,
    sortOrder: n(row.sortOrder),
    createdAt: s(row.createdAt),
  };
}
