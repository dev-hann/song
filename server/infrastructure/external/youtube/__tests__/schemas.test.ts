// @vitest-environment node
import { describe, it, expect } from 'vitest';
import {
  YouTubeVideoItemSchema,
  YouTubeBasicInfoSchema,
  extractVideoFields,
} from '../schemas';

describe('YouTubeVideoItemSchema', () => {
  const validVideoItem = {
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

  it('parses a valid Video item', () => {
    const result = YouTubeVideoItemSchema.parse(validVideoItem);
    expect(result.id).toBe('dQw4w9WgXcQ');
    expect(result.title).toBe('Never Gonna Give You Up');
    expect(result.duration?.seconds).toBe(213);
    expect(result.author?.name).toBe('Rick Astley');
  });

  it('accepts id as an object with video_id', () => {
    const item = {
      id: { video_id: 'abc123' },
      title: { text: 'Test Video' },
    };
    const result = YouTubeVideoItemSchema.parse(item);
    expect(result.id).toEqual({ video_id: 'abc123' });
  });

  it('accepts title as an object with text', () => {
    const item = {
      id: 'xyz789',
      title: { text: 'Object Title' },
    };
    const result = YouTubeVideoItemSchema.parse(item);
    expect(result.title).toEqual({ text: 'Object Title' });
  });

  it('accepts item without optional fields', () => {
    const minimal = {
      id: 'abc',
      title: 'Minimal',
    };
    const result = YouTubeVideoItemSchema.parse(minimal);
    expect(result.id).toBe('abc');
    expect(result.type).toBeUndefined();
    expect(result.thumbnails).toBeUndefined();
    expect(result.duration).toBeUndefined();
    expect(result.author).toBeUndefined();
    expect(result.video_id).toBeUndefined();
  });

  it('accepts item with video_id field', () => {
    const item = {
      id: 'some-id',
      video_id: 'explicit-video-id',
      title: 'Title',
    };
    const result = YouTubeVideoItemSchema.parse(item);
    expect(result.video_id).toBe('explicit-video-id');
  });

  it('rejects item without id', () => {
    const item = {
      title: 'No ID',
    };
    const result = YouTubeVideoItemSchema.safeParse(item);
    expect(result.success).toBe(false);
  });

  it('rejects item without title', () => {
    const item = {
      id: 'abc',
    };
    const result = YouTubeVideoItemSchema.safeParse(item);
    expect(result.success).toBe(false);
  });

  it('rejects item with invalid id type', () => {
    const item = {
      id: 123,
      title: 'Bad ID',
    };
    const result = YouTubeVideoItemSchema.safeParse(item);
    expect(result.success).toBe(false);
  });

  it('rejects item with invalid title type', () => {
    const item = {
      id: 'abc',
      title: 42,
    };
    const result = YouTubeVideoItemSchema.safeParse(item);
    expect(result.success).toBe(false);
  });
});

describe('YouTubeBasicInfoSchema', () => {
  const validBasicInfo = {
    basic_info: {
      id: 'dQw4w9WgXcQ',
      title: 'Never Gonna Give You Up',
      short_description: 'The official video.',
      duration: 213,
      view_count: 1400000000,
      upload_date: '20091025',
      channel_id: 'UCuAXFkgsw1L7xaCfnd5JJOw',
      thumbnail: [{ url: 'https://img.youtube.com/vi/dQw4w9WgXcQ/0.jpg' }],
    },
    channel: {
      name: 'Rick Astley',
      id: 'UCuAXFkgsw1L7xaCfnd5JJOw',
      thumbnails: [{ url: 'https://example.com/avatar.jpg' }],
    },
  };

  it('parses valid basic info with duration as number', () => {
    const result = YouTubeBasicInfoSchema.parse(validBasicInfo);
    expect(result.basic_info.id).toBe('dQw4w9WgXcQ');
    expect(result.basic_info.duration).toBe(213);
    expect(result.basic_info.title).toBe('Never Gonna Give You Up');
    expect(result.channel?.name).toBe('Rick Astley');
  });

  it('transforms duration from object to number', () => {
    const input = {
      basic_info: {
        id: 'abc123',
        title: 'Test',
        short_description: 'Desc',
        duration: { seconds: 180 },
        view_count: 1000,
        thumbnail: [],
      },
    };
    const result = YouTubeBasicInfoSchema.parse(input);
    expect(result.basic_info.duration).toBe(180);
  });

  it('handles missing optional channel', () => {
    const input = {
      basic_info: {
        id: 'abc',
        title: 'No Channel',
        short_description: 'Desc',
        duration: 120,
        view_count: 500,
        thumbnail: [],
      },
    };
    const result = YouTubeBasicInfoSchema.parse(input);
    expect(result.channel).toBeUndefined();
  });

  it('handles missing optional upload_date and channel_id', () => {
    const input = {
      basic_info: {
        id: 'abc',
        title: 'Minimal',
        short_description: 'Desc',
        duration: 90,
        view_count: 100,
        thumbnail: [{ url: 'https://example.com/thumb.jpg' }],
      },
    };
    const result = YouTubeBasicInfoSchema.parse(input);
    expect(result.basic_info.upload_date).toBeUndefined();
    expect(result.basic_info.channel_id).toBeUndefined();
  });

  it('defaults thumbnail to empty array when omitted', () => {
    const input = {
      basic_info: {
        id: 'abc',
        title: 'No Thumbnail',
        short_description: 'Desc',
        duration: 60,
        view_count: 10,
      },
    };
    const result = YouTubeBasicInfoSchema.parse(input);
    expect(result.basic_info.thumbnail).toEqual([]);
  });

  it('rejects missing required basic_info.id', () => {
    const input = {
      basic_info: {
        title: 'No ID',
        short_description: 'Desc',
        duration: 60,
        view_count: 10,
      },
    };
    const result = YouTubeBasicInfoSchema.safeParse(input);
    expect(result.success).toBe(false);
  });

  it('rejects missing basic_info entirely', () => {
    const result = YouTubeBasicInfoSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('rejects non-object input', () => {
    const result = YouTubeBasicInfoSchema.safeParse('not an object');
    expect(result.success).toBe(false);
  });
});

describe('extractVideoFields', () => {
  it('extracts fields from a flat string id/title item', () => {
    const data = YouTubeVideoItemSchema.parse({
      id: 'dQw4w9WgXcQ',
      title: 'Never Gonna Give You Up',
      thumbnails: [{ url: 'https://img.youtube.com/vi/dQw4w9WgXcQ/0.jpg' }],
      duration: { seconds: 213 },
      author: {
        name: 'Rick Astley',
        thumbnails: [{ url: 'https://example.com/avatar.jpg' }],
      },
    });
    const fields = extractVideoFields(data);
    expect(fields).toEqual({
      id: 'dQw4w9WgXcQ',
      title: 'Never Gonna Give You Up',
      thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/0.jpg',
      duration: 213,
      channelName: 'Rick Astley',
      channelThumbnail: 'https://example.com/avatar.jpg',
    });
  });

  it('prefers video_id over id when both present', () => {
    const data = YouTubeVideoItemSchema.parse({
      id: 'old-id',
      video_id: 'preferred-id',
      title: 'Title',
    });
    const fields = extractVideoFields(data);
    expect(fields.id).toBe('preferred-id');
  });

  it('extracts id from object id format', () => {
    const data = YouTubeVideoItemSchema.parse({
      id: { video_id: 'object-id' },
      title: 'Title',
    });
    const fields = extractVideoFields(data);
    expect(fields.id).toBe('');
  });

  it('extracts title from object title format', () => {
    const data = YouTubeVideoItemSchema.parse({
      id: 'abc',
      title: { text: 'Object Title' },
    });
    const fields = extractVideoFields(data);
    expect(fields.title).toBe('Object Title');
  });

  it('returns defaults for optional fields', () => {
    const data = YouTubeVideoItemSchema.parse({
      id: 'abc',
      title: 'Title',
    });
    const fields = extractVideoFields(data);
    expect(fields.thumbnail).toBe('');
    expect(fields.duration).toBe(0);
    expect(fields.channelName).toBe('');
    expect(fields.channelThumbnail).toBeUndefined();
  });

  it('returns 0 duration when seconds is undefined', () => {
    const data = YouTubeVideoItemSchema.parse({
      id: 'abc',
      title: 'Title',
      duration: {},
    });
    const fields = extractVideoFields(data);
    expect(fields.duration).toBe(0);
  });
});
