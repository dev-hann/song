import { toSearchResultAudio, toSearchResponse } from '../../src/models/search.js';

describe('toSearchResultAudio', () => {
  it('returns null for invalid data (empty object)', () => {
    expect(toSearchResultAudio({})).toBeNull();
  });

  it('returns null for non-audio content (duration below 30)', () => {
    const item = {
      id: 'vid1',
      title: 'Short',
      duration: { seconds: 10 },
    };
    expect(toSearchResultAudio(item)).toBeNull();
  });

  it('returns null for non-audio content (duration above 900)', () => {
    const item = {
      id: 'vid2',
      title: 'Long',
      duration: { seconds: 1000 },
    };
    expect(toSearchResultAudio(item)).toBeNull();
  });

  it('returns correct SearchResultAudio for valid video item', () => {
    const item = {
      id: 'vid3',
      title: 'Valid Song',
      thumbnails: [{ url: 'https://img.test/thumb.jpg' }],
      duration: { seconds: 200 },
      author: {
        name: 'Artist',
        thumbnails: [{ url: 'https://img.test/ch.jpg' }],
      },
    };
    const result = toSearchResultAudio(item);
    expect(result).toEqual({
      id: 'vid3',
      title: 'Valid Song',
      thumbnail: 'https://img.test/thumb.jpg',
      duration: 200,
      channel: {
        name: 'Artist',
        thumbnail: 'https://img.test/ch.jpg',
      },
    });
  });

  it('handles object id and object title (id falls through to empty)', () => {
    const item = {
      id: { video_id: 'objId' },
      title: { text: 'Object Title' },
      duration: { seconds: 60 },
    };
    const result = toSearchResultAudio(item);
    expect(result).not.toBeNull();
    expect(result!.id).toBe('');
    expect(result!.title).toBe('Object Title');
  });
});

describe('toSearchResponse', () => {
  it('returns empty response for null', () => {
    const result = toSearchResponse(null, 'test');
    expect(result).toEqual({ query: 'test', results: [], has_continuation: false });
  });

  it('returns empty response for undefined', () => {
    const result = toSearchResponse(undefined, 'test');
    expect(result).toEqual({ query: 'test', results: [], has_continuation: false });
  });

  it('returns empty response for object without results', () => {
    const result = toSearchResponse({ videos: [] }, 'test');
    expect(result).toEqual({ query: 'test', results: [], has_continuation: false });
  });

  it('maps valid results and filters out nulls', () => {
    const ytSearch = {
      results: [
        { id: 'a', title: 'Valid', duration: { seconds: 60 } },
        { id: 'b', title: 'Too Short', duration: { seconds: 5 } },
        { id: 'c', title: 'Also Valid', duration: { seconds: 120 } },
      ],
    };
    const result = toSearchResponse(ytSearch, 'query');
    expect(result.query).toBe('query');
    expect(result.results).toHaveLength(2);
    expect(result.results[0].id).toBe('a');
    expect(result.results[1].id).toBe('c');
  });
});
