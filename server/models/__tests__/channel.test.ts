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

import { getFollowedChannels, followChannel, unfollowChannel, isFollowing } from '../channel';

const mockChannelRow = {
  userId: 'u1',
  channelId: 'ch1',
  channelName: 'Channel 1',
  channelThumbnail: 'thumb.jpg',
  subscriberCount: '1000',
  followedAt: '2025-01-01',
};

describe('channel model', () => {
  beforeEach(() => {
    resetMockChain();
  });

  describe('getFollowedChannels', () => {
    it('returns followed channels', async () => {
      mockDb.orderBy.mockResolvedValueOnce([mockChannelRow]);

      const result = await getFollowedChannels('u1');

      expect(result).toEqual([{
        channelId: 'ch1',
        channelName: 'Channel 1',
        channelThumbnail: 'thumb.jpg',
        subscriberCount: '1000',
        followedAt: '2025-01-01',
      }]);
    });

    it('returns empty array when no channels', async () => {
      mockDb.orderBy.mockResolvedValueOnce([]);

      const result = await getFollowedChannels('u1');

      expect(result).toEqual([]);
    });
  });

  describe('followChannel', () => {
    it('inserts and returns channel', async () => {
      mockDb.onConflictDoUpdate.mockResolvedValueOnce(undefined);
      mockDb.where.mockResolvedValueOnce([mockChannelRow]);

      const result = await followChannel('u1', {
        channelId: 'ch1',
        channelName: 'Channel 1',
        channelThumbnail: 'thumb.jpg',
        subscriberCount: '1000',
      });

      expect(mockDb.insert).toHaveBeenCalled();
      expect(result.channelId).toBe('ch1');
    });

    it('uses empty subscriber count when not provided', async () => {
      mockDb.onConflictDoUpdate.mockResolvedValueOnce(undefined);
      mockDb.where.mockResolvedValueOnce([{ ...mockChannelRow, subscriberCount: '' }]);

      const result = await followChannel('u1', {
        channelId: 'ch1',
        channelName: 'Channel 1',
        channelThumbnail: 'thumb.jpg',
      });

      expect(result.subscriberCount).toBe('');
    });
  });

  describe('unfollowChannel', () => {
    it('returns true when unfollowed', async () => {
      mockDb.returning.mockResolvedValueOnce([{ channelId: 'ch1' }]);

      const result = await unfollowChannel('u1', 'ch1');

      expect(result).toBe(true);
    });

    it('returns false when not following', async () => {
      mockDb.returning.mockResolvedValueOnce([]);

      const result = await unfollowChannel('u1', 'nonexistent');

      expect(result).toBe(false);
    });
  });

  describe('isFollowing', () => {
    it('returns true when following', async () => {
      mockDb.where.mockResolvedValueOnce([{ channelId: 'ch1' }]);

      const result = await isFollowing('u1', 'ch1');

      expect(result).toBe(true);
    });

    it('returns false when not following', async () => {
      mockDb.where.mockResolvedValueOnce([]);

      const result = await isFollowing('u1', 'ch1');

      expect(result).toBe(false);
    });
  });
});
