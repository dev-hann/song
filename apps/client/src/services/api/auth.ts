import { apiFetch } from '@/lib/api-client';
import type { AuthResponse } from '@/types';

export async function verifyCredential(credential: string): Promise<AuthResponse> {
  const response = await apiFetch('/api/auth/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ credential }),
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.error || '인증에 실패했습니다.');
  }

  return response.json();
}
