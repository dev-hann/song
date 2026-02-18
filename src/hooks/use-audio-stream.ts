'use client';

import { useAudioStreamQuery } from '@/queries';
import type { StreamUrlResponse } from '@/types';

interface UseAudioStreamOptions {
  enabled?: boolean;
}

/**
 * Custom hook for fetching audio stream URL by ID.
 * Uses TanStack Query Query Layer for API state management with caching.
 *
 * @param audioId - The YouTube audio ID to fetch stream URL for
 * @param options - Query options like enabled flag
 * @returns Query result with stream URL, status, and error
 */
export function useAudioStream(audioId: string | null, options: UseAudioStreamOptions = {}) {
  const { enabled = true } = options;

  const query = useAudioStreamQuery(enabled ? audioId : null);

  return {
    ...query,
    data: query.data,
    error: query.error,
  };
}
