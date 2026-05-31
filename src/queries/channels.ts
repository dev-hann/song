import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from './keys';
import { STALE_TIME } from './options';
import { fetchChannel, fetchFollowedChannels, followChannel, unfollowChannel } from '@/services/api';

export function useChannel(channelId: string | null) {
  return useQuery({
    queryKey: queryKeys.channels.detail(channelId ?? ''),
    queryFn: () => {
      if (!channelId) { throw new Error('No channel ID'); }
      return fetchChannel(channelId);
    },
    enabled: !!channelId,
    staleTime: STALE_TIME.CHANNELS,
    refetchOnWindowFocus: false,
    retry: 1,
  });
}

export function useFollowedChannels() {
  return useQuery({
    queryKey: queryKeys.channels.followed(),
    queryFn: fetchFollowedChannels,
    staleTime: STALE_TIME.CHANNELS,
    refetchOnWindowFocus: false,
    retry: 1,
  });
}

export function useFollowChannel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: followChannel,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.channels.followed() }),
  });
}

export function useUnfollowChannel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: unfollowChannel,
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.channels.followed() }),
  });
}
