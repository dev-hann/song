'use client';

import { useAudioInfoQuery } from '@/queries';
import type { ExtendedAudio } from '@/types';

interface UseAudioInfoOptions {
  enabled?: boolean;
}

/**
 * Custom hook for fetching audio information by ID.
 * Uses TanStack Query Query Layer for API state management with caching.
 *
 * @param audioId - The YouTube audio ID to fetch information for
 * @param options - Query options like enabled flag
 * @returns Query result with audio data, status, and error
 */
export function useAudioInfo(audioId: string | null, options: UseAudioInfoOptions = {}) {
  const { enabled = true } = options;

  const query = useAudioInfoQuery(enabled ? audioId : null);

  return {
    ...query,
    data: query.data,
    error: query.error,
  };
}
