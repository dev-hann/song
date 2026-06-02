// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { storeSearch, retrieveSearch, replaceSearch } from '../search-cache';
import type { SearchLike } from '../search-cache';

function createMockSearch(hasContinuation: boolean): SearchLike {
  return {
    has_continuation: hasContinuation,
    getContinuation: vi.fn().mockResolvedValue({
      has_continuation: false,
      getContinuation: vi.fn().mockResolvedValue({} as SearchLike),
    } satisfies SearchLike),
  };
}

describe('search-cache', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('stores and retrieves a search object', () => {
    const search = createMockSearch(true);
    const token = storeSearch('query', search);

    const retrieved = retrieveSearch(token);
    expect(retrieved).toBe(search);
  });

  it('returns null for unknown token', () => {
    const result = retrieveSearch('nonexistent');
    expect(result).toBeNull();
  });

  it('returns null for expired token', () => {
    const search = createMockSearch(true);
    const token = storeSearch('query', search);

    vi.advanceTimersByTime(31 * 60 * 1000);

    const result = retrieveSearch(token);
    expect(result).toBeNull();
  });

  it('replaces an old search with a new one', () => {
    const oldSearch = createMockSearch(true);
    const newSearch = createMockSearch(true);
    const oldToken = storeSearch('query', oldSearch);

    const newToken = replaceSearch(oldToken, newSearch);

    expect(retrieveSearch(oldToken)).toBeNull();
    expect(retrieveSearch(newToken)).toBe(newSearch);
  });

  it('generates unique tokens', () => {
    const search = createMockSearch(true);
    const token1 = storeSearch('a', search);
    const token2 = storeSearch('b', search);

    expect(token1).not.toBe(token2);
  });
});
