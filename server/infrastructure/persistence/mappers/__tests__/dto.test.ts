// @vitest-environment node
import { describe, it, expect } from 'vitest';
import {
  toUserDTO,
  toLikeDTO,
  toPlaylistDTO,
  toPlaylistTrackDTO,
  toHistoryDTO,
  toFollowedChannelDTO,
  toPlaylistFolderDTO,
} from '../dto';
import type {
  users,
  likes,
  playlists,
  playlistTracks,
  playHistory,
  followedChannels,
  playlistFolders,
} from '@/server/db/schema';

type UserRow = typeof users.$inferSelect;
type LikeRow = typeof likes.$inferSelect;
type PlaylistRow = typeof playlists.$inferSelect;
type PlaylistTrackRow = typeof playlistTracks.$inferSelect;
type HistoryRow = typeof playHistory.$inferSelect;
type FollowedChannelRow = typeof followedChannels.$inferSelect;
type PlaylistFolderRow = typeof playlistFolders.$inferSelect;

const userRow: UserRow = {
  id: 'user-1',
  email: 'test@example.com',
  name: 'Test User',
  picture: 'https://img.example.com/pic.jpg',
  registeredAt: '2025-01-01T00:00:00Z',
  lastLogin: '2025-06-01T12:00:00Z',
  isActive: true,
};

const likeRow: LikeRow = {
  userId: 'user-1',
  videoId: 'vid-1',
  title: 'Test Video',
  channel: 'Test Channel',
  thumbnail: 'https://img.example.com/thumb.jpg',
  duration: 240,
  likedAt: '2025-05-01T10:00:00Z',
};

const playlistRow: PlaylistRow = {
  id: 'pl-1',
  userId: 'user-1',
  name: 'My Playlist',
  description: 'A playlist',
  coverImage: 'https://img.example.com/cover.jpg',
  isSystem: false,
  trackCount: 5,
  rules: null,
  folderId: null,
  isPublic: false,
  shareId: null,
  createdAt: '2025-01-15T00:00:00Z',
  updatedAt: '2025-05-20T00:00:00Z',
};

const playlistTrackRow: PlaylistTrackRow = {
  id: 1,
  playlistId: 'pl-1',
  videoId: 'vid-1',
  title: 'Track One',
  channel: 'Channel A',
  thumbnail: 'https://img.example.com/t.jpg',
  duration: 180,
  sortOrder: 0,
  addedAt: '2025-03-01T00:00:00Z',
};

const historyRow: HistoryRow = {
  id: 1,
  userId: 'user-1',
  videoId: 'vid-2',
  title: 'History Video',
  channel: 'Channel B',
  thumbnail: 'https://img.example.com/h.jpg',
  duration: 300,
  playedAt: '2025-06-01T08:00:00Z',
};

const followedChannelRow: FollowedChannelRow = {
  userId: 'user-1',
  channelId: 'ch-1',
  channelName: 'My Channel',
  channelThumbnail: 'https://img.example.com/ch.jpg',
  subscriberCount: '12345',
  followedAt: '2025-02-01T00:00:00Z',
};

const playlistFolderRow: PlaylistFolderRow = {
  id: 'folder-1',
  userId: 'user-1',
  name: 'Folder A',
  sortOrder: 1,
  createdAt: '2025-01-10T00:00:00Z',
};

describe('toUserDTO', () => {
  it('maps a full row', () => {
    const result = toUserDTO(userRow);
    expect(result).toEqual({
      id: 'user-1',
      email: 'test@example.com',
      name: 'Test User',
      picture: 'https://img.example.com/pic.jpg',
      registeredAt: '2025-01-01T00:00:00Z',
      lastLogin: '2025-06-01T12:00:00Z',
      isActive: true,
    });
  });

  it('converts null picture to default empty string via schema', () => {
    const row: UserRow = { ...userRow, picture: null };
    const result = toUserDTO(row);
    expect(result.picture).toBe('');
  });

  it('converts null registeredAt and lastLogin to empty string', () => {
    const row = { ...userRow, registeredAt: null as unknown as string, lastLogin: null as unknown as string };
    const result = toUserDTO(row);
    expect(result.registeredAt).toBe('');
    expect(result.lastLogin).toBe('');
  });

  it('throws on missing required field', () => {
    const { id, ...noId } = userRow;
    expect(() => toUserDTO(noId as UserRow)).toThrow();
  });
});

