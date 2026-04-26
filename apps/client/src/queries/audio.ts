import { useQuery } from '@tanstack/react-query';
import type { ExtendedAudio, StreamUrlResponse } from '@/types';
import { queryKeys } from './keys';
import { queryOptions } from './options';
import { fetchAudioInfo, fetchAudioStream } from '@/services/api';

export function useAudioInfoQuery(id: string | null) {
  return useQuery({
    queryKey: queryKeys.youtube.audio.info(id || ''),
    queryFn: () => fetchAudioInfo(id!),
    enabled: !!id,
    ...queryOptions.audioInfo,
  });
}

export function useAudioStreamQuery(id: string | null) {
  return useQuery({
    queryKey: queryKeys.youtube.audio.stream(id || ''),
    queryFn: () => fetchAudioStream(id!),
    enabled: !!id,
    ...queryOptions.audioStream,
  });
}
