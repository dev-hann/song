// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';

const { chain, proxy } = vi.hoisted(() => {
  const chain: Record<string, ReturnType<typeof vi.fn>> = {};
  const proxy = new Proxy({}, {
    get(_, prop: string) {
      if (!chain[prop]) {
        chain[prop] = vi.fn().mockReturnValue(proxy);
      }
      return chain[prop];
    },
  });
  return { chain, proxy };
});

vi.mock('@/server/db', () => ({ db: proxy }));

vi.mock('@/server/db/schema', () => ({
  playHistory: {
    id: 'id', userId: 'userId', videoId: 'videoId', title: 'title',
    channel: 'channel', thumbnail: 'thumbnail', duration: 'duration', playedAt: 'playedAt',
  },
}));

const historyRow = {
  id: 1, userId: 'user1', videoId: 'v1', title: 'Song A',
  channel: 'Artist X', thumbnail: 'thumb.jpg', duration: 200,
  playedAt: '2024-01-01 00:00:00',
};

function initChain() {
  const methods = ['select', 'from', 'where', 'orderBy', 'limit', 'insert', 'values', 'update', 'set', 'delete'];
  for (const m of methods) {
    if (!chain[m]) {
      chain[m] = vi.fn().mockReturnValue(proxy);
    }
  }
}

beforeEach(() => {
  initChain();
  for (const key of Object.keys(chain)) {
    chain[key].mockClear();
    chain[key].mockReturnValue(proxy);
  }
});

describe('historyRepository', () => {
  it('getRecent — returns recent history items', async () => {
    chain.limit.mockResolvedValueOnce([historyRow]);
    const { historyRepository } = await import('../history.repository');
    const result = await historyRepository.getRecent('user1');
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      id: 1, videoId: 'v1', title: 'Song A', channel: 'Artist X',
      thumbnail: 'thumb.jpg', duration: 200, playedAt: '2024-01-01 00:00:00',
    });
  });

  it('getRecent — respects limit parameter', async () => {
    chain.limit.mockResolvedValueOnce([historyRow]);
    const { historyRepository } = await import('../history.repository');
    await historyRepository.getRecent('user1', 50);
    expect(chain.limit).toHaveBeenCalledWith(50);
  });

  it('getRecent — defaults limit to 100', async () => {
    chain.limit.mockResolvedValueOnce([]);
    const { historyRepository } = await import('../history.repository');
    await historyRepository.getRecent('user1');
    expect(chain.limit).toHaveBeenCalledWith(100);
  });

  it('getRecent — returns empty when no history', async () => {
    chain.limit.mockResolvedValueOnce([]);
    const { historyRepository } = await import('../history.repository');
    const result = await historyRepository.getRecent('user1');
    expect(result).toEqual([]);
  });

  it('add — inserts new track when no existing history', async () => {
    chain.limit.mockResolvedValueOnce([]);
    chain.values.mockResolvedValueOnce(undefined);
    chain.where
      .mockReturnValueOnce(proxy)
      .mockResolvedValueOnce([{ count: 1 }]);
    const { historyRepository } = await import('../history.repository');
    await historyRepository.add('user1', {
      videoId: 'v1', title: 'Song A', channel: 'Artist X',
      thumbnail: 'thumb.jpg', duration: 200,
    });
    expect(chain.insert).toHaveBeenCalled();
  });

  it('add — updates existing track playedAt', async () => {
    chain.limit.mockResolvedValueOnce([{ id: 5 }]);
    chain.update.mockReturnValueOnce({
      set: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue(undefined) }),
    });
    chain.where
      .mockReturnValueOnce(proxy)
      .mockResolvedValueOnce([{ count: 1 }]);
    const { historyRepository } = await import('../history.repository');
    await historyRepository.add('user1', {
      videoId: 'v1', title: 'Song A', channel: 'Artist X',
      thumbnail: 'thumb.jpg', duration: 200,
    });
    expect(chain.update).toHaveBeenCalled();
  });

  it('add — prunes history when count exceeds 200', async () => {
    chain.limit
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce(Array.from({ length: 100 }, (_, i) => ({ id: i + 1 })));
    chain.values.mockResolvedValueOnce(undefined);
    chain.where
      .mockReturnValueOnce(proxy)
      .mockResolvedValueOnce([{ count: 250 }])
      .mockReturnValueOnce(proxy)
      .mockResolvedValueOnce([{ count: 250 }]);
    chain.delete.mockReturnValueOnce({ where: vi.fn().mockResolvedValue(undefined) });
    const { historyRepository } = await import('../history.repository');
    await historyRepository.add('user1', {
      videoId: 'v1', title: 'Song A', channel: 'Artist X',
      thumbnail: 'thumb.jpg', duration: 200,
    });
    expect(chain.delete).toHaveBeenCalled();
  });

  it('clear — deletes all history for user', async () => {
    chain.delete.mockReturnValueOnce({ where: vi.fn().mockResolvedValue(undefined) });
    const { historyRepository } = await import('../history.repository');
    await historyRepository.clear('user1');
    expect(chain.delete).toHaveBeenCalled();
  });
});
