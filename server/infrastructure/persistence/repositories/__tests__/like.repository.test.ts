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

const likeRow = {
  userId: 'user1',
  videoId: 'v1',
  title: 'Song A',
  channel: 'Artist X',
  thumbnail: 'thumb.jpg',
  duration: 200,
  likedAt: '2024-01-01 00:00:00',
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

describe('likeRepository', () => {
  it('getAll — returns mapped likes ordered by likedAt desc', async () => {
    mockOrderBy.mockResolvedValueOnce([likeRow]);
    const { likeRepository } = await import('../like.repository');
    const result = await likeRepository.getAll('user1');
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      videoId: 'v1',
      title: 'Song A',
      channel: 'Artist X',
      thumbnail: 'thumb.jpg',
      duration: 200,
      likedAt: '2024-01-01 00:00:00',
    });
  });

  it('getAll — returns empty array when no likes', async () => {
    mockOrderBy.mockResolvedValueOnce([]);
    const { likeRepository } = await import('../like.repository');
    const result = await likeRepository.getAll('user1');
    expect(result).toEqual([]);
  });

  it('add — inserts and returns the like', async () => {
    mockOnConflictDoUpdate.mockResolvedValueOnce(undefined);
    mockWhere.mockResolvedValueOnce([likeRow]);
    const { likeRepository } = await import('../like.repository');
    const result = await likeRepository.add('user1', {
      videoId: 'v1',
      title: 'Song A',
      channel: 'Artist X',
      thumbnail: 'thumb.jpg',
      duration: 200,
    });
    expect(result.videoId).toBe('v1');
  });

  it('remove — returns true when a row was deleted', async () => {
    mockReturning.mockResolvedValueOnce([{ userId: 'user1', videoId: 'v1' }]);
    const { likeRepository } = await import('../like.repository');
    const result = await likeRepository.remove('user1', 'v1');
    expect(result).toBe(true);
  });

  it('remove — returns false when no row was deleted', async () => {
    mockReturning.mockResolvedValueOnce([]);
    const { likeRepository } = await import('../like.repository');
    const result = await likeRepository.remove('user1', 'v1');
    expect(result).toBe(false);
  });

  it('isLiked — returns true when like exists', async () => {
    mockWhere.mockResolvedValueOnce([{ videoId: 'v1' }]);
    const { likeRepository } = await import('../like.repository');
    const result = await likeRepository.isLiked('user1', 'v1');
    expect(result).toBe(true);
  });

  it('isLiked — returns false when like does not exist', async () => {
    mockWhere.mockResolvedValueOnce([]);
    const { likeRepository } = await import('../like.repository');
    const result = await likeRepository.isLiked('user1', 'v1');
    expect(result).toBe(false);
  });

  it('getLikedVideoIds — returns array of video IDs', async () => {
    mockWhere.mockResolvedValueOnce([{ videoId: 'v1' }, { videoId: 'v2' }]);
    const { likeRepository } = await import('../like.repository');
    const result = await likeRepository.getLikedVideoIds('user1');
    expect(result).toEqual(['v1', 'v2']);
  });

  it('getLikedVideoIds — returns empty array when no likes', async () => {
    mockWhere.mockResolvedValueOnce([]);
    const { likeRepository } = await import('../like.repository');
    const result = await likeRepository.getLikedVideoIds('user1');
    expect(result).toEqual([]);
  });

  it('add — handles null thumbnail/duration from track', async () => {
    const rowWithNulls = { ...likeRow, thumbnail: null, duration: null };
    mockOnConflictDoUpdate.mockResolvedValueOnce(undefined);
    mockWhere.mockResolvedValueOnce([rowWithNulls]);
    const { likeRepository } = await import('../like.repository');
    const result = await likeRepository.add('user1', {
      videoId: 'v1',
      title: 'Song A',
      channel: 'Artist X',
      thumbnail: '',
      duration: 0,
    });
    expect(result.thumbnail).toBe('');
    expect(result.duration).toBe(0);
  });
});
