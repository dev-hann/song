/// <reference lib="esnext" />
/// <reference lib="webworker" />
import { defaultCache } from '@serwist/turbopack/worker';
import type { PrecacheEntry, SerwistGlobalConfig } from 'serwist';
import {
  Serwist,
  NetworkFirst,
  StaleWhileRevalidate,
  CacheFirst,
  ExpirationPlugin,
  CacheableResponsePlugin,
} from 'serwist';

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [
    ...defaultCache,
    {
      matcher: /^\/api\/melon\/chart/,
      handler: new StaleWhileRevalidate({
        cacheName: 'melon-chart',
        plugins: [
          new CacheableResponsePlugin({ statuses: [200] }),
          new ExpirationPlugin({ maxEntries: 10, maxAgeSeconds: 30 * 60 }),
        ],
      }),
    },
    {
      matcher: /^\/api\/youtube\/search/,
      handler: new CacheFirst({
        cacheName: 'youtube-search',
        plugins: [
          new CacheableResponsePlugin({ statuses: [200] }),
          new ExpirationPlugin({ maxEntries: 50, maxAgeSeconds: 5 * 60 }),
        ],
      }),
    },
    {
      matcher: /^\/api\/(home|recommendations)/,
      handler: new NetworkFirst({
        cacheName: 'home-data',
        networkTimeoutSeconds: 3,
        plugins: [
          new CacheableResponsePlugin({ statuses: [200] }),
          new ExpirationPlugin({ maxEntries: 30, maxAgeSeconds: 5 * 60 }),
        ],
      }),
    },
    {
      matcher: /^\/api\/(playlists|likes|history|channels)/,
      handler: new NetworkFirst({
        cacheName: 'user-data',
        networkTimeoutSeconds: 3,
        plugins: [
          new CacheableResponsePlugin({ statuses: [200] }),
          new ExpirationPlugin({ maxEntries: 100, maxAgeSeconds: 5 * 60 }),
        ],
      }),
    },
  ],
});

serwist.addEventListeners();
