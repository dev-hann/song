import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, '../../data/song.db');

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (db) return db;

  db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  db.exec(`
    CREATE TABLE IF NOT EXISTS playlists (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      cover_image TEXT DEFAULT '',
      is_system INTEGER DEFAULT 0,
      track_count INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS playlist_tracks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      playlist_id TEXT NOT NULL REFERENCES playlists(id) ON DELETE CASCADE,
      video_id TEXT NOT NULL,
      title TEXT NOT NULL,
      channel TEXT NOT NULL,
      thumbnail TEXT DEFAULT '',
      duration INTEGER DEFAULT 0,
      sort_order INTEGER NOT NULL,
      added_at TEXT DEFAULT (datetime('now')),
      UNIQUE(playlist_id, video_id)
    );

    CREATE TABLE IF NOT EXISTS likes (
      video_id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      channel TEXT NOT NULL,
      thumbnail TEXT DEFAULT '',
      duration INTEGER DEFAULT 0,
      liked_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS play_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      video_id TEXT NOT NULL,
      title TEXT NOT NULL,
      channel TEXT NOT NULL,
      thumbnail TEXT DEFAULT '',
      duration INTEGER DEFAULT 0,
      played_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS followed_channels (
      channel_id TEXT PRIMARY KEY,
      channel_name TEXT NOT NULL,
      channel_thumbnail TEXT DEFAULT '',
      subscriber_count TEXT DEFAULT '',
      followed_at TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_playlist_tracks_playlist ON playlist_tracks(playlist_id);
    CREATE INDEX IF NOT EXISTS idx_playlist_tracks_sort ON playlist_tracks(playlist_id, sort_order);
    CREATE INDEX IF NOT EXISTS idx_play_history_video ON play_history(video_id);
    CREATE INDEX IF NOT EXISTS idx_play_history_played ON play_history(played_at DESC);
  `);

  const liked = db.prepare("SELECT id FROM playlists WHERE id = 'liked'").get();
  if (!liked) {
    db.prepare(
      "INSERT INTO playlists (id, name, description, is_system) VALUES ('liked', '좋아요한 곡', '', 1)",
    ).run();
  }

  return db;
}
