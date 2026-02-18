import { describe, it, expect } from 'vitest';
import {
  SearchParamsSchema,
  AudioInfoResponseSchema,
  DownloadParamsSchema,
  DownloadResponseSchema,
} from '@/schemas/api';
import { SearchResponseSchema } from '@/models/search';

describe('SearchParamsSchema', () => {
  it('should validate complete search params', () => {
    const validParams = { q: 'test query', filter: 'video' };

    const result = SearchParamsSchema.safeParse(validParams);

    expect(result.success).toBe(true);
  });

  it('should validate minimal search params', () => {
    const minimalParams = { q: 'test query' };

    const result = SearchParamsSchema.safeParse(minimalParams);

    expect(result.success).toBe(true);
  });

  it('should reject empty query', () => {
    const invalidParams = { q: '' };

    const result = SearchParamsSchema.safeParse(invalidParams);

    expect(result.success).toBe(false);
  });

  it('should reject missing query', () => {
    const invalidParams = {};

    const result = SearchParamsSchema.safeParse(invalidParams);

    expect(result.success).toBe(false);
  });

  it('should reject invalid filter', () => {
    const invalidParams = { q: 'test', filter: 'invalid' };

    const result = SearchParamsSchema.safeParse(invalidParams);

    expect(result.success).toBe(false);
  });

  it('should accept valid filter values', () => {
    const filters = ['video', 'channel', 'playlist'];

    filters.forEach((filter) => {
      const result = SearchParamsSchema.safeParse({ q: 'test', filter });
      expect(result.success).toBe(true);
    });
  });
});

describe('DownloadParamsSchema', () => {
  it('should validate download params', () => {
    const validParams = { id: 'audio123' };

    const result = DownloadParamsSchema.safeParse(validParams);

    expect(result.success).toBe(true);
  });

  it('should reject empty id', () => {
    const invalidParams = { id: '' };

    const result = DownloadParamsSchema.safeParse(invalidParams);

    expect(result.success).toBe(false);
  });

  it('should reject missing id', () => {
    const invalidParams = {};

    const result = DownloadParamsSchema.safeParse(invalidParams);

    expect(result.success).toBe(false);
  });
});


describe('SearchResponseSchema', () => {
  it('should validate complete search response', () => {
    const validResponse = {
      query: 'test query',
      results: [
        {
          id: 'audio123',
          title: 'Test Audio',
          thumbnail: 'https://example.com/thumb.jpg',
          duration: 120,
          channel: {
            name: 'Test Channel',
          },
        },
      ],
      has_continuation: true,
    };

    const result = SearchResponseSchema.safeParse(validResponse);

    expect(result.success).toBe(true);
  });

  it('should validate minimal search response', () => {
    const minimalResponse = {
      query: 'test query',
      results: [],
    };

    const result = SearchResponseSchema.safeParse(minimalResponse);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.has_continuation).toBe(false);
    }
  });
});

describe('AudioInfoResponseSchema', () => {
  it('should validate complete audio info response', () => {
    const validResponse = {
      id: 'audio123',
      type: 'video',
      title: 'Test Audio',
      description: 'Test Description',
      duration: 120,
      viewCount: 5000,
      published: '2024-01-01',
      thumbnail: 'https://example.com/thumb.jpg',
      channel: {
        id: 'channel123',
        name: 'Test Channel',
        thumbnail: 'https://example.com/channel.jpg',
      },
      isLive: false,
      uploadDate: new Date('2024-01-01'),
    };

    const result = AudioInfoResponseSchema.safeParse(validResponse);

    expect(result.success).toBe(true);
  });

  it('should validate minimal audio info response', () => {
    const minimalResponse = {
      id: 'audio123',
      type: 'video',
      title: 'Test Audio',
      thumbnail: 'https://example.com/thumb.jpg',
      channel: {
        id: 'channel123',
        name: 'Test Channel',
      },
    };

    const result = AudioInfoResponseSchema.safeParse(minimalResponse);

    expect(result.success).toBe(true);
  });
});


describe('DownloadResponseSchema', () => {
  it('should validate download response', () => {
    const validResponse = {
      url: 'https://example.com/audio.mp4',
    };

    const result = DownloadResponseSchema.safeParse(validResponse);

    expect(result.success).toBe(true);
  });

  it('should reject invalid URL', () => {
    const invalidResponse = {
      url: 'not-a-url',
    };

    const result = DownloadResponseSchema.safeParse(invalidResponse);

    expect(result.success).toBe(false);
  });
});
