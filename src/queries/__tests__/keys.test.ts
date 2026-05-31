import { describe, it, expect } from 'vitest';
import { queryKeys } from '../keys';

describe('queryKeys', () => {
  it('has "song" as the root key', () => {
    expect(queryKeys.all).toEqual(['song']);
  });

  describe('youtube.search', () => {
    it('contains the search query', () => {
      const key = queryKeys.youtube.search.query('BTS');

      expect(key).toContain('BTS');
    });
  });

  describe('youtube.audio', () => {
    it('contains "info" and the id', () => {
      const key = queryKeys.youtube.audio.info('abc');

      expect(key).toContain('info');
      expect(key).toContain('abc');
    });
  });

  describe('playlists', () => {
    it('contains "playlists" and the id', () => {
      const key = queryKeys.playlists.detail('123');

      expect(key).toContain('playlists');
      expect(key).toContain('123');
    });
  });

  describe('likes', () => {
    it('contains "check" and the videoId', () => {
      const key = queryKeys.likes.check('vid1');

      expect(key).toContain('check');
      expect(key).toContain('vid1');
    });
  });

  it('all keys start with "song"', () => {
    const keys = [
      queryKeys.youtube.search.query('BTS'),
      queryKeys.youtube.audio.info('abc'),
      queryKeys.playlists.detail('123'),
      queryKeys.likes.check('vid1'),
    ];

    for (const key of keys) {
      expect(key[0]).toBe('song');
    }
  });
});
