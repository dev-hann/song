import type { HistoryItem } from '@/types';
import { apiFetch } from '@/lib/api-client';

export async function fetchHistory(limit = 100): Promise<HistoryItem[]> {
  const res = await apiFetch(`/api/history?limit=${limit}`);
  if (!res.ok) throw new Error('Failed to fetch history');
  return res.json();
}

export async function addToHistory(track: {
  video_id: string;
  title: string;
  channel: string;
  thumbnail: string;
  duration: number;
}): Promise<void> {
  const res = await apiFetch('/api/history', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(track),
  });
  if (!res.ok) throw new Error('Failed to add to history');
}

export async function clearHistory(): Promise<void> {
  const res = await apiFetch('/api/history', { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to clear history');
}
