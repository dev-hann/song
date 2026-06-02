// @vitest-environment node
import { describe, it, expect, vi } from 'vitest';
import {
  createGetRelatedVideos,
  createGetRecommendationsFromChannels,
  createGetRecommendationsFromRecent,
  createGetPersonalizedRecommendations,
} from '../recommendations';
import type { Like, HistoryItem, FollowedChannel, SearchResultAudio } from '@/types';

function createMockLikeRepo() {
  return {
    getAll: vi.fn(),
    add: vi.fn(),
    remove: vi.fn(),
    isLiked: vi.fn(),
    getLikedVideoIds: vi.fn(),
  };
}

function createMockHistoryRepo() {
  return {
    getRecent: vi.fn(),
    add: vi.fn(),
    clear: vi.fn(),
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
    searchMore: vi.fn(),
    getInfo: vi.fn(),
    getStreamUrl: vi.fn(),
    getRelated: vi.fn(),
    getChannel: vi.fn(),
    getLyrics: vi.fn(),
    markMwebFailed: vi.fn(),
    searchTracks: vi.fn(),
  };
}

function createMockMelon() {
  return {
    getChart: vi.fn(),
  };
}

function makeSearchResult(id: string): SearchResultAudio {
  return { id, title: `Song ${id}`, thumbnail: '', duration: 200, channel: { name: 'Artist' } };
}

const mockLike: Like = { videoId: 'v1', title: 'Song', channel: 'Artist A', thumbnail: '', duration: 200, likedAt: '2024-01-01' };
const mockHistoryItem: HistoryItem = { id: 1, videoId: 'h1', title: 'History Song', channel: 'Artist B', thumbnail: '', duration: 200, playedAt: '2024-01-01' };
const mockFollowed: FollowedChannel = { channelId: 'ch1', channelName: 'Artist C', channelThumbnail: '', subscriberCount: '1M', followedAt: '2024-01-01' };

describe('createGetRelatedVideos', () => {
  it('returns related videos', async () => {
    const youtube = createMockYouTube();
    const results = [makeSearchResult('r1'), makeSearchResult('r2')];
    youtube.getRelated.mockResolvedValue({ videoId: 'v1', results });

    const getRelated = createGetRelatedVideos(youtube);
    const result = await getRelated('v1', [], 5);

    expect(result.results).toEqual(results);
    expect(youtube.getRelated).toHaveBeenCalledWith('v1', [], 5);
  });

  it('uses default excludeIds and limit', async () => {
    const youtube = createMockYouTube();
    youtube.getRelated.mockResolvedValue({ videoId: 'v1', results: [] });

    const getRelated = createGetRelatedVideos(youtube);
    await getRelated('v1');

    expect(youtube.getRelated).toHaveBeenCalledWith('v1', [], 5);
  });

  it('passes excludeIds and custom limit', async () => {
    const youtube = createMockYouTube();
    youtube.getRelated.mockResolvedValue({ videoId: 'v1', results: [] });

    const getRelated = createGetRelatedVideos(youtube);
    await getRelated('v1', ['ex1', 'ex2'], 10);

    expect(youtube.getRelated).toHaveBeenCalledWith('v1', ['ex1', 'ex2'], 10);
  });

  it('propagates errors from provider', async () => {
    const youtube = createMockYouTube();
    youtube.getRelated.mockRejectedValue(new Error('API error'));

    const getRelated = createGetRelatedVideos(youtube);
    await expect(getRelated('v1')).rejects.toThrow('API error');
  });
});