describe('toLikeDTO', () => {
  it('maps a full row', () => {
    const result = toLikeDTO(likeRow);
    expect(result).toEqual({
      videoId: 'vid-1',
      title: 'Test Video',
      channel: 'Test Channel',
      thumbnail: 'https://img.example.com/thumb.jpg',
      duration: 240,
      likedAt: '2025-05-01T10:00:00Z',
    });
  });

  it('converts null thumbnail to empty string', () => {
    const row: LikeRow = { ...likeRow, thumbnail: null };
    const result = toLikeDTO(row);
    expect(result.thumbnail).toBe('');
  });

  it('converts null duration to 0', () => {
    const row = { ...likeRow, duration: null as unknown as number };
    const result = toLikeDTO(row);
    expect(result.duration).toBe(0);
  });

  it('converts null likedAt to empty string', () => {
    const row = { ...likeRow, likedAt: null as unknown as string };
    const result = toLikeDTO(row);
    expect(result.likedAt).toBe('');
  });

  it('throws on missing required field', () => {
    const { videoId, ...noVideoId } = likeRow;
    expect(() => toLikeDTO(noVideoId as LikeRow)).toThrow();
  });
});

describe('toPlaylistDTO', () => {
  it('maps a full row without tracks', () => {
    const result = toPlaylistDTO(playlistRow);
    expect(result).toEqual({
      id: 'pl-1',
      name: 'My Playlist',
      description: 'A playlist',
      coverImage: 'https://img.example.com/cover.jpg',
      isSystem: false,
      trackCount: 5,
      rules: null,
      folderId: null,
      isPublic: false,
      shareId: null,
      createdAt: '2025-01-15T00:00:00Z',
      updatedAt: '2025-05-20T00:00:00Z',
      tracks: undefined,
    });
  });

  it('maps with tracks array', () => {
    const track = toPlaylistTrackDTO(playlistTrackRow);
    const result = toPlaylistDTO(playlistRow, [track]);
    expect(result.tracks).toEqual([track]);
  });

  it('converts null description to empty string', () => {
    const row: PlaylistRow = { ...playlistRow, description: null };
    const result = toPlaylistDTO(row);
    expect(result.description).toBe('');
  });

  it('converts null coverImage to empty string', () => {
    const row: PlaylistRow = { ...playlistRow, coverImage: null };
    const result = toPlaylistDTO(row);
    expect(result.coverImage).toBe('');
  });

  it('converts null trackCount to 0', () => {
    const row = { ...playlistRow, trackCount: null as unknown as number };
    const result = toPlaylistDTO(row);
    expect(result.trackCount).toBe(0);
  });

  it('converts null timestamps to empty string', () => {
    const row = { ...playlistRow, createdAt: null as unknown as string, updatedAt: null as unknown as string };
    const result = toPlaylistDTO(row);
    expect(result.createdAt).toBe('');
    expect(result.updatedAt).toBe('');
  });
});

describe('toPlaylistTrackDTO', () => {
  it('maps a full row', () => {
    const result = toPlaylistTrackDTO(playlistTrackRow);
    expect(result).toEqual({
      id: 1,
      videoId: 'vid-1',
      title: 'Track One',
      channel: 'Channel A',
      thumbnail: 'https://img.example.com/t.jpg',
      duration: 180,
      sortOrder: 0,
      addedAt: '2025-03-01T00:00:00Z',
    });
  });

  it('converts null thumbnail to empty string', () => {
    const row: PlaylistTrackRow = { ...playlistTrackRow, thumbnail: null };
    const result = toPlaylistTrackDTO(row);
    expect(result.thumbnail).toBe('');
  });

  it('converts null duration to 0', () => {
    const row = { ...playlistTrackRow, duration: null as unknown as number };
    const result = toPlaylistTrackDTO(row);
    expect(result.duration).toBe(0);
  });

  it('converts null addedAt to empty string', () => {
    const row = { ...playlistTrackRow, addedAt: null as unknown as string };
    const result = toPlaylistTrackDTO(row);
    expect(result.addedAt).toBe('');
  });

  it('throws on missing required field', () => {
    const { title, ...noTitle } = playlistTrackRow;
    expect(() => toPlaylistTrackDTO(noTitle as PlaylistTrackRow)).toThrow();
  });
});

