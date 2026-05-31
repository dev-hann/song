import { z } from 'zod';
import type { Like as LikeType } from '@/types';
import { db } from '@/server/db';
import { likes } from '@/server/db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { toLikeDTO } from './dto';

export const LikeSchema = z.object({
  videoId: z.string(),
  title: z.string(),
  channel: z.string(),
  thumbnail: z.string(),
  duration: z.number(),
  likedAt: z.string(),
});

export type Like = LikeType;

export async function getAllLikes(userId: string): Promise<LikeType[]> {
  const rows = await db.select().from(likes).where(eq(likes.userId, userId)).orderBy(desc(likes.likedAt));
  return rows.map(toLikeDTO);
}

export async function addLike(userId: string, track: {
  videoId: string;
  title: string;
  channel: string;
  thumbnail: string;
  duration: number;
}): Promise<LikeType> {
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
}

export async function removeLike(userId: string, videoId: string): Promise<boolean> {
  const result = await db.delete(likes).where(and(eq(likes.userId, userId), eq(likes.videoId, videoId))).returning();
  return result.length > 0;
}

export async function isLiked(userId: string, videoId: string): Promise<boolean> {
  const rows = await db.select({ videoId: likes.videoId }).from(likes).where(and(eq(likes.userId, userId), eq(likes.videoId, videoId)));
  return rows.length > 0;
}

export async function getLikedVideoIds(userId: string): Promise<string[]> {
  const rows = await db.select({ videoId: likes.videoId }).from(likes).where(eq(likes.userId, userId));
  return rows.map((r) => r.videoId);
}