describe('createGetRecommendationsFromChannels', () => {
  it('returns recommendations from top channels and followed channels', async () => {
    const likeRepo = createMockLikeRepo();
    const historyRepo = createMockHistoryRepo();
    const channelRepo = createMockChannelRepo();
    const youtube = createMockYouTube();

    historyRepo.getRecent.mockResolvedValue([mockHistoryItem]);
    likeRepo.getAll.mockResolvedValue([mockLike]);
    channelRepo.getFollowed.mockResolvedValue([mockFollowed]);

    youtube.search.mockImplementation(async (query: string) => ({
      results: [makeSearchResult(`search_${query}_1`), makeSearchResult(`search_${query}_2`)],
    }));

    const getRecs = createGetRecommendationsFromChannels(likeRepo, historyRepo, channelRepo, youtube);
    const result = await getRecs('user1');

    expect(result.length).toBeGreaterThan(0);
    expect(result.length).toBeLessThanOrEqual(5);
    expect(youtube.search).toHaveBeenCalled();
  });

  it('returns empty array when no history, likes, or followed channels', async () => {
    const likeRepo = createMockLikeRepo();
    const historyRepo = createMockHistoryRepo();
    const channelRepo = createMockChannelRepo();
    const youtube = createMockYouTube();

    historyRepo.getRecent.mockResolvedValue([]);
    likeRepo.getAll.mockResolvedValue([]);
    channelRepo.getFollowed.mockResolvedValue([]);

    const getRecs = createGetRecommendationsFromChannels(likeRepo, historyRepo, channelRepo, youtube);
    const result = await getRecs('user1');

    expect(result).toEqual([]);
    expect(youtube.search).not.toHaveBeenCalled();
  });

  it('caps results at 5', async () => {
    const likeRepo = createMockLikeRepo();
    const historyRepo = createMockHistoryRepo();
    const channelRepo = createMockChannelRepo();
    const youtube = createMockYouTube();

    historyRepo.getRecent.mockResolvedValue([mockHistoryItem]);
    likeRepo.getAll.mockResolvedValue([]);
    channelRepo.getFollowed.mockResolvedValue([mockFollowed, { ...mockFollowed, channelName: 'Ch2' }]);

    youtube.search.mockResolvedValue({
      results: [makeSearchResult('a'), makeSearchResult('b'), makeSearchResult('c'), makeSearchResult('d'), makeSearchResult('e'), makeSearchResult('f')],
    });

    const getRecs = createGetRecommendationsFromChannels(likeRepo, historyRepo, channelRepo, youtube);
    const result = await getRecs('user1');

    expect(result.length).toBeLessThanOrEqual(5);
  });

  it('deduplicates results across searches', async () => {
    const likeRepo = createMockLikeRepo();
    const historyRepo = createMockHistoryRepo();
    const channelRepo = createMockChannelRepo();
    const youtube = createMockYouTube();

    historyRepo.getRecent.mockResolvedValue([mockHistoryItem]);
    likeRepo.getAll.mockResolvedValue([]);
    channelRepo.getFollowed.mockResolvedValue([mockFollowed]);

    const sharedResult = makeSearchResult('shared');
    youtube.search.mockResolvedValue({ results: [sharedResult, sharedResult] });

    const getRecs = createGetRecommendationsFromChannels(likeRepo, historyRepo, channelRepo, youtube);
    const result = await getRecs('user1');

    const ids = result.map((r) => r.id);
    expect(ids).toEqual([...new Set(ids)]);
  });

  it('skips items without id from search results', async () => {
    const likeRepo = createMockLikeRepo();
    const historyRepo = createMockHistoryRepo();
    const channelRepo = createMockChannelRepo();
    const youtube = createMockYouTube();

    historyRepo.getRecent.mockResolvedValue([mockHistoryItem]);
    likeRepo.getAll.mockResolvedValue([]);
    channelRepo.getFollowed.mockResolvedValue([]);

    youtube.search.mockResolvedValue({
      results: [{ notId: 'x' }, makeSearchResult('valid')],
    });

    const getRecs = createGetRecommendationsFromChannels(likeRepo, historyRepo, channelRepo, youtube);
    const result = await getRecs('user1');

    expect(result.every((r) => 'id' in r)).toBe(true);
  });

  it('continues when a search fails', async () => {
    const likeRepo = createMockLikeRepo();
    const historyRepo = createMockHistoryRepo();
    const channelRepo = createMockChannelRepo();
    const youtube = createMockYouTube();

    historyRepo.getRecent.mockResolvedValue([mockHistoryItem]);
    likeRepo.getAll.mockResolvedValue([]);
    channelRepo.getFollowed.mockResolvedValue([mockFollowed]);

    youtube.search
      .mockRejectedValueOnce(new Error('fail'))
      .mockResolvedValueOnce({ results: [makeSearchResult('ok')] });

    const getRecs = createGetRecommendationsFromChannels(likeRepo, historyRepo, channelRepo, youtube);
    const result = await getRecs('user1');

    expect(result.length).toBeGreaterThan(0);
  });

  it('skips items with empty channel name', async () => {
    const likeRepo = createMockLikeRepo();
    const historyRepo = createMockHistoryRepo();
    const channelRepo = createMockChannelRepo();
    const youtube = createMockYouTube();

    const itemNoChannel = { ...mockHistoryItem, channel: '' };
    historyRepo.getRecent.mockResolvedValue([itemNoChannel]);
    likeRepo.getAll.mockResolvedValue([{ ...mockLike, channel: '' }]);
    channelRepo.getFollowed.mockResolvedValue([]);

    const getRecs = createGetRecommendationsFromChannels(likeRepo, historyRepo, channelRepo, youtube);
    const result = await getRecs('user1');

    expect(result).toEqual([]);
    expect(youtube.search).not.toHaveBeenCalled();
  });
});

