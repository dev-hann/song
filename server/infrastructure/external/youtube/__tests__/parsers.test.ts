// @vitest-environment node
import { describe, it, expect } from 'vitest';
import {
  parseBasicInfo,
  toSearchResultAudio,
  toSearchResponse,
  toRelatedAudio,
  extractRelatedVideos,
  parseChannelData,
} from '../parsers';

const legacyVideoItem = {
  type: 'Video',
  id: 'dQw4w9WgXcQ',
  title: 'Never Gonna Give You Up',
  thumbnails: [{ url: 'https://img.youtube.com/vi/dQw4w9WgXcQ/0.jpg' }],
  duration: { seconds: 213 },
  author: {
    name: 'Rick Astley',
    thumbnails: [{ url: 'https://example.com/avatar.jpg' }],
  },
};

const lockupViewItem = {
  type: 'LockupView',
  content_id: 'abc123',
  metadata: {
    title: { text: 'Test Song' },
    metadata: {
      metadata_rows: [
        {
          metadata_parts: [{ text: { text: 'Test Artist' } }],
        },
      ],
    },
  },
  content_image: {
    image: [{ url: 'https://example.com/thumb.jpg' }],
    overlays: [{ badges: [{ text: '3:30' }] }],
  },
};

const validBasicInfoResponse = {
  basic_info: {
    id: 'dQw4w9WgXcQ',
    title: 'Never Gonna Give You Up',
    short_description: 'The official video for "Never Gonna Give You Up"',
    duration: 213,
    view_count: 1400000000,
    upload_date: '2009-10-25',
    channel_id: 'UCuAXFkgsw1L7xaCfnd5JJOw',
    thumbnail: [{ url: 'https://img.youtube.com/vi/dQw4w9WgXcQ/maxres.jpg' }],
  },
  channel: {
    name: 'Rick Astley',
    id: 'UCuAXFkgsw1L7xaCfnd5JJOw',
    thumbnails: [{ url: 'https://example.com/rick-avatar.jpg' }],
  },
};

describe('parseBasicInfo', () => {
  it('parses valid YouTube response into ExtendedAudio', () => {
    const result = parseBasicInfo(validBasicInfoResponse);
    expect(result.id).toBe('dQw4w9WgXcQ');
    expect(result.type).toBe('video');
    expect(result.title).toBe('Never Gonna Give You Up');
    expect(result.description).toBe('The official video for "Never Gonna Give You Up"');
    expect(result.duration).toBe(213);
    expect(result.viewCount).toBe(1400000000);
    expect(result.published).toBe('2009-10-25');
    expect(result.thumbnail).toBe('https://img.youtube.com/vi/dQw4w9WgXcQ/maxres.jpg');
    expect(result.channel.id).toBe('UCuAXFkgsw1L7xaCfnd5JJOw');
    expect(result.channel.name).toBe('Rick Astley');
    expect(result.channel.thumbnail).toBe('https://example.com/rick-avatar.jpg');
    expect(result.uploadDate).toEqual(new Date('2009-10-25'));
  });

  it('handles missing optional channel', () => {
    const input = {
      basic_info: {
        id: 'abc',
        title: 'No Channel',
        short_description: 'Desc',
        duration: 120,
        view_count: 500,
        thumbnail: [{ url: 'https://example.com/thumb.jpg' }],
      },
    };
    const result = parseBasicInfo(input);
    expect(result.channel.name).toBe('');
    expect(result.channel.thumbnail).toBeUndefined();
    expect(result.uploadDate).toBeUndefined();
  });

  it('handles duration as object with seconds', () => {
    const input = {
      basic_info: {
        id: 'abc',
        title: 'Duration Object',
        short_description: 'Desc',
        duration: { seconds: 180 },
        view_count: 1000,
        thumbnail: [],
      },
    };
    const result = parseBasicInfo(input);
    expect(result.duration).toBe(180);
  });

  it('handles empty thumbnail array', () => {
    const input = {
      basic_info: {
        id: 'abc',
        title: 'No Thumb',
        short_description: 'Desc',
        duration: 60,
        view_count: 10,
        thumbnail: [],
      },
    };
    const result = parseBasicInfo(input);
    expect(result.thumbnail).toBe('');
  });

  it('throws on invalid input', () => {
    expect(() => parseBasicInfo({ basic_info: {} })).toThrow();
  });
});