describe('toHistoryDTO', () => {
  it('maps a full row', () => {
    const result = toHistoryDTO(historyRow);
    expect(result).toEqual({
      id: 1,
      videoId: 'vid-2',
      title: 'History Video',
      channel: 'Channel B',
      thumbnail: 'https://img.example.com/h.jpg',
      duration: 300,
      playedAt: '2025-06-01T08:00:00Z',
    });
  });

  it('converts null thumbnail to empty string', () => {
    const row: HistoryRow = { ...historyRow, thumbnail: null };
    const result = toHistoryDTO(row);
    expect(result.thumbnail).toBe('');
  });

  it('converts null duration to 0', () => {
    const row = { ...historyRow, duration: null as unknown as number };
    const result = toHistoryDTO(row);
    expect(result.duration).toBe(0);
  });

  it('converts null playedAt to empty string', () => {
    const row = { ...historyRow, playedAt: null as unknown as string };
    const result = toHistoryDTO(row);
    expect(result.playedAt).toBe('');
  });

  it('throws on missing required field', () => {
    const { videoId, ...noVideoId } = historyRow;
    expect(() => toHistoryDTO(noVideoId as HistoryRow)).toThrow();
  });
});

describe('toFollowedChannelDTO', () => {
  it('maps a full row', () => {
    const result = toFollowedChannelDTO(followedChannelRow);
    expect(result).toEqual({
      channelId: 'ch-1',
      channelName: 'My Channel',
      channelThumbnail: 'https://img.example.com/ch.jpg',
      subscriberCount: '12345',
      followedAt: '2025-02-01T00:00:00Z',
    });
  });

  it('converts null channelThumbnail to empty string', () => {
    const row: FollowedChannelRow = { ...followedChannelRow, channelThumbnail: null };
    const result = toFollowedChannelDTO(row);
    expect(result.channelThumbnail).toBe('');
  });

  it('converts null subscriberCount to empty string', () => {
    const row: FollowedChannelRow = { ...followedChannelRow, subscriberCount: null };
    const result = toFollowedChannelDTO(row);
    expect(result.subscriberCount).toBe('');
  });

  it('converts null followedAt to empty string', () => {
    const row = { ...followedChannelRow, followedAt: null as unknown as string };
    const result = toFollowedChannelDTO(row);
    expect(result.followedAt).toBe('');
  });

  it('throws on missing required field', () => {
    const { channelId, ...noChannelId } = followedChannelRow;
    expect(() => toFollowedChannelDTO(noChannelId as FollowedChannelRow)).toThrow();
  });
});

describe('toPlaylistFolderDTO', () => {
  it('maps a full row', () => {
    const result = toPlaylistFolderDTO(playlistFolderRow);
    expect(result).toEqual({
      id: 'folder-1',
      name: 'Folder A',
      sortOrder: 1,
      createdAt: '2025-01-10T00:00:00Z',
    });
  });

  it('converts null sortOrder to 0', () => {
    const row = { ...playlistFolderRow, sortOrder: null as unknown as number };
    const result = toPlaylistFolderDTO(row);
    expect(result.sortOrder).toBe(0);
  });

  it('converts null createdAt to empty string', () => {
    const row = { ...playlistFolderRow, createdAt: null as unknown as string };
    const result = toPlaylistFolderDTO(row);
    expect(result.createdAt).toBe('');
  });
});
