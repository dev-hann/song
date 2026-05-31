// @vitest-environment node
import { vi, describe, it, expect, beforeEach } from 'vitest';

const { mockDb } = vi.hoisted(() => {
  const self: Record<string, ReturnType<typeof vi.fn>> = {};
  self.select = vi.fn();
  self.from = vi.fn();
  self.where = vi.fn();
  self.orderBy = vi.fn();
  self.limit = vi.fn();
  self.insert = vi.fn();
  self.values = vi.fn();
  self.returning = vi.fn();
  self.update = vi.fn();
  self.set = vi.fn();
  self.delete = vi.fn();
  self.onConflictDoUpdate = vi.fn();
  return { mockDb: self };
});

vi.mock('@/server/db', () => ({
  db: mockDb,
}));

function resetMockChain() {
  vi.clearAllMocks();
  Object.values(mockDb).forEach((fn) => fn.mockReturnThis());
}

import { getAllLikes, addLike, removeLike, isLiked, getLikedVideoIds } from '../like';

const mockLikeRow = {
  userId: 'u1',
  videoId: 'v1',
  title: 'Song 1',
  channel: 'Artist',
  thumbnail: 'thumb.jpg',
  duration: 200,
  likedAt: '2025-01-01',
};

describe('like model', () => {
  beforeEach(() => {
    resetMockChain();
  });

  describe('getAllLikes', () => {
    it('returns all likes for user', async () => {
      mockDb.orderBy.mockResolvedValueOnce([mockLikeRow]);

      const result = await getAllLikes('u1');

      expect(result).toEqual([{
        videoId: 'v1',
        title: 'Song 1',
        channel: 'Artist',
        thumbnail: 'thumb.jpg',
        duration: 200,
        likedAt: '2025-01-01',
      }]);
    });

    it('returns empty array when no likes', async () => {
      mockDb.orderBy.mockResolvedValueOnce([]);

      const result = await getAllLikes('u1');

      expect(result).toEqual([]);
    });
  });

  describe('addLike', () => {
    it('inserts and returns like', async () => {
      mockDb.onConflictDoUpdate.mockResolvedValueOnce(undefined);
      mockDb.where.mockResolvedValueOnce([mockLikeRow]);

      const result = await addLike('u1', {
        videoId: 'v1',
        title: 'Song',
        channel: 'Artist',
        thumbnail: 'thumb.jpg',
        duration: 200,
      });

      expect(mockDb.insert).toHaveBeenCalled();
      expect(result.videoId).toBe('v1');
    });
  });

  describe('removeLike', () => {
    it('returns true when like removed', async () => {
      mockDb.returning.mockResolvedValueOnce([{ videoId: 'v1' }]);

      const result = await removeLike('u1', 'v1');

      expect(result).toBe(true);
    });

    it('returns false when no like removed', async () => {
      mockDb.returning.mockResolvedValueOnce([]);

      const result = await removeLike('u1', 'nonexistent');

      expect(result).toBe(false);
    });
  });

  describe('isLiked', () => {
    it('returns true when liked', async () => {
      mockDb.where.mockResolvedValueOnce([{ videoId: 'v1' }]);

      const result = await isLiked('u1', 'v1');

      expect(result).toBe(true);
    });

    it('returns false when not liked', async () => {
      mockDb.where.mockResolvedValueOnce([]);

      const result = await isLiked('u1', 'v1');

      expect(result).toBe(false);
    });
  });

  describe('getLikedVideoIds', () => {
    it('returns video ids', async () => {
      mockDb.where.mockResolvedValueOnce([{ videoId: 'v1' }, { videoId: 'v2' }]);

      const result = await getLikedVideoIds('u1');

      expect(result).toEqual(['v1', 'v2']);
    });
  });
});
