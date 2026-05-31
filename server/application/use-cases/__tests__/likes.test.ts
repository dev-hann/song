// @vitest-environment node
import { describe, it, expect, vi } from 'vitest';
import { createGetLikes, createAddLike, createRemoveLike, createCheckLike } from '../likes';
import type { Like } from '@/types';

function createMockLikeRepo() {
  return {
    getAll: vi.fn(),
    add: vi.fn(),
    remove: vi.fn(),
    isLiked: vi.fn(),
    getLikedVideoIds: vi.fn(),
  };
}

const mockLike: Like = {
  videoId: 'v1',
  title: 'Song',
  channel: 'Artist',
  thumbnail: 'https://img.example.com/v1.jpg',
  duration: 200,
  likedAt: '2024-01-01T00:00:00Z',
};

describe('createGetLikes', () => {
  it('returns all likes for a user', async () => {
    const repo = createMockLikeRepo();
    const likes = [mockLike];
    repo.getAll.mockResolvedValue(likes);

    const getLikes = createGetLikes(repo);
    const result = await getLikes('user1');

    expect(result).toEqual(likes);
    expect(repo.getAll).toHaveBeenCalledWith('user1');
  });

  it('returns empty array when user has no likes', async () => {
    const repo = createMockLikeRepo();
    repo.getAll.mockResolvedValue([]);

    const getLikes = createGetLikes(repo);
    const result = await getLikes('user1');

    expect(result).toEqual([]);
  });

  it('propagates errors from repository', async () => {
    const repo = createMockLikeRepo();
    repo.getAll.mockRejectedValue(new Error('DB error'));

    const getLikes = createGetLikes(repo);
    await expect(getLikes('user1')).rejects.toThrow('DB error');
  });
});

describe('createAddLike', () => {
  it('adds a like and returns it', async () => {
    const repo = createMockLikeRepo();
    const track = { videoId: 'v1', title: 'Song', channel: 'Artist', thumbnail: 'https://img.example.com/v1.jpg', duration: 200 };
    repo.add.mockResolvedValue(mockLike);

    const addLike = createAddLike(repo);
    const result = await addLike('user1', track);

    expect(result).toEqual(mockLike);
    expect(repo.add).toHaveBeenCalledWith('user1', track);
  });

  it('propagates errors from repository', async () => {
    const repo = createMockLikeRepo();
    repo.add.mockRejectedValue(new Error('Duplicate'));

    const addLike = createAddLike(repo);
    await expect(addLike('user1', { videoId: 'v1', title: 'Song', channel: 'Artist', thumbnail: '', duration: 200 }))
      .rejects.toThrow('Duplicate');
  });
});

describe('createRemoveLike', () => {
  it('removes a like and returns true', async () => {
    const repo = createMockLikeRepo();
    repo.remove.mockResolvedValue(true);

    const removeLike = createRemoveLike(repo);
    const result = await removeLike('user1', 'v1');

    expect(result).toBe(true);
    expect(repo.remove).toHaveBeenCalledWith('user1', 'v1');
  });

  it('returns false when like not found', async () => {
    const repo = createMockLikeRepo();
    repo.remove.mockResolvedValue(false);

    const removeLike = createRemoveLike(repo);
    const result = await removeLike('user1', 'nonexistent');

    expect(result).toBe(false);
  });

  it('propagates errors from repository', async () => {
    const repo = createMockLikeRepo();
    repo.remove.mockRejectedValue(new Error('DB error'));

    const removeLike = createRemoveLike(repo);
    await expect(removeLike('user1', 'v1')).rejects.toThrow('DB error');
  });
});

describe('createCheckLike', () => {
  it('returns liked: true when liked', async () => {
    const repo = createMockLikeRepo();
    repo.isLiked.mockResolvedValue(true);

    const checkLike = createCheckLike(repo);
    const result = await checkLike('user1', 'v1');

    expect(result).toEqual({ videoId: 'v1', liked: true });
    expect(repo.isLiked).toHaveBeenCalledWith('user1', 'v1');
  });

  it('returns liked: false when not liked', async () => {
    const repo = createMockLikeRepo();
    repo.isLiked.mockResolvedValue(false);

    const checkLike = createCheckLike(repo);
    const result = await checkLike('user1', 'v1');

    expect(result).toEqual({ videoId: 'v1', liked: false });
  });

  it('propagates errors from repository', async () => {
    const repo = createMockLikeRepo();
    repo.isLiked.mockRejectedValue(new Error('DB error'));

    const checkLike = createCheckLike(repo);
    await expect(checkLike('user1', 'v1')).rejects.toThrow('DB error');
  });
});
