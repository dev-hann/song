import type { OnboardingGenresResponse, OnboardingStatusResponse } from '@/types/onboarding';
import { apiFetch } from '@/lib/api-client';

export async function fetchOnboardingStatus(): Promise<OnboardingStatusResponse> {
  return apiFetch<OnboardingStatusResponse>('/api/onboarding/status');
}

export async function fetchOnboardingGenres(): Promise<OnboardingGenresResponse> {
  return apiFetch<OnboardingGenresResponse>('/api/onboarding/genres');
}

export async function completeOnboarding(artistNames: string[]): Promise<{ success: boolean }> {
  return apiFetch<{ success: boolean }>('/api/onboarding', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ artistNames }),
  });
}
