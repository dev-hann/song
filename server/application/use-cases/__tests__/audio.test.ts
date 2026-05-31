// @vitest-environment node
import { describe, it, expect, vi } from 'vitest';
import { createSearchYouTube, createGetAudioInfo, createGetStreamUrl } from '../audio';
import type { ExtendedAudio } from '@/types';

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

const mockExtendedAudio: ExtendedAudio = {
  id: 'v1',
  type: 'video',
  title: 'Song',
  description: 'A song',
  duration: 200,
  viewCount: 1000,
  thumbnail: 'https://img.example.com/v1.jpg',
  channel: { id: 'ch1', name: 'Artist', thumbnail: 'https://img.example.com/ch1.jpg' },
};

describe('createSearchYouTube', () => {
  it('returns search results', async () => {
    const youtube = createMockYouTube();
    const searchResults = { results: [mockExtendedAudio], has_continuation: false };
    youtube.search.mockResolvedValue(searchResults);

    const search = createSearchYouTube(youtube);
    const result = await search('test query');

    expect(result).toEqual(searchResults);
    expect(youtube.search).toHaveBeenCalledWith('test query');
  });

  it('returns empty results', async () => {
    const youtube = createMockYouTube();
    youtube.search.mockResolvedValue({ results: [], has_continuation: false });

    const search = createSearchYouTube(youtube);
    const result = await search('no results');

    expect(result.results).toEqual([]);
  });

  it('propagates errors from provider', async () => {
    const youtube = createMockYouTube();
    youtube.search.mockRejectedValue(new Error('API error'));

    const search = createSearchYouTube(youtube);
    await expect(search('test')).rejects.toThrow('API error');
  });
});

describe('createGetAudioInfo', () => {
  it('returns extended audio info', async () => {
    const youtube = createMockYouTube();
    youtube.getInfo.mockResolvedValue(mockExtendedAudio);

    const getInfo = createGetAudioInfo(youtube);
    const result = await getInfo('v1');

    expect(result).toEqual(mockExtendedAudio);
    expect(youtube.getInfo).toHaveBeenCalledWith('v1');
  });

  it('propagates errors from provider', async () => {
    const youtube = createMockYouTube();
    youtube.getInfo.mockRejectedValue(new Error('Not found'));

    const getInfo = createGetAudioInfo(youtube);
    await expect(getInfo('nonexistent')).rejects.toThrow('Not found');
  });
});

describe('createGetStreamUrl', () => {
  it('returns stream url result', async () => {
    const youtube = createMockYouTube();
    const streamResult = { url: 'https://stream.example.com/audio', mime_type: 'audio/webm' };
    youtube.getStreamUrl.mockResolvedValue(streamResult);

    const getStreamUrl = createGetStreamUrl(youtube);
    const result = await getStreamUrl('v1');

    expect(result).toEqual(streamResult);
    expect(youtube.getStreamUrl).toHaveBeenCalledWith('v1');
  });

  it('propagates errors from provider', async () => {
    const youtube = createMockYouTube();
    youtube.getStreamUrl.mockRejectedValue(new Error('Stream unavailable'));

    const getStreamUrl = createGetStreamUrl(youtube);
    await expect(getStreamUrl('v1')).rejects.toThrow('Stream unavailable');
  });
});
