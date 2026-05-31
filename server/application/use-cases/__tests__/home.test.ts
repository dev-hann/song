// @vitest-environment node
import { describe, it, expect, vi } from 'vitest';
import { createGetHomeData } from '../home';
import type { MelonChartItem, HistoryItem, Like, FollowedChannel } from '@/types';

function createMockMelon() {
  return {
    getChart: vi.fn(),
    getAllGenreArtists: vi.fn(),
  };
}

function createMockHistoryRepo() {
  return {
    getRecent: vi.fn(),
    add: vi.fn(),
    clear: vi.fn(),
  };
}

function createMockLikeRepo() {
  return {
    getAll: vi.fn(),
    add: vi.fn(),
    remove: vi.fn(),
    isLiked: vi.fn(),
    getLikedVideoIds: vi.fn(),
  };
}

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

function makeChartItem(rank: number): MelonChartItem {
  return { rank, title: `Song ${rank}`, artist: 'Artist', album: 'Album', albumArt: '' };
}

function makeHistoryItem(id: number): HistoryItem {
  return { id, videoId: `h${id}`, title: `History ${id}`, channel: 'Artist', thumbnail: '', duration: 200, playedAt: '2024-01-01' };
}

const mockLike: Like = { videoId: 'v1', title: 'Song', channel: 'Artist', thumbnail: '', duration: 200, likedAt: '2024-01-01' };
const mockFollowed: FollowedChannel = { channelId: 'ch1', channelName: 'Artist', channelThumbnail: '', subscriberCount: '1M', followedAt: '2024-01-01' };

