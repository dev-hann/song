import type { ILikeRepository } from '@/server/domain/ports/repositories';
import type { Like } from '@/types';
import { db } from '@/server/db';
import { likes } from '@/server/db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { toLikeDTO } from '../mappers/dto';

export const likeRepository: ILikeRepository = {
  async getAll(userId: string): Promise<Like[]> {
    const rows = await db.select().from(likes).where(eq(likes.userId, userId)).orderBy(desc(likes.likedAt));
    return rows.map(toLikeDTO);
  },

  async add(userId, track): Promise<Like> {
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);
    await db.insert(likes).values({
      userId,
      videoId: track.videoId,
      title: track.title,
      channel: track.channel,
      thumbnail: track.thumbnail,
      duration: track.duration,
      likedAt: now,
    }).onConflictDoUpdate({
      target: [likes.userId, likes.videoId],
      set: {
        title: track.title,
        channel: track.channel,
        thumbnail: track.thumbnail,
        duration: track.duration,
        likedAt: now,
      },
    });
    const rows = await db.select().from(likes).where(and(eq(likes.userId, userId), eq(likes.videoId, track.videoId)));
    return toLikeDTO(rows[0]);
  },

  async remove(userId, videoId): Promise<boolean> {
    const result = await db.delete(likes).where(and(eq(likes.userId, userId), eq(likes.videoId, videoId))).returning();
    return result.length > 0;
  },

  async isLiked(userId, videoId): Promise<boolean> {
    const rows = await db.select({ videoId: likes.videoId }).from(likes).where(and(eq(likes.userId, userId), eq(likes.videoId, videoId)));
    return rows.length > 0;
  },

  async getLikedVideoIds(userId): Promise<string[]> {
    const rows = await db.select({ videoId: likes.videoId }).from(likes).where(eq(likes.userId, userId));
    return rows.map((r) => r.videoId);
  },
};
