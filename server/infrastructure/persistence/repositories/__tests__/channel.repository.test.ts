// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockSelect = vi.fn().mockReturnThis();
const mockFrom = vi.fn().mockReturnThis();
const mockWhere = vi.fn().mockReturnThis();
const mockOrderBy = vi.fn().mockReturnThis();
const mockInsert = vi.fn().mockReturnThis();
const mockValues = vi.fn().mockReturnThis();
const mockOnConflictDoUpdate = vi.fn().mockReturnThis();
const mockDelete = vi.fn().mockReturnThis();
const mockReturning = vi.fn();

const mockDb = {
  select: mockSelect,
  from: mockFrom,
  where: mockWhere,
  orderBy: mockOrderBy,
  insert: mockInsert,
  values: mockValues,
  onConflictDoUpdate: mockOnConflictDoUpdate,
  delete: mockDelete,
  returning: mockReturning,
};

vi.mock('@/server/db', () => ({ db: mockDb }));

const channelRow = {
  userId: 'user1',
  channelId: 'ch1',
  channelName: 'Artist X',
  channelThumbnail: 'thumb.jpg',
  subscriberCount: '1000',
  followedAt: '2024-01-01 00:00:00',
};

beforeEach(() => {
  vi.clearAllMocks();
  mockSelect.mockReturnThis();
  mockFrom.mockReturnThis();
  mockWhere.mockReturnThis();
  mockOrderBy.mockReturnThis();
  mockInsert.mockReturnThis();
  mockValues.mockReturnThis();
  mockOnConflictDoUpdate.mockReturnThis();
  mockDelete.mockReturnThis();
  mockReturning.mockReturnThis();
});

describe('channelRepository', () => {
  it('getFollowed — returns followed channels', async () => {
    mockOrderBy.mockResolvedValueOnce([channelRow]);
    const { channelRepository } = await import('../channel.repository');
    const result = await channelRepository.getFollowed('user1');
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      channelId: 'ch1',
      channelName: 'Artist X',
      channelThumbnail: 'thumb.jpg',
      subscriberCount: '1000',
      followedAt: '2024-01-01 00:00:00',
    });
  });

  it('getFollowed — returns empty when no followed channels', async () => {
    mockOrderBy.mockResolvedValueOnce([]);
    const { channelRepository } = await import('../channel.repository');
    const result = await channelRepository.getFollowed('user1');
    expect(result).toEqual([]);
  });

  it('follow — inserts channel and returns it', async () => {
    mockOnConflictDoUpdate.mockResolvedValueOnce(undefined);
    mockWhere.mockResolvedValueOnce([channelRow]);
    const { channelRepository } = await import('../channel.repository');
    const result = await channelRepository.follow('user1', {
      channelId: 'ch1',
      channelName: 'Artist X',
      channelThumbnail: 'thumb.jpg',
      subscriberCount: '1000',
    });
    expect(result.channelId).toBe('ch1');
  });

  it('follow — handles null subscriberCount', async () => {
    const rowNullSub = { ...channelRow, subscriberCount: '' };
    mockOnConflictDoUpdate.mockResolvedValueOnce(undefined);
    mockWhere.mockResolvedValueOnce([rowNullSub]);
    const { channelRepository } = await import('../channel.repository');
    const result = await channelRepository.follow('user1', {
      channelId: 'ch1',
      channelName: 'Artist X',
      channelThumbnail: 'thumb.jpg',
    });
    expect(result.subscriberCount).toBe('');
  });

  it('unfollow — returns true when a row was deleted', async () => {
    mockReturning.mockResolvedValueOnce([{ channelId: 'ch1' }]);
    const { channelRepository } = await import('../channel.repository');
    const result = await channelRepository.unfollow('user1', 'ch1');
    expect(result).toBe(true);
  });

  it('unfollow — returns false when no row was deleted', async () => {
    mockReturning.mockResolvedValueOnce([]);
    const { channelRepository } = await import('../channel.repository');
    const result = await channelRepository.unfollow('user1', 'ch1');
    expect(result).toBe(false);
  });

  it('isFollowing — returns true when following', async () => {
    mockWhere.mockResolvedValueOnce([{ channelId: 'ch1' }]);
    const { channelRepository } = await import('../channel.repository');
    const result = await channelRepository.isFollowing('user1', 'ch1');
    expect(result).toBe(true);
  });

  it('isFollowing — returns false when not following', async () => {
    mockWhere.mockResolvedValueOnce([]);
    const { channelRepository } = await import('../channel.repository');
    const result = await channelRepository.isFollowing('user1', 'ch1');
    expect(result).toBe(false);
  });
});
