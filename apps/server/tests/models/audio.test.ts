import { fromBasicInfo } from '../../src/models/audio.js';

describe('fromBasicInfo', () => {
  const validInput = {
    basic_info: {
      id: 'vid1',
      title: 'Test Video',
      short_description: 'A test video',
      duration: 200,
      view_count: 1000,
      upload_date: '2025-01-15',
      channel_id: 'ch1',
      thumbnail: [{ url: 'https://img.test/thumb.jpg' }],
    },
    channel: {
      name: 'TestChannel',
      id: 'ch1',
      thumbnails: [{ url: 'https://img.test/ch.jpg' }],
    },
  };

  it('returns correct ExtendedAudio from valid basic_info', () => {
    const result = fromBasicInfo(validInput);
    expect(result).toEqual({
      id: 'vid1',
      type: 'video',
      title: 'Test Video',
      description: 'A test video',
      duration: 200,
      viewCount: 1000,
      published: '2025-01-15',
      thumbnail: 'https://img.test/thumb.jpg',
      channel: {
        id: 'ch1',
        name: 'TestChannel',
        thumbnail: 'https://img.test/ch.jpg',
      },
      uploadDate: new Date('2025-01-15'),
    });
  });

  it('handles missing channel', () => {
    const input = {
      basic_info: {
        id: 'vid2',
        title: 'No Channel',
        short_description: 'desc',
        duration: 100,
        view_count: 500,
        thumbnail: [],
      },
    };
    const result = fromBasicInfo(input);
    expect(result.channel.name).toBe('');
    expect(result.channel.id).toBeUndefined();
    expect(result.channel.thumbnail).toBeUndefined();
  });

  it('handles missing upload_date', () => {
    const input = {
      basic_info: {
        id: 'vid3',
        title: 'No Date',
        short_description: 'desc',
        duration: 50,
        view_count: 100,
        thumbnail: [],
      },
    };
    const result = fromBasicInfo(input);
    expect(result.published).toBeUndefined();
    expect(result.uploadDate).toBeUndefined();
  });

  it('handles duration as { seconds: number } object', () => {
    const input = {
      basic_info: {
        id: 'vid4',
        title: 'Obj Duration',
        short_description: 'desc',
        duration: { seconds: 300 },
        view_count: 200,
        thumbnail: [],
      },
    };
    const result = fromBasicInfo(input);
    expect(result.duration).toBe(300);
  });

  it('handles missing thumbnails (defaults to empty string)', () => {
    const input = {
      basic_info: {
        id: 'vid5',
        title: 'No Thumb',
        short_description: 'desc',
        duration: 60,
        view_count: 10,
        thumbnail: [],
      },
    };
    const result = fromBasicInfo(input);
    expect(result.thumbnail).toBe('');
  });
});
