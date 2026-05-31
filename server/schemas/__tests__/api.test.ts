import { describe, it, expect } from 'vitest';
import { SearchParamsSchema } from '../api';

describe('SearchParamsSchema', () => {
  it('succeeds with valid q and defaults filter to "video"', () => {
    const result = SearchParamsSchema.safeParse({ q: 'BTS' });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.q).toBe('BTS');
      expect(result.data.filter).toBe('video');
    }
  });

  it('succeeds with valid q and explicit filter', () => {
    const result = SearchParamsSchema.safeParse({ q: 'test', filter: 'channel' });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.q).toBe('test');
      expect(result.data.filter).toBe('channel');
    }
  });

  it('fails when q is missing', () => {
    const result = SearchParamsSchema.safeParse({});

    expect(result.success).toBe(false);
  });

  it('fails when q is empty string', () => {
    const result = SearchParamsSchema.safeParse({ q: '' });

    expect(result.success).toBe(false);
  });

  it('fails when filter is invalid', () => {
    const result = SearchParamsSchema.safeParse({ q: 'test', filter: 'invalid' });

    expect(result.success).toBe(false);
  });
});
