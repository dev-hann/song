import type { IHistoryRepository } from '@/server/domain/ports/repositories';
import type { HistoryItem } from '@/types';

export function createGetHistory(repo: IHistoryRepository) {
  return (userId: string, limit?: number): Promise<HistoryItem[]> =>
    repo.getRecent(userId, limit);
}

export function createAddHistory(repo: IHistoryRepository) {
  return (userId: string, track: { videoId: string; title: string; channel: string; thumbnail: string; duration: number }): Promise<void> =>
    repo.add(userId, track);
}

export function createClearHistory(repo: IHistoryRepository) {
  return (userId: string): Promise<void> =>
    repo.clear(userId);
}

export function createNeedsOnboarding(
  historyRepo: IHistoryRepository,
  likeRepo: { getRecent: IHistoryRepository['getRecent']; getAll: (userId: string) => Promise<unknown[]> },
) {
  return async (userId: string): Promise<boolean> => {
    const [history, likes] = await Promise.all([
      historyRepo.getRecent(userId, 1),
      likeRepo.getAll(userId),
    ]);
    return history.length === 0 && likes.length === 0;
  };
}
