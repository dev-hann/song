export interface SearchLike {
  has_continuation: boolean;
  getContinuation(): Promise<SearchLike>;
}

interface CachedSearch {
  search: SearchLike;
  expiresAt: number;
}

const CACHE_TTL_MS = 30 * 60 * 1000;

const cache = new Map<string, CachedSearch>();

let cleanupTimer: ReturnType<typeof setInterval> | null = null;

function startCleanup() {
  if (cleanupTimer) {return;}
  cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of cache) {
      if (now >= entry.expiresAt) {
        cache.delete(key);
      }
    }
  }, 10 * 60 * 1000);
}

export function storeSearch(query: string, search: SearchLike): string {
  startCleanup();
  const token = `${query}:${Date.now()}:${Math.random().toString(36).slice(2, 10)}`;
  cache.set(token, { search, expiresAt: Date.now() + CACHE_TTL_MS });
  return token;
}

export function retrieveSearch(token: string): SearchLike | null {
  const entry = cache.get(token);
  if (!entry || Date.now() >= entry.expiresAt) {
    cache.delete(token);
    return null;
  }
  return entry.search;
}

export function replaceSearch(oldToken: string, newSearch: SearchLike): string {
  cache.delete(oldToken);
  return storeSearch('', newSearch);
}
