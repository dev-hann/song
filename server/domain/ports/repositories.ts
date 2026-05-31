import type { Like, HistoryItem, Playlist, PlaylistTrack, FollowedChannel, PlaylistFolder, User, SmartPlaylistRules } from '@/types';

export interface ILikeRepository {
  getAll(userId: string): Promise<Like[]>;
  add(userId: string, track: { videoId: string; title: string; channel: string; thumbnail: string; duration: number }): Promise<Like>;
  remove(userId: string, videoId: string): Promise<boolean>;
  isLiked(userId: string, videoId: string): Promise<boolean>;
  getLikedVideoIds(userId: string): Promise<string[]>;
}

export interface IHistoryRepository {
  getRecent(userId: string, limit?: number): Promise<HistoryItem[]>;
  add(userId: string, track: { videoId: string; title: string; channel: string; thumbnail: string; duration: number }): Promise<void>;
  clear(userId: string): Promise<void>;
}

export interface IPlaylistRepository {
  getAll(userId: string): Promise<Playlist[]>;
  getById(userId: string, id: string): Promise<Playlist | null>;
  getOrCreateLiked(userId: string): Promise<Playlist>;
  create(userId: string, name: string, description?: string): Promise<Playlist>;
  update(userId: string, id: string, data: { name?: string; description?: string; coverImage?: string; rules?: SmartPlaylistRules | null; folderId?: string | null; isPublic?: boolean }): Promise<Playlist | null>;
  delete(userId: string, id: string): Promise<boolean>;
  addTrack(userId: string, playlistId: string, track: { videoId: string; title: string; channel: string; thumbnail: string; duration: number }): Promise<PlaylistTrack | null>;
  removeTrack(userId: string, playlistId: string, videoId: string): Promise<boolean>;
  reorderTracks(userId: string, playlistId: string, trackIds: number[]): Promise<boolean>;
  duplicate(userId: string, sourceId: string): Promise<Playlist | null>;
  getShared(shareId: string): Promise<Playlist | null>;
  getSmartPlaylistTracks(userId: string, rules: SmartPlaylistRules): Promise<PlaylistTrack[]>;
}

export interface IFolderRepository {
  getAll(userId: string): Promise<PlaylistFolder[]>;
  create(userId: string, name: string): Promise<PlaylistFolder>;
  update(userId: string, id: string, data: { name?: string; sortOrder?: number }): Promise<PlaylistFolder | null>;
  delete(userId: string, id: string): Promise<boolean>;
  movePlaylist(userId: string, playlistId: string, folderId: string | null): Promise<boolean>;
}

export interface IChannelRepository {
  getFollowed(userId: string): Promise<FollowedChannel[]>;
  follow(userId: string, channel: { channelId: string; channelName: string; channelThumbnail: string; subscriberCount?: string }): Promise<FollowedChannel>;
  unfollow(userId: string, channelId: string): Promise<boolean>;
  isFollowing(userId: string, channelId: string): Promise<boolean>;
}

export interface IUserRepository {
  findByEmail(email: string): Promise<User | undefined>;
  findById(id: string): Promise<User | undefined>;
  create(data: { email: string; name: string; picture?: string }): Promise<User>;
  updateLastLogin(id: string): Promise<void>;
  markOnboardingCompleted(id: string): Promise<void>;
}
