// @vitest-environment node
import { vi, describe, it, expect, beforeEach } from 'vitest';

const { mockDb, createChainMock } = vi.hoisted(() => {
  const self: Record<string, ReturnType<typeof vi.fn>> = {};
  const methodNames = [
    'select', 'from', 'where', 'orderBy', 'limit',
    'insert', 'values', 'returning', 'update', 'set', 'delete',
  ];

  function createChainMock() {
    for (const name of methodNames) {
      self[name] = vi.fn().mockImplementation(() => self);
    }
  }

  createChainMock();
  return { mockDb: self, createChainMock };
});

vi.mock('@/server/db', () => ({
  db: mockDb,
}));

import { getRecentHistory, addToHistory, clearHistory } from '../history';

const mockHistoryRow = {
  id: 1,
  userId: 'u1',
  videoId: 'v1',
  title: 'Song',
  channel: 'Artist',
  thumbnail: 'thumb.jpg',
  duration: 200,
  playedAt: '2025-06-01',
};

describe('history model', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    createChainMock();
  });

  describe('getRecentHistory', () => {
    it('returns recent history for user', async () => {
      mockDb.limit.mockResolvedValueOnce([mockHistoryRow]);

      const result = await getRecentHistory('u1', 100);

      expect(result).toEqual([{
        id: 1,
        videoId: 'v1',
        title: 'Song',
        channel: 'Artist',
        thumbnail: 'thumb.jpg',
        duration: 200,
        playedAt: '2025-06-01',
      }]);
    });

    it('returns empty array when no history', async () => {
      mockDb.limit.mockResolvedValueOnce([]);

      const result = await getRecentHistory('u1');

      expect(result).toEqual([]);
    });
  });

  describe('addToHistory', () => {
    it('updates existing history entry', async () => {
      mockDb.limit.mockResolvedValueOnce([{ id: 1 }]);
      mockDb.where
        .mockImplementationOnce(() => mockDb)
        .mockResolvedValueOnce(undefined);
      mockDb.where.mockResolvedValueOnce([{ count: 1 }]);

      await addToHistory('u1', {
        videoId: 'v1',
        title: 'Song',
        channel: 'Artist',
        thumbnail: 'thumb.jpg',
        duration: 200,
      });

      expect(mockDb.update).toHaveBeenCalled();
    });

    it('inserts new history entry when not existing', async () => {
      mockDb.limit.mockResolvedValueOnce([]);
      mockDb.values.mockResolvedValueOnce(undefined);
      mockDb.where
        .mockImplementationOnce(() => mockDb)
        .mockResolvedValueOnce([{ count: 1 }]);

      await addToHistory('u1', {
        videoId: 'v2',
        title: 'New Song',
        channel: 'Artist',
        thumbnail: 'thumb.jpg',
        duration: 180,
      });

      expect(mockDb.insert).toHaveBeenCalled();
    });
  });

  describe('clearHistory', () => {
    it('deletes all history for user', async () => {
      mockDb.where.mockResolvedValueOnce(undefined);

      await clearHistory('u1');

      expect(mockDb.delete).toHaveBeenCalled();
    });
  });
});
