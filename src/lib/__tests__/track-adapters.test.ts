import { describe, it, expect } from 'vitest';
import {
  searchResultToAudio,
  likeToAudio,
  historyToAudio,
  playlistTrackToAudio,
  channelVideoToAudio,
  toAudio,
  flatTrackToAudio,
} from '@/lib/track-adapters';
import type { SearchResultAudio, Like, HistoryItem, PlaylistTrack, ChannelVideo } from '@/types';

describe('searchResultToAudio', () => {
  it('maps SearchResultAudio to Audio', () => {
    const input: SearchResultAudio = {
      id: 'abc123',
      title: 'Test Song',
      thumbnail: 'https://img.test/thumb.jpg',
      duration: 240,
      channel: { name: 'Artist', thumbnail: 'https://img.test/ch.jpg' },
    };

    const result = searchResultToAudio(input);

    expect(result).toEqual({
      id: 'abc123',
      type: 'video',
      title: 'Test Song',
      description: '',
      duration: 240,
      viewCount: 0,
      thumbnail: 'https://img.test/thumb.jpg',
      channel: { name: 'Artist', thumbnail: 'https://img.test/ch.jpg' },
    });
  });

  it('handles missing channel thumbnail', () => {
    const input: SearchResultAudio = {
      id: 'abc',
      title: 'Song',
      thumbnail: 'thumb',
      duration: 100,
      channel: { name: 'Artist' },
    };

    const result = searchResultToAudio(input);
    expect(result.channel.thumbnail).toBeUndefined();
  });
});

describe('likeToAudio', () => {
  it('maps Like to Audio with flat channel', () => {
    const input: Like = {
      videoId: 'v1',
      title: 'Liked Song',
      channel: 'Artist Name',
      thumbnail: 'thumb.jpg',
      duration: 200,
      likedAt: '2025-01-01',
    };

    const result = likeToAudio(input);

    expect(result).toEqual({
      id: 'v1',
      type: 'video',
      title: 'Liked Song',
      description: '',
      duration: 200,
      viewCount: 0,
      thumbnail: 'thumb.jpg',
      channel: { name: 'Artist Name' },
    });
  });
});

describe('historyToAudio', () => {
  it('maps HistoryItem to Audio', () => {
    const input: HistoryItem = {
      id: 1,
      videoId: 'h1',
      title: 'History Song',
      channel: 'Channel',
      thumbnail: 'hthumb.jpg',
      duration: 180,
      playedAt: '2025-06-01',
    };

    const result = historyToAudio(input);

    expect(result.id).toBe('h1');
    expect(result.channel.name).toBe('Channel');
  });
});

describe('playlistTrackToAudio', () => {
  it('maps PlaylistTrack to Audio', () => {
    const input: PlaylistTrack = {
      id: 5,
      videoId: 'pt1',
      title: 'Playlist Song',
      channel: 'PC',
      thumbnail: 'pt.jpg',
      duration: 220,
      sortOrder: 0,
      addedAt: '2025-01-01',
    };

    const result = playlistTrackToAudio(input);

    expect(result.id).toBe('pt1');
    expect(result.title).toBe('Playlist Song');
  });
});

describe('channelVideoToAudio', () => {
  it('maps ChannelVideo to Audio', () => {
    const input: ChannelVideo = {
      id: 'cv1',
      title: 'Channel Vid',
      thumbnail: 'cv.jpg',
      duration: 300,
      channel: { name: 'CH', thumbnail: 'ch.jpg' },
    };

    const result = channelVideoToAudio(input);

    expect(result).toEqual({
      id: 'cv1',
      type: 'video',
      title: 'Channel Vid',
      description: '',
      duration: 300,
      viewCount: 0,
      thumbnail: 'cv.jpg',
      channel: { name: 'CH', thumbnail: 'ch.jpg' },
    });
  });
});

describe('toAudio', () => {
  it('routes SearchResultAudio correctly', () => {
    const track: SearchResultAudio = {
      id: 'sr1',
      title: 'Search Result',
      thumbnail: 'sr.jpg',
      duration: 200,
      channel: { name: 'Artist' },
    };

    const result = toAudio(track);
    expect(result.id).toBe('sr1');
    expect(result.channel.name).toBe('Artist');
  });

  it('routes HistoryItem correctly', () => {
    const track: HistoryItem = {
      id: 1,
      videoId: 'h1',
      title: 'History',
      channel: 'CH',
      thumbnail: 'h.jpg',
      duration: 100,
      playedAt: '2025-01-01',
    };

    const result = toAudio(track);
    expect(result.id).toBe('h1');
  });

  it('routes Like correctly', () => {
    const track: Like = {
      videoId: 'l1',
      title: 'Like',
      channel: 'CH',
      thumbnail: 'l.jpg',
      duration: 100,
      likedAt: '2025-01-01',
    };

    const result = toAudio(track);
    expect(result.id).toBe('l1');
  });

  it('routes PlaylistTrack correctly', () => {
    const track: PlaylistTrack = {
      id: 1,
      videoId: 'p1',
      title: 'Playlist',
      channel: 'CH',
      thumbnail: 'p.jpg',
      duration: 100,
      sortOrder: 0,
      addedAt: '2025-01-01',
    };

    const result = toAudio(track);
    expect(result.id).toBe('p1');
  });
});

describe('flatTrackToAudio', () => {
  it('maps flat track source to Audio', () => {
    const result = flatTrackToAudio({
      id: 'flat1',
      title: 'Flat Song',
      channel: 'Flat Artist',
      thumbnail: 'flat.jpg',
      duration: 150,
    });

    expect(result).toEqual({
      id: 'flat1',
      type: 'video',
      title: 'Flat Song',
      description: '',
      duration: 150,
      viewCount: 0,
      thumbnail: 'flat.jpg',
      channel: { name: 'Flat Artist' },
    });
  });
});
