import type { HistoryItem } from '@/types';
import { apiFetch } from '@/lib/api-client';

export async function fetchHistory(limit = 100): Promise<HistoryItem[]> {
  return apiFetch<HistoryItem[]>(`/api/history?limit=${limit}`);
}

export async function addToHistory(track: {
  videoId: string;
  title: string;
  channel: string;
  thumbnail: string;
  duration: number;
}): Promise<void> {
  await apiFetch('/api/history', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(track),
  });
}

export async function clearHistory(): Promise<void> {
  await apiFetch('/api/history', { method: 'DELETE' });
}