describe('toSearchResultAudio', () => {
  it('converts a valid Video item to SearchResultAudio', () => {
    const result = toSearchResultAudio(legacyVideoItem);
    expect(result).toEqual({
      id: 'dQw4w9WgXcQ',
      title: 'Never Gonna Give You Up',
      thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/0.jpg',
      duration: 213,
      channel: {
        name: 'Rick Astley',
        thumbnail: 'https://example.com/avatar.jpg',
      },
    });
  });

  it('returns null for invalid items rejected by Zod', () => {
    expect(toSearchResultAudio({ foo: 'bar' })).toBeNull();
    expect(toSearchResultAudio(null)).toBeNull();
    expect(toSearchResultAudio(undefined)).toBeNull();
    expect(toSearchResultAudio('string')).toBeNull();
    expect(toSearchResultAudio(42)).toBeNull();
  });

  it('returns null for items without an id', () => {
    const noId = { title: 'No ID' };
    expect(toSearchResultAudio(noId)).toBeNull();
  });

  it('returns null for items with duration outside audio range (too short)', () => {
    const shortItem = {
      ...legacyVideoItem,
      duration: { seconds: 10 },
    };
    expect(toSearchResultAudio(shortItem)).toBeNull();
  });

  it('returns null for items with duration outside audio range (too long)', () => {
    const longItem = {
      ...legacyVideoItem,
      duration: { seconds: 960 },
    };
    expect(toSearchResultAudio(longItem)).toBeNull();
  });

  it('returns null for items with zero duration', () => {
    const zeroItem = {
      ...legacyVideoItem,
      duration: { seconds: 0 },
    };
    expect(toSearchResultAudio(zeroItem)).toBeNull();
  });

  it('returns null for live streams (no duration)', () => {
    const liveItem = {
      id: 'live123',
      title: 'Live Stream',
      thumbnails: [{ url: 'https://example.com/live.jpg' }],
      author: { name: 'Streamer' },
    };
    expect(toSearchResultAudio(liveItem)).toBeNull();
  });
});

describe('toSearchResponse', () => {
  it('maps valid search results', () => {
    const ytSearch = {
      results: [legacyVideoItem],
    };
    const response = toSearchResponse(ytSearch, 'rick astley');
    expect(response.query).toBe('rick astley');
    expect(response.results).toHaveLength(1);
    expect(response.results[0].id).toBe('dQw4w9WgXcQ');
    expect(response.has_continuation).toBe(false);
  });

  it('returns empty results for null input', () => {
    const response = toSearchResponse(null, 'test');
    expect(response.results).toEqual([]);
    expect(response.has_continuation).toBe(false);
  });

  it('returns empty results for non-object input', () => {
    expect(toSearchResponse('string', 'q').results).toEqual([]);
    expect(toSearchResponse(42, 'q').results).toEqual([]);
    expect(toSearchResponse(undefined, 'q').results).toEqual([]);
  });

  it('filters out invalid items from results array', () => {
    const ytSearch = {
      results: [
        legacyVideoItem,
        { foo: 'bar' },
        { type: 'Video', id: 'short', title: 'Short', duration: { seconds: 5 } },
      ],
    };
    const response = toSearchResponse(ytSearch, 'mixed');
    expect(response.results).toHaveLength(1);
    expect(response.results[0].id).toBe('dQw4w9WgXcQ');
  });

  it('handles missing results array', () => {
    const response = toSearchResponse({}, 'test');
    expect(response.results).toEqual([]);
  });
});

describe('extractFromLockupView (via toRelatedAudio)', () => {
  it('parses a LockupView item', () => {
    const result = toRelatedAudio(lockupViewItem);
    expect(result).toEqual({
      id: 'abc123',
      title: 'Test Song',
      thumbnail: 'https://example.com/thumb.jpg',
      duration: 210,
      channel: { name: 'Test Artist' },
    });
  });

  it('returns null for LockupView without content_id', () => {
    const noId = { ...lockupViewItem, content_id: undefined };
    expect(toRelatedAudio({ ...noId })).toBeNull();
  });

  it('returns null for LockupView without title', () => {
    const noTitle = {
      ...lockupViewItem,
      metadata: {
        title: { text: '' },
        metadata: { metadata_rows: [] },
      },
    };
    expect(toRelatedAudio(noTitle)).toBeNull();
  });

  it('returns null for LockupView with duration too long', () => {
    const longItem = {
      ...lockupViewItem,
      content_image: {
        ...lockupViewItem.content_image,
        overlays: [{ badges: [{ text: '20:00' }] }],
      },
    };
    expect(toRelatedAudio(longItem)).toBeNull();
  });

  it('handles LockupView with HH:MM:SS duration format', () => {
    const hhmmssItem = {
      ...lockupViewItem,
      content_image: {
        ...lockupViewItem.content_image,
        overlays: [{ badges: [{ text: '1:02:30' }] }],
      },
    };
    const result = toRelatedAudio(hhmmssItem);
    expect(result).toBeNull();
  });

  it('handles LockupView with zero duration (badge) — returns result with duration 0', () => {
    const noDuration = {
      ...lockupViewItem,
      content_image: {
        ...lockupViewItem.content_image,
        overlays: [{ badges: [{ text: '0:00' }] }],
      },
    };
    const result = toRelatedAudio(noDuration);
    expect(result).not.toBeNull();
    expect(result?.duration).toBe(0);
  });

  it('handles LockupView with no overlays', () => {
    const noOverlay = {
      ...lockupViewItem,
      content_image: {
        image: [{ url: 'https://example.com/thumb.jpg' }],
      },
    };
    const result = toRelatedAudio(noOverlay);
    expect(result).not.toBeNull();
    expect(result?.duration).toBe(0);
  });
});

