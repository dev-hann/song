import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from './keys';
import { fetchChannel, fetchFollowedChannels, followChannel, unfollowChannel } from '@/services/api';

export function useChannel(channelId: string | null) {
  return useQuery({
    queryKey: queryKeys.channels.detail(channelId || ''),
    queryFn: () => fetchChannel(channelId!),
    enabled: !!channelId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useFollowedChannels() {
  return useQuery({
    queryKey: queryKeys.channels.followed(),
    queryFn: fetchFollowedChannels,
    staleTime: 30 * 1000,
  });
}

export function useFollowChannel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: followChannel,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.channels.followed() });
    },
  });
}

export function useUnfollowChannel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: unfollowChannel,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.channels.followed() });
    },
  });
}
