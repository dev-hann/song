import { z } from 'zod';
import type { User as UserType } from '@song/types';
import { getDb } from '../lib/db.js';

export const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string(),
  picture: z.string().default(''),
  registered_at: z.string(),
  last_login: z.string(),
  is_active: z.number().default(1),
});

export type User = UserType;

export function findUserByEmail(email: string): User | undefined {
  const db = getDb();
  const row = db.prepare('SELECT * FROM users WHERE email = ?').get(email) as DbUserRow | undefined;
  return row ? mapRowToUser(row) : undefined;
}

export function findUserById(id: string): User | undefined {
  const db = getDb();
  const row = db.prepare('SELECT * FROM users WHERE id = ?').get(id) as DbUserRow | undefined;
  return row ? mapRowToUser(row) : undefined;
}

export function createUser(data: {
  email: string;
  name: string;
  picture?: string;
}): User {
  const db = getDb();
  const id = `usr_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  db.prepare(
    `INSERT INTO users (id, email, name, picture)
     VALUES (?, ?, ?, ?)`,
  ).run(id, data.email, data.name, data.picture ?? '');

  return findUserById(id)!;
}

export function updateLastLogin(id: string): void {
  const db = getDb();
  db.prepare("UPDATE users SET last_login = datetime('now') WHERE id = ?").run(id);
}

interface DbUserRow {
  id: string;
  email: string;
  name: string;
  picture: string;
  registered_at: string;
  last_login: string;
  is_active: number;
}

function mapRowToUser(row: DbUserRow): User {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    picture: row.picture || undefined,
    registeredAt: row.registered_at,
    lastLogin: row.last_login,
    isActive: row.is_active === 1,
  };
}
