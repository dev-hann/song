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
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      picture TEXT DEFAULT '',
      registered_at TEXT DEFAULT (datetime('now')),
      last_login TEXT DEFAULT (datetime('now')),
      is_active INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS playlists (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
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
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      video_id TEXT NOT NULL,
      title TEXT NOT NULL,
      channel TEXT NOT NULL,
      thumbnail TEXT DEFAULT '',
      duration INTEGER DEFAULT 0,
      liked_at TEXT DEFAULT (datetime('now')),
      PRIMARY KEY (user_id, video_id)
    );

    CREATE TABLE IF NOT EXISTS play_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      video_id TEXT NOT NULL,
      title TEXT NOT NULL,
      channel TEXT NOT NULL,
      thumbnail TEXT DEFAULT '',
      duration INTEGER DEFAULT 0,
      played_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS followed_channels (
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      channel_id TEXT NOT NULL,
      channel_name TEXT NOT NULL,
      channel_thumbnail TEXT DEFAULT '',
      subscriber_count TEXT DEFAULT '',
      followed_at TEXT DEFAULT (datetime('now')),
      PRIMARY KEY (user_id, channel_id)
    );

    CREATE TABLE IF NOT EXISTS refresh_tokens (
      id TEXT PRIMARY KEY,
      token_hash TEXT UNIQUE NOT NULL,
      user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_playlist_tracks_playlist ON playlist_tracks(playlist_id);
    CREATE INDEX IF NOT EXISTS idx_playlist_tracks_sort ON playlist_tracks(playlist_id, sort_order);
    CREATE INDEX IF NOT EXISTS idx_play_history_video ON play_history(user_id, video_id);
    CREATE INDEX IF NOT EXISTS idx_play_history_played ON play_history(user_id, played_at DESC);
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_playlists_user ON playlists(user_id);
    CREATE INDEX IF NOT EXISTS idx_likes_user ON likes(user_id);
    CREATE INDEX IF NOT EXISTS idx_followed_channels_user ON followed_channels(user_id);
    CREATE INDEX IF NOT EXISTS idx_refresh_tokens_hash ON refresh_tokens(token_hash);
    CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user ON refresh_tokens(user_id);
  `);

  return db;
}