describe('extractFromLegacyVideo (via toRelatedAudio)', () => {
  it('parses a legacy Video item', () => {
    const result = toRelatedAudio(legacyVideoItem);
    expect(result).toEqual({
      id: 'dQw4w9WgXcQ',
      title: 'Never Gonna Give You Up',
      thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/0.jpg',
      duration: 213,
      channel: { name: 'Rick Astley' },
    });
  });

  it('returns null for legacy item with invalid schema', () => {
    expect(toRelatedAudio({ type: 'Video', bad: 'data' })).toBeNull();
  });
});

describe('toRelatedAudio', () => {
  it('dispatches to LockupView parser for type=LockupView', () => {
    const result = toRelatedAudio(lockupViewItem);
    expect(result).not.toBeNull();
    expect(result?.id).toBe('abc123');
  });

  it('dispatches to legacy parser for type=Video', () => {
    const result = toRelatedAudio(legacyVideoItem);
    expect(result).not.toBeNull();
    expect(result?.id).toBe('dQw4w9WgXcQ');
  });

  it('dispatches to legacy parser for unknown type', () => {
    const unknownItem = {
      id: 'unknown123',
      title: 'Unknown Type',
      thumbnails: [{ url: 'https://example.com/thumb.jpg' }],
      duration: { seconds: 120 },
      author: { name: 'Artist' },
    };
    const result = toRelatedAudio(unknownItem);
    expect(result).not.toBeNull();
    expect(result?.id).toBe('unknown123');
  });

  it('returns null for null/undefined/non-object', () => {
    expect(toRelatedAudio(null)).toBeNull();
    expect(toRelatedAudio(undefined)).toBeNull();
    expect(toRelatedAudio('string')).toBeNull();
    expect(toRelatedAudio(42)).toBeNull();
  });
});

describe('extractRelatedVideos', () => {
  it('extracts and deduplicates related videos', () => {
    const item1 = { ...legacyVideoItem, id: 'video1' };
    const item2 = { ...legacyVideoItem, id: 'video2' };
    const duplicate = { ...legacyVideoItem, id: 'video1' };

    const { results } = extractRelatedVideos([item1, item2, duplicate], 'main');
    expect(results).toHaveLength(2);
    expect(results.map((r) => r.id)).toEqual(['video1', 'video2']);
  });

  it('respects the limit parameter', () => {
    const items = Array.from({ length: 10 }, (_, i) => ({
      ...legacyVideoItem,
      id: `video${i}`,
      title: `Song ${i}`,
    }));

    const { results } = extractRelatedVideos(items, 'main', [], 3);
    expect(results).toHaveLength(3);
  });

  it('excludes ids from excludeIds', () => {
    const item1 = { ...legacyVideoItem, id: 'excluded' };
    const item2 = { ...legacyVideoItem, id: 'included' };

    const { results } = extractRelatedVideos([item1, item2], 'main', ['excluded']);
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe('included');
  });

  it('returns empty array for non-array input', () => {
    const { results } = extractRelatedVideos('not array' as unknown as unknown[], 'main');
    expect(results).toEqual([]);
  });

  it('skips items that fail to parse', () => {
    const valid = { ...legacyVideoItem };
    const invalid = { bad: 'data' };

    const { results } = extractRelatedVideos([invalid, valid], 'main');
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe('dQw4w9WgXcQ');
  });

  it('skips items with duration outside audio range', () => {
    const shortItem = { ...legacyVideoItem, id: 'short', duration: { seconds: 10 } };
    const longItem = { ...legacyVideoItem, id: 'long', duration: { seconds: 1000 } };
    const validItem = { ...legacyVideoItem, id: 'valid' };

    const { results } = extractRelatedVideos([shortItem, longItem, validItem], 'main');
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe('valid');
  });

  it('includes the videoId in the response', () => {
    const { videoId } = extractRelatedVideos([], 'test-video-id');
    expect(videoId).toBe('test-video-id');
  });

  it('uses default limit of 5', () => {
    const items = Array.from({ length: 8 }, (_, i) => ({
      ...legacyVideoItem,
      id: `video${i}`,
      title: `Song ${i}`,
    }));

    const { results } = extractRelatedVideos(items, 'main');
    expect(results).toHaveLength(5);
  });
});

