import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { ExtendedAudio } from '@/types';
import type { StreamUrlResponse } from '@/types';
import { queryKeys } from './keys';
import { queryOptions } from './options';
import { fetchAudioInfo, fetchAudioStream } from '@/services/api';

export function useAudioInfoQuery(id: string | null) {
  return useQuery({
    queryKey: queryKeys.audio.info(id || ''),
    queryFn: () => fetchAudioInfo(id!),
    enabled: !!id,
    ...queryOptions.audioInfo,
  });
}

export function useAudioStreamQuery(id: string | null) {
  return useQuery({
    queryKey: queryKeys.audio.stream(id || ''),
    queryFn: () => fetchAudioStream(id!),
    enabled: !!id,
    ...queryOptions.audioStream,
  });
}

export function useLikeMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => {
      return Promise.resolve();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.audio.all(),
      });
    },
  });
}
