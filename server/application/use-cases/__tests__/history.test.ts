// @vitest-environment node
import { describe, it, expect, vi } from 'vitest';
import { createGetHistory, createAddHistory, createClearHistory, createNeedsOnboarding } from '../history';
import type { HistoryItem, Like } from '@/types';

function createMockHistoryRepo() {
  return {
    getRecent: vi.fn(),
    add: vi.fn(),
    clear: vi.fn(),
  };
}

function createMockLikeRepo() {
  return {
    getRecent: vi.fn(),
    getAll: vi.fn(),
  };
}

const mockHistoryItem: HistoryItem = {
  id: 1,
  videoId: 'v1',
  title: 'Song',
  channel: 'Artist',
  thumbnail: 'https://img.example.com/v1.jpg',
  duration: 200,
  playedAt: '2024-01-01T00:00:00Z',
};

const mockLike: Like = {
  videoId: 'v1',
  title: 'Song',
  channel: 'Artist',
  thumbnail: 'https://img.example.com/v1.jpg',
  duration: 200,
  likedAt: '2024-01-01T00:00:00Z',
};

describe('createGetHistory', () => {
  it('returns recent history for a user', async () => {
    const repo = createMockHistoryRepo();
    const items = [mockHistoryItem];
    repo.getRecent.mockResolvedValue(items);

    const getHistory = createGetHistory(repo);
    const result = await getHistory('user1');

    expect(result).toEqual(items);
    expect(repo.getRecent).toHaveBeenCalledWith('user1', undefined);
  });

  it('passes limit to repository', async () => {
    const repo = createMockHistoryRepo();
    repo.getRecent.mockResolvedValue([]);

    const getHistory = createGetHistory(repo);
    await getHistory('user1', 10);

    expect(repo.getRecent).toHaveBeenCalledWith('user1', 10);
  });

  it('returns empty array when no history', async () => {
    const repo = createMockHistoryRepo();
    repo.getRecent.mockResolvedValue([]);

    const getHistory = createGetHistory(repo);
    const result = await getHistory('user1');

    expect(result).toEqual([]);
  });

  it('propagates errors from repository', async () => {
    const repo = createMockHistoryRepo();
    repo.getRecent.mockRejectedValue(new Error('DB error'));

    const getHistory = createGetHistory(repo);
    await expect(getHistory('user1')).rejects.toThrow('DB error');
  });
});

describe('createAddHistory', () => {
  it('adds a history entry', async () => {
    const repo = createMockHistoryRepo();
    repo.add.mockResolvedValue(undefined);

    const addHistory = createAddHistory(repo);
    const track = { videoId: 'v1', title: 'Song', channel: 'Artist', thumbnail: '', duration: 200 };
    await addHistory('user1', track);

    expect(repo.add).toHaveBeenCalledWith('user1', track);
  });

  it('propagates errors from repository', async () => {
    const repo = createMockHistoryRepo();
    repo.add.mockRejectedValue(new Error('DB error'));

    const addHistory = createAddHistory(repo);
    await expect(addHistory('user1', { videoId: 'v1', title: 'Song', channel: 'Artist', thumbnail: '', duration: 200 }))
      .rejects.toThrow('DB error');
  });
});

describe('createClearHistory', () => {
  it('clears history for a user', async () => {
    const repo = createMockHistoryRepo();
    repo.clear.mockResolvedValue(undefined);

    const clearHistory = createClearHistory(repo);
    await clearHistory('user1');

    expect(repo.clear).toHaveBeenCalledWith('user1');
  });

  it('propagates errors from repository', async () => {
    const repo = createMockHistoryRepo();
    repo.clear.mockRejectedValue(new Error('DB error'));

    const clearHistory = createClearHistory(repo);
    await expect(clearHistory('user1')).rejects.toThrow('DB error');
  });
});

describe('createNeedsOnboarding', () => {
  it('returns true when no history and no likes', async () => {
    const historyRepo = createMockHistoryRepo();
    const likeRepo = createMockLikeRepo();
    historyRepo.getRecent.mockResolvedValue([]);
    likeRepo.getAll.mockResolvedValue([]);

    const needsOnboarding = createNeedsOnboarding(historyRepo, likeRepo);
    const result = await needsOnboarding('user1');

    expect(result).toBe(true);
  });

  it('returns false when user has history', async () => {
    const historyRepo = createMockHistoryRepo();
    const likeRepo = createMockLikeRepo();
    historyRepo.getRecent.mockResolvedValue([mockHistoryItem]);
    likeRepo.getAll.mockResolvedValue([]);

    const needsOnboarding = createNeedsOnboarding(historyRepo, likeRepo);
    const result = await needsOnboarding('user1');

    expect(result).toBe(false);
  });

  it('returns false when user has likes', async () => {
    const historyRepo = createMockHistoryRepo();
    const likeRepo = createMockLikeRepo();
    historyRepo.getRecent.mockResolvedValue([]);
    likeRepo.getAll.mockResolvedValue([mockLike]);

    const needsOnboarding = createNeedsOnboarding(historyRepo, likeRepo);
    const result = await needsOnboarding('user1');

    expect(result).toBe(false);
  });

  it('returns false when user has both history and likes', async () => {
    const historyRepo = createMockHistoryRepo();
    const likeRepo = createMockLikeRepo();
    historyRepo.getRecent.mockResolvedValue([mockHistoryItem]);
    likeRepo.getAll.mockResolvedValue([mockLike]);

    const needsOnboarding = createNeedsOnboarding(historyRepo, likeRepo);
    const result = await needsOnboarding('user1');

    expect(result).toBe(false);
  });

  it('fetches history with limit 1', async () => {
    const historyRepo = createMockHistoryRepo();
    const likeRepo = createMockLikeRepo();
    historyRepo.getRecent.mockResolvedValue([]);
    likeRepo.getAll.mockResolvedValue([]);

    const needsOnboarding = createNeedsOnboarding(historyRepo, likeRepo);
    await needsOnboarding('user1');

    expect(historyRepo.getRecent).toHaveBeenCalledWith('user1', 1);
  });
});
