import { useQuery } from '@tanstack/react-query';
import { queryKeys } from './keys';
import { STALE_TIME } from './options';
import { fetchAudioInfo } from '@/services/api';

export function useAudioInfoQuery(id: string | null) {
  return useQuery({
    queryKey: queryKeys.youtube.audio.info(id ?? ''),
    queryFn: () => fetchAudioInfo(id ?? ''),
    enabled: !!id,
    staleTime: STALE_TIME.AUDIO_INFO,
    refetchOnWindowFocus: false,
    retry: 1,
  });
}
