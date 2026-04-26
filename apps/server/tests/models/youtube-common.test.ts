import { extractVideoFields, isAudioContent, YouTubeVideoItemSchema } from '../../src/models/youtube-common.js';

describe('extractVideoFields', () => {
  it('extracts fields with string id and string title', () => {
    const data = YouTubeVideoItemSchema.parse({
      id: 'abc123',
      title: 'My Video',
    });
    const result = extractVideoFields(data);
    expect(result.id).toBe('abc123');
    expect(result.title).toBe('My Video');
  });

  it('extracts fields with object id and object title', () => {
    const data = YouTubeVideoItemSchema.parse({
      id: { video_id: 'xyz789' },
      title: { text: 'Hello World' },
    });
    const result = extractVideoFields(data);
    expect(result.id).toBe('');
    expect(result.title).toBe('Hello World');
  });

  it('defaults thumbnail and channelThumbnail to empty/undefined when missing', () => {
    const data = YouTubeVideoItemSchema.parse({
      id: 'vid1',
      title: 'No thumbs',
    });
    const result = extractVideoFields(data);
    expect(result.thumbnail).toBe('');
    expect(result.duration).toBe(0);
    expect(result.channelName).toBe('');
    expect(result.channelThumbnail).toBeUndefined();
  });

  it('extracts all fields when present', () => {
    const data = YouTubeVideoItemSchema.parse({
      id: 'vid2',
      title: 'Full Video',
      thumbnails: [{ url: 'https://img.test/thumb.jpg' }],
      duration: { seconds: 120 },
      author: {
        name: 'TestChannel',
        thumbnails: [{ url: 'https://img.test/channel.jpg' }],
      },
    });
    const result = extractVideoFields(data);
    expect(result).toEqual({
      id: 'vid2',
      title: 'Full Video',
      thumbnail: 'https://img.test/thumb.jpg',
      duration: 120,
      channelName: 'TestChannel',
      channelThumbnail: 'https://img.test/channel.jpg',
    });
  });
});

describe('isAudioContent', () => {
  it('returns false for duration below 30', () => {
    expect(isAudioContent(29)).toBe(false);
  });

  it('returns true for duration of 30 (lower boundary)', () => {
    expect(isAudioContent(30)).toBe(true);
  });

  it('returns true for duration of 900 (upper boundary)', () => {
    expect(isAudioContent(900)).toBe(true);
  });

  it('returns false for duration above 900', () => {
    expect(isAudioContent(901)).toBe(false);
  });

  it('returns false for duration of 0', () => {
    expect(isAudioContent(0)).toBe(false);
  });
});