describe('parseChannelData', () => {
  const rawChannelWithVideos = {
    metadata: {
      title: 'Rick Astley',
      avatar: [{ url: 'https://example.com/rick-avatar.jpg' }],
      subscriberCount: '5.2M subscribers',
    },
    videos: [
      {
        id: 'dQw4w9WgXcQ',
        title: 'Never Gonna Give You Up',
        thumbnails: [{ url: 'https://img.youtube.com/vi/dQw4w9WgXcQ/0.jpg' }],
        duration: { seconds: 213 },
        author: {
          name: 'Rick Astley',
          thumbnails: [{ url: 'https://example.com/rick-avatar.jpg' }],
        },
      },
      {
        id: { videoId: 'xyz789' },
        title: { text: 'Whenever You Need Somebody' },
        thumbnails: [{ url: 'https://example.com/thumb2.jpg' }],
        duration: { seconds: 240 },
        author: { name: 'Rick Astley', thumbnails: [{ url: 'https://example.com/rick-avatar.jpg' }] },
      },
    ],
  };

  it('parses channel with videos', () => {
    const result = parseChannelData(rawChannelWithVideos, 'UCuAXFkgsw1L7xaCfnd5JJOw', true);
    expect(result.id).toBe('UCuAXFkgsw1L7xaCfnd5JJOw');
    expect(result.name).toBe('Rick Astley');
    expect(result.thumbnail).toBe('https://example.com/rick-avatar.jpg');
    expect(result.subscriberCount).toBe('5.2M subscribers');
    expect(result.following).toBe(true);
    expect(result.videos).toHaveLength(2);
    expect(result.videos[0]).toEqual({
      id: 'dQw4w9WgXcQ',
      title: 'Never Gonna Give You Up',
      thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/0.jpg',
      duration: 213,
      channel: {
        name: 'Rick Astley',
        thumbnail: 'https://example.com/rick-avatar.jpg',
      },
    });
    expect(result.videos[1]).toEqual({
      id: 'xyz789',
      title: 'Whenever You Need Somebody',
      thumbnail: 'https://example.com/thumb2.jpg',
      duration: 240,
      channel: { name: 'Rick Astley', thumbnail: 'https://example.com/rick-avatar.jpg' },
    });
  });

  it('parses channel without videos', () => {
    const rawChannel = {
      metadata: {
        title: 'Empty Channel',
        avatar: [{ url: 'https://example.com/empty-avatar.jpg' }],
        subscriberCount: '0 subscribers',
      },
    };
    const result = parseChannelData(rawChannel, 'ch-empty', false);
    expect(result.id).toBe('ch-empty');
    expect(result.name).toBe('Empty Channel');
    expect(result.videos).toEqual([]);
    expect(result.following).toBe(false);
  });

  it('handles channel with undefined videos', () => {
    const rawChannel = {
      metadata: {
        title: 'No Videos',
        subscriberCount: '1 subscriber',
      },
    };
    const result = parseChannelData(rawChannel, 'ch-novideos', false);
    expect(result.videos).toEqual([]);
    expect(result.thumbnail).toBe('');
  });

  it('skips videos without an id', () => {
    const rawChannel = {
      metadata: { title: 'Test', subscriberCount: '0' },
      videos: [
        {
          id: '',
          title: 'Empty ID',
          thumbnails: [{ url: 'https://example.com/thumb.jpg' }],
          duration: { seconds: 120 },
          author: { name: 'Artist', thumbnails: [{ url: 'https://example.com/a.jpg' }] },
        },
        {
          id: 'valid-id',
          title: 'Valid',
          thumbnails: [{ url: 'https://example.com/thumb.jpg' }],
          duration: { seconds: 120 },
          author: { name: 'Artist', thumbnails: [{ url: 'https://example.com/a.jpg' }] },
        },
      ],
    };
    const result = parseChannelData(rawChannel, 'ch-test', false);
    expect(result.videos).toHaveLength(1);
    expect(result.videos[0].id).toBe('valid-id');
  });

  it('handles video with missing author gracefully', () => {
    const rawChannel = {
      metadata: { title: 'Test', subscriberCount: '0' },
      videos: [
        {
          id: 'no-author',
          title: 'No Author',
          thumbnails: [{ url: 'https://example.com/thumb.jpg' }],
          duration: { seconds: 120 },
        },
      ],
    };
    const result = parseChannelData(rawChannel, 'ch-test', false);
    expect(result.videos).toHaveLength(1);
    expect(result.videos[0].channel.name).toBe('');
  });
});
