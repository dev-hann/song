/* eslint-disable */
// @ts-nocheck
// 이 스크립트는 일회용 마이그레이션용으로 better-sqlite3를 임시 설치해서 실행: npx tsx scripts/migrate-sqlite-to-pg.ts
import Database from 'better-sqlite3';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import * as schema from '../server/db/schema.js';
import path from 'path';

const SQLITE_PATH = process.argv[2] ?? path.join(process.cwd(), 'data', 'song.db');
const DATABASE_URL = process.env.DATABASE_URL ?? 'postgres://song:password@localhost:5432/song';

async function migrate() {
  console.log(`Reading from SQLite: ${SQLITE_PATH}`);
  console.log(`Writing to PostgreSQL: ${DATABASE_URL}`);

  const sqlite = new Database(SQLITE_PATH, { readonly: true });
  const client = postgres(DATABASE_URL);
  const db = drizzle(client, { schema });

  try {
    const users = sqlite.prepare('SELECT * FROM users').all() as Array<Record<string, unknown>>;
    console.log(`Migrating ${users.length} users...`);
    if (users.length > 0) {
      await db.insert(schema.users).values(
        users.map((u) => ({
          id: u.id as string,
          email: u.email as string,
          name: u.name as string,
          picture: (u.picture as string) || '',
          registeredAt: u.registered_at as string,
          lastLogin: u.last_login as string,
          isActive: Boolean(u.is_active),
        })),
      ).onConflictDoNothing();
    }

    const playlists = sqlite.prepare('SELECT * FROM playlists').all() as Array<Record<string, unknown>>;
    console.log(`Migrating ${playlists.length} playlists...`);
    if (playlists.length > 0) {
      await db.insert(schema.playlists).values(
        playlists.map((p) => ({
          id: p.id as string,
          userId: p.user_id as string,
          name: p.name as string,
          description: (p.description as string) || '',
          coverImage: (p.cover_image as string) || '',
          isSystem: Boolean(p.is_system),
          trackCount: p.track_count as number,
          createdAt: p.created_at as string,
          updatedAt: p.updated_at as string,
        })),
      ).onConflictDoNothing();
    }

    const playlistTracks = sqlite.prepare('SELECT * FROM playlist_tracks').all() as Array<Record<string, unknown>>;
    console.log(`Migrating ${playlistTracks.length} playlist tracks...`);
    if (playlistTracks.length > 0) {
      await db.insert(schema.playlistTracks).values(
        playlistTracks.map((t) => ({
          id: t.id as number,
          playlistId: t.playlist_id as string,
          videoId: t.video_id as string,
          title: t.title as string,
          channel: t.channel as string,
          thumbnail: (t.thumbnail as string) || '',
          duration: t.duration as number,
          sortOrder: t.sort_order as number,
          addedAt: t.added_at as string,
        })),
      ).onConflictDoNothing();
    }

    const likes = sqlite.prepare('SELECT * FROM likes').all() as Array<Record<string, unknown>>;
    console.log(`Migrating ${likes.length} likes...`);
    if (likes.length > 0) {
      await db.insert(schema.likes).values(
        likes.map((l) => ({
          userId: l.user_id as string,
          videoId: l.video_id as string,
          title: l.title as string,
          channel: l.channel as string,
          thumbnail: (l.thumbnail as string) || '',
          duration: l.duration as number,
          likedAt: l.liked_at as string,
        })),
      ).onConflictDoNothing();
    }

    const history = sqlite.prepare('SELECT * FROM play_history').all() as Array<Record<string, unknown>>;
    console.log(`Migrating ${history.length} history items...`);
    if (history.length > 0) {
      await db.insert(schema.playHistory).values(
        history.map((h) => ({
          id: h.id as number,
          userId: h.user_id as string,
          videoId: h.video_id as string,
          title: h.title as string,
          channel: h.channel as string,
          thumbnail: (h.thumbnail as string) || '',
          duration: h.duration as number,
          playedAt: h.played_at as string,
        })),
      ).onConflictDoNothing();
    }

    const channels = sqlite.prepare('SELECT * FROM followed_channels').all() as Array<Record<string, unknown>>;
    console.log(`Migrating ${channels.length} followed channels...`);
    if (channels.length > 0) {
      await db.insert(schema.followedChannels).values(
        channels.map((c) => ({
          userId: c.user_id as string,
          channelId: c.channel_id as string,
          channelName: c.channel_name as string,
          channelThumbnail: (c.channel_thumbnail as string) || '',
          subscriberCount: (c.subscriber_count as string) || '',
          followedAt: c.followed_at as string,
        })),
      ).onConflictDoNothing();
    }

    console.log('Migration complete!');
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    sqlite.close();
    await client.end();
  }
}

migrate();
