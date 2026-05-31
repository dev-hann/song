import type { User, Like, Playlist, PlaylistTrack, HistoryItem, FollowedChannel, PlaylistFolder } from '@/types';
import type { users, playlists, playlistTracks, likes, playHistory, followedChannels, playlistFolders } from '@/server/db/schema';

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

export function toUserDTO(row: UserRow): User {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    picture: row.picture || undefined,
    registeredAt: s(row.registeredAt),
    lastLogin: s(row.lastLogin),
    isActive: row.isActive,
  };
}

export function toLikeDTO(row: LikeRow): Like {
  return {
    videoId: row.videoId,
    title: row.title,
    channel: row.channel,
    thumbnail: s(row.thumbnail),
    duration: row.duration ?? 0,
    likedAt: s(row.likedAt),
  };
}

export function toPlaylistDTO(row: PlaylistRow, tracks?: PlaylistTrack[]): Playlist {
  return {
    id: row.id,
    name: row.name,
    description: s(row.description),
    coverImage: s(row.coverImage),
    isSystem: row.isSystem,
    trackCount: row.trackCount ?? 0,
    rules: row.rules as Playlist['rules'] ?? null,
    folderId: row.folderId ?? null,
    isPublic: row.isPublic ?? false,
    shareId: row.shareId ?? null,
    createdAt: s(row.createdAt),
    updatedAt: s(row.updatedAt),
    tracks,
  };
}

export function toPlaylistTrackDTO(row: PlaylistTrackRow): PlaylistTrack {
  return {
    id: row.id,
    videoId: row.videoId,
    title: row.title,
    channel: row.channel,
    thumbnail: s(row.thumbnail),
    duration: row.duration ?? 0,
    sortOrder: row.sortOrder,
    addedAt: s(row.addedAt),
  };
}

export function toHistoryDTO(row: HistoryRow): HistoryItem {
  return {
    id: row.id,
    videoId: row.videoId,
    title: row.title,
    channel: row.channel,
    thumbnail: s(row.thumbnail),
    duration: row.duration ?? 0,
    playedAt: s(row.playedAt),
  };
}

export function toFollowedChannelDTO(row: FollowedChannelRow): FollowedChannel {
  return {
    channelId: row.channelId,
    channelName: row.channelName,
    channelThumbnail: s(row.channelThumbnail),
    subscriberCount: s(row.subscriberCount),
    followedAt: s(row.followedAt),
  };
}

export function toPlaylistFolderDTO(row: PlaylistFolderRow): PlaylistFolder {
  return {
    id: row.id,
    name: row.name,
    sortOrder: row.sortOrder ?? 0,
    createdAt: s(row.createdAt),
  };
}
