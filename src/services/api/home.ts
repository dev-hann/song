import type { HomeResponse } from '@/types';
import { apiFetch } from '@/lib/api-client';

export async function fetchHomeData(): Promise<HomeResponse> {
  return apiFetch<HomeResponse>('/api/home');
}
