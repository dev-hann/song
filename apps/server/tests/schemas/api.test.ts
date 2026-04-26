import { SearchParamsSchema, DownloadResponseSchema } from '../../src/schemas/api.js';

describe('SearchParamsSchema', () => {
  it('validates q with min 1 char', () => {
    const result = SearchParamsSchema.safeParse({ q: 'hello' });
    expect(result.success).toBe(true);
  });

  it('rejects empty q', () => {
    const result = SearchParamsSchema.safeParse({ q: '' });
    expect(result.success).toBe(false);
  });

  it('defaults filter to "video"', () => {
    const result = SearchParamsSchema.parse({ q: 'test' });
    expect(result.filter).toBe('video');
  });

  it('accepts valid filter values', () => {
    expect(SearchParamsSchema.parse({ q: 'x', filter: 'channel' }).filter).toBe('channel');
    expect(SearchParamsSchema.parse({ q: 'x', filter: 'playlist' }).filter).toBe('playlist');
  });

  it('rejects invalid filter', () => {
    const result = SearchParamsSchema.safeParse({ q: 'test', filter: 'invalid' });
    expect(result.success).toBe(false);
  });
});

describe('DownloadResponseSchema', () => {
  it('validates url format', () => {
    const result = DownloadResponseSchema.safeParse({
      url: 'https://example.com/stream.mp3',
    });
    expect(result.success).toBe(true);
  });

  it('rejects non-url string', () => {
    const result = DownloadResponseSchema.safeParse({
      url: 'not-a-url',
    });
    expect(result.success).toBe(false);
  });

  it('rejects empty string', () => {
    const result = DownloadResponseSchema.safeParse({
      url: '',
    });
    expect(result.success).toBe(false);
  });
});
