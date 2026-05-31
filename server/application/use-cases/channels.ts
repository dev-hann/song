import type { IChannelRepository } from '@/server/domain/ports/repositories';
import type { FollowedChannel, ChannelInfo } from '@/types';
import type { IYouTubeProvider } from '@/server/domain/ports/providers';

export function createGetFollowedChannels(repo: IChannelRepository) {
  return (userId: string): Promise<FollowedChannel[]> => repo.getFollowed(userId);
}

export function createGetChannel(
  channelRepo: IChannelRepository,
  youtube: IYouTubeProvider,
) {
  return async (userId: string, channelId: string): Promise<ChannelInfo> => {
    const channel = await youtube.getChannel(channelId);
    const following = userId ? await channelRepo.isFollowing(userId, channelId) : false;
    return { ...channel, following };
  };
}

export function createFollowChannel(repo: IChannelRepository) {
  return (userId: string, channel: { channelId: string; channelName: string; channelThumbnail: string; subscriberCount?: string }): Promise<FollowedChannel> =>
    repo.follow(userId, channel);
}

export function createUnfollowChannel(repo: IChannelRepository) {
  return (userId: string, channelId: string): Promise<boolean> =>
    repo.unfollow(userId, channelId);
}
