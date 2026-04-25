import type { ChannelInfo, FollowedChannel } from '@/types';
import { apiFetch } from '@/lib/api-client';

export async function fetchChannel(channelId: string): Promise<ChannelInfo> {
  const res = await apiFetch(`/api/channels/${channelId}`);
  if (!res.ok) throw new Error('Failed to fetch channel');
  return res.json();
}

export async function fetchFollowedChannels(): Promise<FollowedChannel[]> {
  const res = await apiFetch('/api/channels/followed');
  if (!res.ok) throw new Error('Failed to fetch followed channels');
  return res.json();
}

export async function followChannel(data: {
  channel_id: string;
  channel_name: string;
  channel_thumbnail?: string;
  subscriber_count?: string;
}): Promise<FollowedChannel> {
  const res = await apiFetch(`/api/channels/${data.channel_id}/follow`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error('Failed to follow channel');
  return res.json();
}

export async function unfollowChannel(channelId: string): Promise<void> {
  const res = await apiFetch(`/api/channels/${channelId}/follow`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to unfollow channel');
}
