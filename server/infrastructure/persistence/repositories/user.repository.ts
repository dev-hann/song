import type { IUserRepository } from '@/server/domain/ports/repositories';
import type { User } from '@/types';
import { db } from '@/server/db';
import { users } from '@/server/db/schema';
import { eq } from 'drizzle-orm';
import { toUserDTO } from '../mappers/dto';
import crypto from 'crypto';

export const userRepository: IUserRepository = {
  async findByEmail(email): Promise<User | undefined> {
    const rows = await db.select().from(users).where(eq(users.email, email));
    return rows.length > 0 ? toUserDTO(rows[0]) : undefined;
  },

  async findById(id): Promise<User | undefined> {
    const rows = await db.select().from(users).where(eq(users.id, id));
    return rows.length > 0 ? toUserDTO(rows[0]) : undefined;
  },

  async create(data): Promise<User> {
    const id = `usr_${crypto.randomUUID()}`;
    await db.insert(users).values({
      id,
      email: data.email,
      name: data.name,
      picture: data.picture ?? '',
    });
    const user = await userRepository.findById(id);
    if (!user) {throw new Error('Failed to create user');}
    return user;
  },

  async updateLastLogin(id): Promise<void> {
    await db.update(users).set({ lastLogin: new Date().toISOString().replace('T', ' ').slice(0, 19) }).where(eq(users.id, id));
  },
};
