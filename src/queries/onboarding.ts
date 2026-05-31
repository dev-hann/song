import { queryKeys } from './keys';
import { STALE_TIME } from './options';
import { fetchOnboardingStatus, fetchOnboardingGenres } from '@/services/api/onboarding';
import { useQuery } from '@tanstack/react-query';

export function useOnboardingStatus() {
  return useQuery({
    queryKey: queryKeys.onboarding.status(),
    queryFn: fetchOnboardingStatus,
    staleTime: 0,
    refetchOnWindowFocus: false,
  });
}

export function useOnboardingGenres() {
  return useQuery({
    queryKey: queryKeys.onboarding.genres(),
    queryFn: fetchOnboardingGenres,
    staleTime: STALE_TIME.MELON,
    refetchOnWindowFocus: false,
  });
}
