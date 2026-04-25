import { useAudioInfoQuery } from '@/queries';
import type { ExtendedAudio } from '@/types';

interface UseAudioInfoOptions {
  enabled?: boolean;
}

export function useAudioInfo(audioId: string | null, options: UseAudioInfoOptions = {}) {
  const { enabled = true } = options;

  const query = useAudioInfoQuery(enabled ? audioId : null);

  return {
    ...query,
    data: query.data as ExtendedAudio | undefined,
    error: query.error,
  };
}
