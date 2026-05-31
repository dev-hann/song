import { z } from 'zod';
import crypto from 'crypto';
import type { User as UserType } from '@/types';
import { db } from '@/server/db';
import { users } from '@/server/db/schema';
import { eq } from 'drizzle-orm';
import { toUserDTO } from './dto';

export const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string(),
  picture: z.string().default(''),
  registeredAt: z.string(),
  lastLogin: z.string(),
  isActive: z.boolean().default(true),
});

export type User = UserType;

export async function findUserByEmail(email: string): Promise<UserType | undefined> {
  const rows = await db.select().from(users).where(eq(users.email, email));
  return rows.length > 0 ? toUserDTO(rows[0]) : undefined;
}

export async function findUserById(id: string): Promise<UserType | undefined> {
  const rows = await db.select().from(users).where(eq(users.id, id));
  return rows.length > 0 ? toUserDTO(rows[0]) : undefined;
}

export async function createUser(data: {
  email: string;
  name: string;
  picture?: string;
}): Promise<UserType> {
  const id = `usr_${crypto.randomUUID()}`;

  await db.insert(users).values({
    id,
    email: data.email,
    name: data.name,
    picture: data.picture ?? '',
  });

  const user = await findUserById(id);
  if (!user) {throw new Error('Failed to create user');}
  return user;
}

export async function updateLastLogin(id: string): Promise<void> {
  await db.update(users).set({ lastLogin: new Date().toISOString().replace('T', ' ').slice(0, 19) }).where(eq(users.id, id));
}