describe('createGetRecommendationsFromRecent', () => {
  it('returns recommendations based on recent history', async () => {
    const likeRepo = createMockLikeRepo();
    const historyRepo = createMockHistoryRepo();
    const youtube = createMockYouTube();

    historyRepo.getRecent.mockImplementation(async (_userId: string, limit?: number) => {
      if (limit === 3) return [mockHistoryItem];
      return [mockHistoryItem];
    });
    likeRepo.getAll.mockResolvedValue([]);

    const relatedResults = [makeSearchResult('r1'), makeSearchResult('r2')];
    youtube.getRelated.mockResolvedValue({ videoId: 'h1', results: relatedResults });

    const getRecs = createGetRecommendationsFromRecent(likeRepo, historyRepo, youtube);
    const result = await getRecs('user1');

    expect(result.length).toBeGreaterThan(0);
    expect(youtube.getRelated).toHaveBeenCalled();
  });

  it('returns empty array when no recent history', async () => {
    const likeRepo = createMockLikeRepo();
    const historyRepo = createMockHistoryRepo();
    const youtube = createMockYouTube();

    historyRepo.getRecent.mockResolvedValue([]);

    const getRecs = createGetRecommendationsFromRecent(likeRepo, historyRepo, youtube);
    const result = await getRecs('user1');

    expect(result).toEqual([]);
    expect(youtube.getRelated).not.toHaveBeenCalled();
  });

  it('excludes history and liked video IDs from results', async () => {
    const likeRepo = createMockLikeRepo();
    const historyRepo = createMockHistoryRepo();
    const youtube = createMockYouTube();

    historyRepo.getRecent.mockImplementation(async (_userId: string, limit?: number) => {
      if (limit === 3) return [mockHistoryItem];
      return [mockHistoryItem];
    });
    likeRepo.getAll.mockResolvedValue([mockLike]);

    youtube.getRelated.mockResolvedValue({ videoId: 'h1', results: [makeSearchResult('new1')] });

    const getRecs = createGetRecommendationsFromRecent(likeRepo, historyRepo, youtube);
    await getRecs('user1');

    const excludeIds = youtube.getRelated.mock.calls[0][1] as string[];
    expect(excludeIds).toContain('h1');
    expect(excludeIds).toContain('v1');
  });

  it('caps results at 5', async () => {
    const likeRepo = createMockLikeRepo();
    const historyRepo = createMockHistoryRepo();
    const youtube = createMockYouTube();

    const historyItems = [1, 2, 3].map((i) => ({ ...mockHistoryItem, id: i, videoId: `h${i}` }));
    historyRepo.getRecent.mockResolvedValue(historyItems);
    likeRepo.getAll.mockResolvedValue([]);

    youtube.getRelated.mockResolvedValue({
      videoId: 'h1',
      results: [1, 2, 3, 4, 5, 6].map((i) => makeSearchResult(`r${i}`)),
    });

    const getRecs = createGetRecommendationsFromRecent(likeRepo, historyRepo, youtube);
    const result = await getRecs('user1');

    expect(result.length).toBeLessThanOrEqual(5);
  });

  it('continues when getRelated fails for one item', async () => {
    const likeRepo = createMockLikeRepo();
    const historyRepo = createMockHistoryRepo();
    const youtube = createMockYouTube();

    const items = [1, 2].map((i) => ({ ...mockHistoryItem, id: i, videoId: `h${i}` }));
    historyRepo.getRecent.mockResolvedValue(items);
    likeRepo.getAll.mockResolvedValue([]);

    youtube.getRelated
      .mockRejectedValueOnce(new Error('fail'))
      .mockResolvedValueOnce({ videoId: 'h2', results: [makeSearchResult('ok')] });

    const getRecs = createGetRecommendationsFromRecent(likeRepo, historyRepo, youtube);
    const result = await getRecs('user1');

    expect(result.length).toBe(1);
    expect(result[0].id).toBe('ok');
  });

  it('deduplicates across related calls', async () => {
    const likeRepo = createMockLikeRepo();
    const historyRepo = createMockHistoryRepo();
    const youtube = createMockYouTube();

    const items = [1, 2].map((i) => ({ ...mockHistoryItem, id: i, videoId: `h${i}` }));
    historyRepo.getRecent.mockResolvedValue(items);
    likeRepo.getAll.mockResolvedValue([]);

    const shared = makeSearchResult('dup');
    youtube.getRelated
      .mockResolvedValue({ videoId: 'h1', results: [shared] })
      .mockResolvedValue({ videoId: 'h2', results: [shared] });

    const getRecs = createGetRecommendationsFromRecent(likeRepo, historyRepo, youtube);
    const result = await getRecs('user1');

    const ids = result.map((r) => r.id);
    expect(ids).toEqual([...new Set(ids)]);
  });
});

