import type { Like, LikeCheckResponse } from '@/types';
import { apiFetch } from '@/lib/api-client';

export async function fetchLikes(): Promise<Like[]> {
  return apiFetch<Like[]>('/api/likes');
}

export async function addLike(track: {
  videoId: string;
  title: string;
  channel: string;
  thumbnail: string;
  duration: number;
}): Promise<Like> {
  return apiFetch<Like>('/api/likes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(track),
  });
}

export async function removeLike(videoId: string): Promise<void> {
  await apiFetch(`/api/likes/${videoId}`, { method: 'DELETE' });
}

export async function checkLike(videoId: string): Promise<LikeCheckResponse> {
  return apiFetch<LikeCheckResponse>(`/api/likes/check/${videoId}`);
}
