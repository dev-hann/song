// @vitest-environment node
import { describe, it, expect, vi } from 'vitest';
import { createGetFollowedChannels, createGetChannel, createFollowChannel, createUnfollowChannel } from '../channels';
import type { FollowedChannel, ChannelInfo } from '@/types';

function createMockChannelRepo() {
  return {
    getFollowed: vi.fn(),
    follow: vi.fn(),
    unfollow: vi.fn(),
    isFollowing: vi.fn(),
  };
}

function createMockYouTube() {
  return {
    search: vi.fn(),
    getInfo: vi.fn(),
    getStreamUrl: vi.fn(),
    getRelated: vi.fn(),
    getChannel: vi.fn(),
    markMwebFailed: vi.fn(),
    searchTracks: vi.fn(),
  };
}

const mockFollowedChannel: FollowedChannel = {
  channelId: 'ch1',
  channelName: 'Artist Channel',
  channelThumbnail: 'https://img.example.com/ch1.jpg',
  subscriberCount: '1.2M',
  followedAt: '2024-01-01T00:00:00Z',
};

const mockChannelInfo: ChannelInfo = {
  id: 'ch1',
  name: 'Artist Channel',
  thumbnail: 'https://img.example.com/ch1.jpg',
  subscriberCount: '1.2M',
  following: false,
  videos: [],
};

describe('createGetFollowedChannels', () => {
  it('returns all followed channels', async () => {
    const repo = createMockChannelRepo();
    repo.getFollowed.mockResolvedValue([mockFollowedChannel]);

    const getFollowed = createGetFollowedChannels(repo);
    const result = await getFollowed('user1');

    expect(result).toEqual([mockFollowedChannel]);
    expect(repo.getFollowed).toHaveBeenCalledWith('user1');
  });

  it('returns empty array when not following any channels', async () => {
    const repo = createMockChannelRepo();
    repo.getFollowed.mockResolvedValue([]);

    const getFollowed = createGetFollowedChannels(repo);
    const result = await getFollowed('user1');

    expect(result).toEqual([]);
  });

  it('propagates errors from repository', async () => {
    const repo = createMockChannelRepo();
    repo.getFollowed.mockRejectedValue(new Error('DB error'));

    const getFollowed = createGetFollowedChannels(repo);
    await expect(getFollowed('user1')).rejects.toThrow('DB error');
  });
});

describe('createGetChannel', () => {
  it('returns channel info with following: true when user follows', async () => {
    const channelRepo = createMockChannelRepo();
    const youtube = createMockYouTube();
    youtube.getChannel.mockResolvedValue(mockChannelInfo);
    channelRepo.isFollowing.mockResolvedValue(true);

    const getChannel = createGetChannel(channelRepo, youtube);
    const result = await getChannel('user1', 'ch1');

    expect(result).toEqual({ ...mockChannelInfo, following: true });
    expect(youtube.getChannel).toHaveBeenCalledWith('ch1');
    expect(channelRepo.isFollowing).toHaveBeenCalledWith('user1', 'ch1');
  });

  it('returns channel info with following: false when user does not follow', async () => {
    const channelRepo = createMockChannelRepo();
    const youtube = createMockYouTube();
    youtube.getChannel.mockResolvedValue(mockChannelInfo);
    channelRepo.isFollowing.mockResolvedValue(false);

    const getChannel = createGetChannel(channelRepo, youtube);
    const result = await getChannel('user1', 'ch1');

    expect(result.following).toBe(false);
  });

  it('returns following: false when userId is empty', async () => {
    const channelRepo = createMockChannelRepo();
    const youtube = createMockYouTube();
    youtube.getChannel.mockResolvedValue(mockChannelInfo);

    const getChannel = createGetChannel(channelRepo, youtube);
    const result = await getChannel('', 'ch1');

    expect(result.following).toBe(false);
    expect(channelRepo.isFollowing).not.toHaveBeenCalled();
  });

  it('propagates errors from youtube provider', async () => {
    const channelRepo = createMockChannelRepo();
    const youtube = createMockYouTube();
    youtube.getChannel.mockRejectedValue(new Error('Not found'));

    const getChannel = createGetChannel(channelRepo, youtube);
    await expect(getChannel('user1', 'ch1')).rejects.toThrow('Not found');
  });
});

describe('createFollowChannel', () => {
  it('follows a channel', async () => {
    const repo = createMockChannelRepo();
    repo.follow.mockResolvedValue(mockFollowedChannel);
    const channel = { channelId: 'ch1', channelName: 'Artist', channelThumbnail: 'https://img.example.com/ch1.jpg' };

    const follow = createFollowChannel(repo);
    const result = await follow('user1', channel);

    expect(result).toEqual(mockFollowedChannel);
    expect(repo.follow).toHaveBeenCalledWith('user1', channel);
  });

  it('follows with optional subscriberCount', async () => {
    const repo = createMockChannelRepo();
    repo.follow.mockResolvedValue(mockFollowedChannel);
    const channel = { channelId: 'ch1', channelName: 'Artist', channelThumbnail: '', subscriberCount: '1M' };

    const follow = createFollowChannel(repo);
    await follow('user1', channel);

    expect(repo.follow).toHaveBeenCalledWith('user1', channel);
  });

  it('propagates errors from repository', async () => {
    const repo = createMockChannelRepo();
    repo.follow.mockRejectedValue(new Error('DB error'));

    const follow = createFollowChannel(repo);
    await expect(follow('user1', { channelId: 'ch1', channelName: 'A', channelThumbnail: '' }))
      .rejects.toThrow('DB error');
  });
});

describe('createUnfollowChannel', () => {
  it('unfollows a channel and returns true', async () => {
    const repo = createMockChannelRepo();
    repo.unfollow.mockResolvedValue(true);

    const unfollow = createUnfollowChannel(repo);
    const result = await unfollow('user1', 'ch1');

    expect(result).toBe(true);
    expect(repo.unfollow).toHaveBeenCalledWith('user1', 'ch1');
  });

  it('returns false when channel not followed', async () => {
    const repo = createMockChannelRepo();
    repo.unfollow.mockResolvedValue(false);

    const unfollow = createUnfollowChannel(repo);
    const result = await unfollow('user1', 'nonexistent');

    expect(result).toBe(false);
  });

  it('propagates errors from repository', async () => {
    const repo = createMockChannelRepo();
    repo.unfollow.mockRejectedValue(new Error('DB error'));

    const unfollow = createUnfollowChannel(repo);
    await expect(unfollow('user1', 'ch1')).rejects.toThrow('DB error');
  });
});
