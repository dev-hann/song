// @vitest-environment node
import { describe, it, expect, vi } from 'vitest';
import { createGetOnboardingStatus, createGetOnboardingGenres, createCompleteOnboarding } from '../onboarding';
import type { SearchResultAudio } from '@/types';

function createMockUserRepo() {
  return {
    findByEmail: vi.fn(),
    findById: vi.fn(),
    create: vi.fn(),
    updateLastLogin: vi.fn(),
    markOnboardingCompleted: vi.fn(),
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

function createMockMelon() {
  return {
    getChart: vi.fn(),
    getAllGenreArtists: vi.fn(),
  };
}

function makeSearchResult(id: string): SearchResultAudio {
  return { id, title: `Song ${id}`, thumbnail: '', duration: 200, channel: { name: 'Artist', thumbnail: 'https://img.example.com/art.jpg' } };
}

describe('createGetOnboardingStatus', () => {
  it('returns true when user has not completed onboarding', async () => {
    const userRepo = createMockUserRepo();
    userRepo.findById.mockResolvedValue({ id: 'user1', onboardingCompleted: false });

    const getStatus = createGetOnboardingStatus(userRepo);
    const result = await getStatus('user1');

    expect(result).toBe(true);
  });

  it('returns false when user has completed onboarding', async () => {
    const userRepo = createMockUserRepo();
    userRepo.findById.mockResolvedValue({ id: 'user1', onboardingCompleted: true });

    const getStatus = createGetOnboardingStatus(userRepo);
    const result = await getStatus('user1');

    expect(result).toBe(false);
  });

  it('returns true when user not found', async () => {
    const userRepo = createMockUserRepo();
    userRepo.findById.mockResolvedValue(undefined);

    const getStatus = createGetOnboardingStatus(userRepo);
    const result = await getStatus('user1');

    expect(result).toBe(true);
  });

  it('propagates errors from repository', async () => {
    const userRepo = createMockUserRepo();
    userRepo.findById.mockRejectedValue(new Error('DB error'));

    const getStatus = createGetOnboardingStatus(userRepo);
    await expect(getStatus('user1')).rejects.toThrow('DB error');
  });
});

describe('createGetOnboardingGenres', () => {
  it('returns genres from melon provider', async () => {
    const melon = createMockMelon();
    const genres = [{ id: '1', name: 'Pop', artists: [{ name: 'Artist A', albumArt: '' }] }];
    melon.getAllGenreArtists.mockResolvedValue(genres);

    const getGenres = createGetOnboardingGenres(melon);
    const result = await getGenres();

    expect(result).toEqual(genres);
    expect(melon.getAllGenreArtists).toHaveBeenCalled();
  });

  it('propagates errors from provider', async () => {
    const melon = createMockMelon();
    melon.getAllGenreArtists.mockRejectedValue(new Error('Melon error'));

    const getGenres = createGetOnboardingGenres(melon);
    await expect(getGenres()).rejects.toThrow('Melon error');
  });
});

describe('createCompleteOnboarding', () => {
  it('marks onboarding completed with empty artists (skip)', async () => {
    const likeRepo = createMockLikeRepo();
    const channelRepo = createMockChannelRepo();
    const youtube = createMockYouTube();
    const userRepo = createMockUserRepo();

    const complete = createCompleteOnboarding(likeRepo, channelRepo, youtube, userRepo);
    await complete('user1', []);

    expect(youtube.searchTracks).not.toHaveBeenCalled();
    expect(likeRepo.add).not.toHaveBeenCalled();
    expect(userRepo.markOnboardingCompleted).toHaveBeenCalledWith('user1');
  });

  it('seeds tracks and follows channel for each artist', async () => {
    const likeRepo = createMockLikeRepo();
    const channelRepo = createMockChannelRepo();
    const youtube = createMockYouTube();
    const userRepo = createMockUserRepo();

    const tracks = [makeSearchResult('t1'), makeSearchResult('t2'), makeSearchResult('t3')];
    youtube.searchTracks.mockResolvedValue(tracks);
    likeRepo.add.mockResolvedValue({} as never);
    channelRepo.follow.mockResolvedValue({} as never);

    const complete = createCompleteOnboarding(likeRepo, channelRepo, youtube, userRepo);
    await complete('user1', ['Artist A']);

    expect(youtube.searchTracks).toHaveBeenCalledWith('Artist A', 3);
    expect(likeRepo.add).toHaveBeenCalledTimes(3);
    expect(channelRepo.follow).toHaveBeenCalledTimes(1);
    expect(userRepo.markOnboardingCompleted).toHaveBeenCalledWith('user1');
  });

  it('passes limit 3 to searchTracks', async () => {
    const likeRepo = createMockLikeRepo();
    const channelRepo = createMockChannelRepo();
    const youtube = createMockYouTube();
    const userRepo = createMockUserRepo();

    const tracks = [1, 2, 3].map((i) => makeSearchResult(`t${i}`));
    youtube.searchTracks.mockResolvedValue(tracks);
    likeRepo.add.mockResolvedValue({} as never);
    channelRepo.follow.mockResolvedValue({} as never);

    const complete = createCompleteOnboarding(likeRepo, channelRepo, youtube, userRepo);
    await complete('user1', ['Artist A']);

    expect(youtube.searchTracks).toHaveBeenCalledWith('Artist A', 3);
  });

  it('follows channel only when tracks exist', async () => {
    const likeRepo = createMockLikeRepo();
    const channelRepo = createMockChannelRepo();
    const youtube = createMockYouTube();
    const userRepo = createMockUserRepo();

    youtube.searchTracks.mockResolvedValue([]);

    const complete = createCompleteOnboarding(likeRepo, channelRepo, youtube, userRepo);
    await complete('user1', ['Unknown Artist']);

    expect(likeRepo.add).not.toHaveBeenCalled();
    expect(channelRepo.follow).not.toHaveBeenCalled();
    expect(userRepo.markOnboardingCompleted).toHaveBeenCalledWith('user1');
  });

  it('processes multiple artists in parallel', async () => {
    const likeRepo = createMockLikeRepo();
    const channelRepo = createMockChannelRepo();
    const youtube = createMockYouTube();
    const userRepo = createMockUserRepo();

    youtube.searchTracks.mockResolvedValue([makeSearchResult('t1'), makeSearchResult('t2'), makeSearchResult('t3')]);
    likeRepo.add.mockResolvedValue({} as never);
    channelRepo.follow.mockResolvedValue({} as never);

    const complete = createCompleteOnboarding(likeRepo, channelRepo, youtube, userRepo);
    await complete('user1', ['Artist A', 'Artist B']);

    expect(youtube.searchTracks).toHaveBeenCalledTimes(2);
    expect(likeRepo.add).toHaveBeenCalledTimes(6);
    expect(channelRepo.follow).toHaveBeenCalledTimes(2);
  });

  it('passes correct track fields to likeRepo.add', async () => {
    const likeRepo = createMockLikeRepo();
    const channelRepo = createMockChannelRepo();
    const youtube = createMockYouTube();
    const userRepo = createMockUserRepo();

    const track = makeSearchResult('t1');
    youtube.searchTracks.mockResolvedValue([track]);
    likeRepo.add.mockResolvedValue({} as never);
    channelRepo.follow.mockResolvedValue({} as never);

    const complete = createCompleteOnboarding(likeRepo, channelRepo, youtube, userRepo);
    await complete('user1', ['Artist A']);

    expect(likeRepo.add).toHaveBeenCalledWith('user1', {
      videoId: 't1',
      title: 'Song t1',
      channel: 'Artist',
      thumbnail: '',
      duration: 200,
    });
  });

  it('follows channel with onboarding_ prefix on channelId', async () => {
    const likeRepo = createMockLikeRepo();
    const channelRepo = createMockChannelRepo();
    const youtube = createMockYouTube();
    const userRepo = createMockUserRepo();

    const track = { ...makeSearchResult('t1'), channel: { name: 'MyArtist', thumbnail: 'https://img.example.com/art.jpg' } };
    youtube.searchTracks.mockResolvedValue([track]);
    likeRepo.add.mockResolvedValue({} as never);
    channelRepo.follow.mockResolvedValue({} as never);

    const complete = createCompleteOnboarding(likeRepo, channelRepo, youtube, userRepo);
    await complete('user1', ['MyArtist']);

    expect(channelRepo.follow).toHaveBeenCalledWith('user1', {
      channelId: 'onboarding_MyArtist',
      channelName: 'MyArtist',
      channelThumbnail: 'https://img.example.com/art.jpg',
    });
  });
});
