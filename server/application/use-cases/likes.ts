import type { ILikeRepository } from '@/server/domain/ports/repositories';
import type { Like } from '@/types';

export function createGetLikes(repo: ILikeRepository) {
  return (userId: string): Promise<Like[]> => repo.getAll(userId);
}

export function createAddLike(repo: ILikeRepository) {
  return (userId: string, track: { videoId: string; title: string; channel: string; thumbnail: string; duration: number }): Promise<Like> =>
    repo.add(userId, track);
}

export function createRemoveLike(repo: ILikeRepository) {
  return (userId: string, videoId: string): Promise<boolean> =>
    repo.remove(userId, videoId);
}

export function createCheckLike(repo: ILikeRepository) {
  return async (userId: string, videoId: string): Promise<{ videoId: string; liked: boolean }> => {
    const liked = await repo.isLiked(userId, videoId);
    return { videoId, liked };
  };
}