describe('createGetHomeData', () => {
  it('returns full home data', async () => {
    const melon = createMockMelon();
    const historyRepo = createMockHistoryRepo();
    const likeRepo = createMockLikeRepo();
    const channelRepo = createMockChannelRepo();
    const youtube = createMockYouTube();

    const chart = [1, 2, 3].map(makeChartItem);
    melon.getChart.mockResolvedValue(chart);
    historyRepo.getRecent.mockResolvedValue([makeHistoryItem(1)]);
    likeRepo.getAll.mockResolvedValue([mockLike]);
    channelRepo.getFollowed.mockResolvedValue([]);
    youtube.search.mockResolvedValue({ results: [] });

    const getHome = createGetHomeData(melon, historyRepo, likeRepo, channelRepo, youtube);
    const result = await getHome('user1');

    expect(result.chart).toHaveLength(3);
    expect(result.hot100).toHaveLength(3);
    expect(result.dailyChart).toHaveLength(3);
    expect(result.recent).toHaveLength(1);
    expect(result.likesCount).toBe(1);
    expect(melon.getChart).toHaveBeenCalledWith('realtime');
    expect(melon.getChart).toHaveBeenCalledWith('hot100');
    expect(melon.getChart).toHaveBeenCalledWith('daily');
  });

  it('slices chart arrays to 5 items', async () => {
    const melon = createMockMelon();
    const historyRepo = createMockHistoryRepo();
    const likeRepo = createMockLikeRepo();
    const channelRepo = createMockChannelRepo();
    const youtube = createMockYouTube();

    const bigChart = Array.from({ length: 10 }, (_, i) => makeChartItem(i + 1));
    melon.getChart.mockResolvedValue(bigChart);
    historyRepo.getRecent.mockResolvedValue([]);
    likeRepo.getAll.mockResolvedValue([]);
    channelRepo.getFollowed.mockResolvedValue([]);

    const getHome = createGetHomeData(melon, historyRepo, likeRepo, channelRepo, youtube);
    const result = await getHome('user1');

    expect(result.chart).toHaveLength(5);
    expect(result.hot100).toHaveLength(5);
    expect(result.dailyChart).toHaveLength(5);
  });

  it('fetches recent history with limit 6', async () => {
    const melon = createMockMelon();
    const historyRepo = createMockHistoryRepo();
    const likeRepo = createMockLikeRepo();
    const channelRepo = createMockChannelRepo();
    const youtube = createMockYouTube();

    melon.getChart.mockResolvedValue([]);
    historyRepo.getRecent.mockResolvedValue([]);
    likeRepo.getAll.mockResolvedValue([]);
    channelRepo.getFollowed.mockResolvedValue([]);

    const getHome = createGetHomeData(melon, historyRepo, likeRepo, channelRepo, youtube);
    await getHome('user1');

    expect(historyRepo.getRecent).toHaveBeenCalledWith('user1', 6);
  });

  it('returns likesCount as number', async () => {
    const melon = createMockMelon();
    const historyRepo = createMockHistoryRepo();
    const likeRepo = createMockLikeRepo();
    const channelRepo = createMockChannelRepo();
    const youtube = createMockYouTube();

    melon.getChart.mockResolvedValue([]);
    historyRepo.getRecent.mockResolvedValue([]);
    likeRepo.getAll.mockResolvedValue([mockLike, { ...mockLike, videoId: 'v2' }]);
    channelRepo.getFollowed.mockResolvedValue([]);

    const getHome = createGetHomeData(melon, historyRepo, likeRepo, channelRepo, youtube);
    const result = await getHome('user1');

    expect(result.likesCount).toBe(2);
  });

  it('omits recommendations when both arrays are empty', async () => {
    const melon = createMockMelon();
    const historyRepo = createMockHistoryRepo();
    const likeRepo = createMockLikeRepo();
    const channelRepo = createMockChannelRepo();
    const youtube = createMockYouTube();

    melon.getChart.mockResolvedValue([]);
    historyRepo.getRecent.mockResolvedValue([]);
    likeRepo.getAll.mockResolvedValue([]);
    channelRepo.getFollowed.mockResolvedValue([]);

    const getHome = createGetHomeData(melon, historyRepo, likeRepo, channelRepo, youtube);
    const result = await getHome('user1');

    expect(result.recommendations).toBeUndefined();
  });

  it('includes recommendations when fromChannels has results', async () => {
    const melon = createMockMelon();
    const historyRepo = createMockHistoryRepo();
    const likeRepo = createMockLikeRepo();
    const channelRepo = createMockChannelRepo();
    const youtube = createMockYouTube();

    melon.getChart.mockResolvedValue([]);
    historyRepo.getRecent.mockResolvedValue([]);
    likeRepo.getAll.mockResolvedValue([{ ...mockLike, channel: 'Artist A' }]);
    channelRepo.getFollowed.mockResolvedValue([]);

    youtube.search.mockResolvedValue({
      results: [{ id: 'r1', title: 'Rec', thumbnail: '', duration: 200, channel: { name: 'Artist A' } }],
    });

    const getHome = createGetHomeData(melon, historyRepo, likeRepo, channelRepo, youtube);
    const result = await getHome('user1');

    expect(result.recommendations).toBeDefined();
    expect(result.recommendations!.fromChannels.length).toBeGreaterThan(0);
  });

  it('handles melon chart failure gracefully', async () => {
    const melon = createMockMelon();
    const historyRepo = createMockHistoryRepo();
    const likeRepo = createMockLikeRepo();
    const channelRepo = createMockChannelRepo();
    const youtube = createMockYouTube();

    melon.getChart.mockRejectedValue(new Error('Melon down'));
    historyRepo.getRecent.mockResolvedValue([]);
    likeRepo.getAll.mockResolvedValue([]);
    channelRepo.getFollowed.mockResolvedValue([]);

    const getHome = createGetHomeData(melon, historyRepo, likeRepo, channelRepo, youtube);
    const result = await getHome('user1');

    expect(result.chart).toEqual([]);
    expect(result.hot100).toEqual([]);
    expect(result.dailyChart).toEqual([]);
  });

  it('handles recommendations failure gracefully', async () => {
    const melon = createMockMelon();
    const historyRepo = createMockHistoryRepo();
    const likeRepo = createMockLikeRepo();
    const channelRepo = createMockChannelRepo();
    const youtube = createMockYouTube();

    melon.getChart.mockResolvedValue([]);
    historyRepo.getRecent.mockResolvedValue([]);
    likeRepo.getAll.mockResolvedValue([]);
    channelRepo.getFollowed.mockRejectedValue(new Error('fail'));

    const getHome = createGetHomeData(melon, historyRepo, likeRepo, channelRepo, youtube);
    const result = await getHome('user1');

    expect(result.recommendations).toBeUndefined();
  });

  it('returns zero likesCount when no likes', async () => {
    const melon = createMockMelon();
    const historyRepo = createMockHistoryRepo();
    const likeRepo = createMockLikeRepo();
    const channelRepo = createMockChannelRepo();
    const youtube = createMockYouTube();

    melon.getChart.mockResolvedValue([]);
    historyRepo.getRecent.mockResolvedValue([]);
    likeRepo.getAll.mockResolvedValue([]);
    channelRepo.getFollowed.mockResolvedValue([]);

    const getHome = createGetHomeData(melon, historyRepo, likeRepo, channelRepo, youtube);
    const result = await getHome('user1');

    expect(result.likesCount).toBe(0);
  });
});