describe('createGetPersonalizedRecommendations', () => {
  it('returns both channel and recent recommendations', async () => {
    const likeRepo = createMockLikeRepo();
    const historyRepo = createMockHistoryRepo();
    const channelRepo = createMockChannelRepo();
    const youtube = createMockYouTube();

    historyRepo.getRecent.mockResolvedValue([mockHistoryItem]);
    likeRepo.getAll.mockResolvedValue([mockLike]);
    channelRepo.getFollowed.mockResolvedValue([]);

    youtube.search.mockResolvedValue({ results: [makeSearchResult('ch1')] });
    youtube.getRelated.mockResolvedValue({ videoId: 'h1', results: [makeSearchResult('rec1')] });

    const getRecs = createGetPersonalizedRecommendations(likeRepo, historyRepo, channelRepo, youtube, createMockMelon());
    const result = await getRecs('user1');

    expect(result.fromChannels).toBeDefined();
    expect(result.fromRecent).toBeDefined();
  });

  it('returns empty arrays when all sources fail', async () => {
    const likeRepo = createMockLikeRepo();
    const historyRepo = createMockHistoryRepo();
    const channelRepo = createMockChannelRepo();
    const youtube = createMockYouTube();
    const melon = createMockMelon();

    historyRepo.getRecent.mockResolvedValue([]);
    likeRepo.getAll.mockResolvedValue([]);
    channelRepo.getFollowed.mockResolvedValue([]);
    melon.getChart.mockRejectedValue(new Error('fail'));

    const getRecs = createGetPersonalizedRecommendations(likeRepo, historyRepo, channelRepo, youtube, melon);
    const result = await getRecs('user1');

    expect(result).toEqual({ fromChannels: [], fromRecent: [], fromChart: [] });
  });

  it('handles partial failure gracefully', async () => {
    const likeRepo = createMockLikeRepo();
    const historyRepo = createMockHistoryRepo();
    const channelRepo = createMockChannelRepo();
    const youtube = createMockYouTube();

    historyRepo.getRecent.mockResolvedValue([]);
    likeRepo.getAll.mockResolvedValue([]);
    channelRepo.getFollowed.mockResolvedValue([]);

    const getRecs = createGetPersonalizedRecommendations(likeRepo, historyRepo, channelRepo, youtube, createMockMelon());
    const result = await getRecs('user1');

    expect(result.fromChannels).toEqual([]);
    expect(result.fromRecent).toEqual([]);
    expect(result.fromChart).toBeDefined();
  });

  it('falls back to chart recommendations for cold-start users', async () => {
    const likeRepo = createMockLikeRepo();
    const historyRepo = createMockHistoryRepo();
    const channelRepo = createMockChannelRepo();
    const youtube = createMockYouTube();
    const melon = createMockMelon();

    historyRepo.getRecent.mockResolvedValue([]);
    likeRepo.getAll.mockResolvedValue([]);
    channelRepo.getFollowed.mockResolvedValue([]);

    melon.getChart.mockResolvedValue([
      { rank: 1, title: 'Song 1', artist: 'IU', album: 'A', albumArt: '' },
      { rank: 2, title: 'Song 2', artist: 'BTS', album: 'B', albumArt: '' },
      { rank: 3, title: 'Song 3', artist: 'IU', album: 'C', albumArt: '' },
    ]);
    youtube.searchTracks.mockResolvedValue([makeSearchResult('chart1')]);

    const getRecs = createGetPersonalizedRecommendations(likeRepo, historyRepo, channelRepo, youtube, melon);
    const result = await getRecs('user1');

    expect(result.fromChannels).toEqual([]);
    expect(result.fromRecent).toEqual([]);
    expect(result.fromChart.length).toBeGreaterThan(0);
    expect(youtube.searchTracks).toHaveBeenCalledWith('IU official audio', 2);
  });
});
