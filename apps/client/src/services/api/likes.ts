import type { Like, LikeCheckResponse } from '@/types';
import { apiFetch } from '@/lib/api-client';

export async function fetchLikes(): Promise<Like[]> {
  const res = await apiFetch('/api/likes');
  if (!res.ok) throw new Error('Failed to fetch likes');
  return res.json();
}

export async function addLike(track: {
  video_id: string;
  title: string;
  channel: string;
  thumbnail: string;
  duration: number;
}): Promise<Like> {
  const res = await apiFetch('/api/likes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(track),
  });
  if (!res.ok) throw new Error('Failed to add like');
  return res.json();
}

export async function removeLike(videoId: string): Promise<void> {
  const res = await apiFetch(`/api/likes/${videoId}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to remove like');
}

export async function checkLike(videoId: string): Promise<LikeCheckResponse> {
  const res = await apiFetch(`/api/likes/check/${videoId}`);
  if (!res.ok) throw new Error('Failed to check like');
  return res.json();
}
