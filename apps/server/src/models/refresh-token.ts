import crypto from 'crypto';
import { getDb } from '../lib/db.js';

export function createRefreshToken(userId: string): string {
  const db = getDb();
  const token = crypto.randomBytes(64).toString('hex');
  const tokenHash = hashToken(token);
  const id = `rt_${crypto.randomUUID()}`;
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  db.prepare(
    `INSERT INTO refresh_tokens (id, token_hash, user_id, expires_at)
     VALUES (?, ?, ?, ?)`,
  ).run(id, tokenHash, userId, expiresAt);

  return token;
}

export function validateRefreshToken(token: string): { userId: string; tokenId: string } | null {
  const db = getDb();
  const tokenHash = hashToken(token);

  const row = db
    .prepare('SELECT id, user_id, expires_at FROM refresh_tokens WHERE token_hash = ?')
    .get(tokenHash) as { id: string; user_id: string; expires_at: string } | undefined;

  if (!row) return null;
  if (new Date(row.expires_at) < new Date()) {
    db.prepare('DELETE FROM refresh_tokens WHERE id = ?').run(row.id);
    return null;
  }

  return { userId: row.user_id, tokenId: row.id };
}

export function rotateRefreshToken(oldTokenId: string, userId: string): string {
  const db = getDb();

  db.transaction(() => {
    db.prepare('DELETE FROM refresh_tokens WHERE id = ?').run(oldTokenId);
  })();

  return createRefreshToken(userId);
}

export function revokeAllRefreshTokens(userId: string): void {
  const db = getDb();
  db.prepare('DELETE FROM refresh_tokens WHERE user_id = ?').run(userId);
}

function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}
