import { useAudioStreamQuery } from '@/queries';
import type { StreamUrlResponse } from '@/types';

interface UseAudioStreamOptions {
  enabled?: boolean;
}

export function useAudioStream(audioId: string | null, options: UseAudioStreamOptions = {}) {
  const { enabled = true } = options;

  const query = useAudioStreamQuery(enabled ? audioId : null);

  return {
    ...query,
    data: query.data as StreamUrlResponse | undefined,
    error: query.error,
  };
}
