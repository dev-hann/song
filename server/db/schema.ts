import { pgTable, text, integer, serial, boolean, index, primaryKey, jsonb } from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  email: text('email').unique().notNull(),
  name: text('name').notNull(),
  picture: text('picture').default(''),
  registeredAt: text('registered_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  lastLogin: text('last_login').default(sql`CURRENT_TIMESTAMP`).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  onboardingCompleted: boolean('onboarding_completed').default(false).notNull(),
}, (table) => [
  index('idx_users_email').on(table.email),
]);

export const playlistFolders = pgTable('playlist_folders', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  sortOrder: integer('sort_order').default(0).notNull(),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
  index('idx_playlist_folders_user').on(table.userId),
]);

export const playlists = pgTable('playlists', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description').default(''),
  coverImage: text('cover_image').default(''),
  isSystem: boolean('is_system').default(false).notNull(),
  trackCount: integer('track_count').default(0).notNull(),
  rules: jsonb('rules').default(null),
  folderId: text('folder_id').references(() => playlistFolders.id, { onDelete: 'set null' }),
  isPublic: boolean('is_public').default(false).notNull(),
  shareId: text('share_id').unique(),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: text('updated_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
  index('idx_playlists_user').on(table.userId),
  index('idx_playlists_share_id').on(table.shareId),
]);

export const playlistTracks = pgTable('playlist_tracks', {
  id: serial('id').primaryKey(),
  playlistId: text('playlist_id').notNull().references(() => playlists.id, { onDelete: 'cascade' }),
  videoId: text('video_id').notNull(),
  title: text('title').notNull(),
  channel: text('channel').notNull(),
  thumbnail: text('thumbnail').default(''),
  duration: integer('duration').default(0).notNull(),
  sortOrder: integer('sort_order').notNull(),
  addedAt: text('added_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
  index('idx_playlist_tracks_playlist').on(table.playlistId),
  index('idx_playlist_tracks_sort').on(table.playlistId, table.sortOrder),
]);

export const likes = pgTable('likes', {
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  videoId: text('video_id').notNull(),
  title: text('title').notNull(),
  channel: text('channel').notNull(),
  thumbnail: text('thumbnail').default(''),
  duration: integer('duration').default(0).notNull(),
  likedAt: text('liked_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
  primaryKey({ columns: [table.userId, table.videoId] }),
  index('idx_likes_user').on(table.userId),
]);

export const playHistory = pgTable('play_history', {
  id: serial('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  videoId: text('video_id').notNull(),
  title: text('title').notNull(),
  channel: text('channel').notNull(),
  thumbnail: text('thumbnail').default(''),
  duration: integer('duration').default(0).notNull(),
  playedAt: text('played_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
  index('idx_play_history_video').on(table.userId, table.videoId),
  index('idx_play_history_played').on(table.userId, table.playedAt),
]);

export const followedChannels = pgTable('followed_channels', {
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  channelId: text('channel_id').notNull(),
  channelName: text('channel_name').notNull(),
  channelThumbnail: text('channel_thumbnail').default(''),
  subscriberCount: text('subscriber_count').default(''),
  followedAt: text('followed_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => [
  primaryKey({ columns: [table.userId, table.channelId] }),
  index('idx_followed_channels_user').on(table.userId),
]);
