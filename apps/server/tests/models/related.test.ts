import { toRelatedAudio, extractRelatedVideos } from '../../src/models/related.js';

describe('toRelatedAudio', () => {
  it('returns null for invalid data', () => {
    expect(toRelatedAudio({})).toBeNull();
    expect(toRelatedAudio(null)).toBeNull();
    expect(toRelatedAudio(42)).toBeNull();
  });

  it('returns null for missing id or title', () => {
    const noId = { title: 'Hello', duration: { seconds: 60 } };
    expect(toRelatedAudio(noId)).toBeNull();

    const noTitle = { id: 'abc', duration: { seconds: 60 } };
    expect(toRelatedAudio(noTitle)).toBeNull();
  });

  it('returns null for non-audio content', () => {
    const short = { id: 'a', title: 'Short', duration: { seconds: 10 } };
    expect(toRelatedAudio(short)).toBeNull();

    const long = { id: 'b', title: 'Long', duration: { seconds: 2000 } };
    expect(toRelatedAudio(long)).toBeNull();
  });

  it('returns correct SearchResultAudio for valid item', () => {
    const item = {
      id: 'rel1',
      title: 'Related Song',
      thumbnails: [{ url: 'https://img.test/thumb.jpg' }],
      duration: { seconds: 180 },
      author: {
        name: 'Artist',
        thumbnails: [{ url: 'https://img.test/ch.jpg' }],
      },
    };
    const result = toRelatedAudio(item);
    expect(result).toEqual({
      id: 'rel1',
      title: 'Related Song',
      thumbnail: 'https://img.test/thumb.jpg',
      duration: 180,
      channel: {
        name: 'Artist',
        thumbnail: 'https://img.test/ch.jpg',
      },
    });
  });
});

describe('extractRelatedVideos', () => {
  const validItem = (id: string) => ({
    id,
    title: `Song ${id}`,
    duration: { seconds: 120 },
  });

  it('returns empty results for non-array feed', () => {
    expect(extractRelatedVideos(null, 'v1')).toEqual({ videoId: 'v1', results: [] });
    expect(extractRelatedVideos({}, 'v1')).toEqual({ videoId: 'v1', results: [] });
    expect(extractRelatedVideos('string', 'v1')).toEqual({ videoId: 'v1', results: [] });
  });

  it('returns filtered results from valid feed', () => {
    const feed = [validItem('a'), validItem('b'), validItem('c')];
    const result = extractRelatedVideos(feed, 'v1');
    expect(result.videoId).toBe('v1');
    expect(result.results).toHaveLength(3);
  });

  it('excludes ids in excludeIds list', () => {
    const feed = [validItem('a'), validItem('b'), validItem('c')];
    const result = extractRelatedVideos(feed, 'v1', ['a', 'c']);
    expect(result.results).toHaveLength(1);
    expect(result.results[0].id).toBe('b');
  });

  it('respects limit parameter', () => {
    const feed = [validItem('a'), validItem('b'), validItem('c'), validItem('d')];
    const result = extractRelatedVideos(feed, 'v1', [], 2);
    expect(result.results).toHaveLength(2);
  });
});
