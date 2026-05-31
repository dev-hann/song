import type { ChannelInfo, FollowedChannel } from '@/types';
import { apiFetch } from '@/lib/api-client';

export async function fetchChannel(channelId: string): Promise<ChannelInfo> {
  return apiFetch<ChannelInfo>(`/api/channels/${channelId}`);
}

export async function fetchFollowedChannels(): Promise<FollowedChannel[]> {
  return apiFetch<FollowedChannel[]>('/api/channels/followed');
}

export async function followChannel(data: {
  channelId: string;
  channelName: string;
  channelThumbnail?: string;
  subscriberCount?: string;
}): Promise<FollowedChannel> {
  return apiFetch<FollowedChannel>(`/api/channels/${data.channelId}/follow`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export async function unfollowChannel(channelId: string): Promise<void> {
  await apiFetch(`/api/channels/${channelId}/follow`, { method: 'DELETE' });
}
