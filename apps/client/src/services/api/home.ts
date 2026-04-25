import type { HomeResponse } from '@/types';
import { apiFetch } from '@/lib/api-client';

export async function fetchHomeData(): Promise<HomeResponse> {
  const res = await apiFetch('/api/home');
  if (!res.ok) throw new Error('Failed to fetch home data');
  return res.json();
}
