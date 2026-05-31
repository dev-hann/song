import type { IHistoryRepository } from '@/server/domain/ports/repositories';
import type { HistoryItem } from '@/types';
import { db } from '@/server/db';
import { playHistory } from '@/server/db/schema';
import { eq, desc, sql, notInArray, and } from 'drizzle-orm';
import { toHistoryDTO } from '../mappers/dto';

export const historyRepository: IHistoryRepository = {
  async getRecent(userId, limit = 100): Promise<HistoryItem[]> {
    const rows = await db.select().from(playHistory)
      .where(eq(playHistory.userId, userId))
      .orderBy(desc(playHistory.playedAt))
      .limit(limit);
    return rows.map(toHistoryDTO);
  },

  async add(userId, track): Promise<void> {
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);

    const existing = await db.select({ id: playHistory.id })
      .from(playHistory)
      .where(and(eq(playHistory.userId, userId), eq(playHistory.videoId, track.videoId)))
      .orderBy(desc(playHistory.playedAt))
      .limit(1);

    if (existing.length > 0) {
      await db.update(playHistory).set({ playedAt: now }).where(eq(playHistory.id, existing[0].id));
    } else {
      await db.insert(playHistory).values({
        userId,
        videoId: track.videoId,
        title: track.title,
        channel: track.channel,
        thumbnail: track.thumbnail,
        duration: track.duration,
        playedAt: now,
      });
    }

    const countResult = await db.select({ count: sql<number>`COUNT(*)` })
      .from(playHistory)
      .where(eq(playHistory.userId, userId));
    const count = Number(countResult[0]?.count ?? 0);

    if (count > 200) {
      const keepRows = await db.select({ id: playHistory.id })
        .from(playHistory)
        .where(eq(playHistory.userId, userId))
        .orderBy(desc(playHistory.playedAt))
        .limit(100);
      const keepIds = keepRows.map((r) => r.id);

      await db.delete(playHistory)
        .where(and(eq(playHistory.userId, userId), notInArray(playHistory.id, keepIds)));
    }
  },

  async clear(userId): Promise<void> {
    await db.delete(playHistory).where(eq(playHistory.userId, userId));
  },
};
