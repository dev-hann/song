import { test as base, expect } from '@playwright/test';

interface TestUser {
  id: string;
  email: string;
  name: string;
  picture?: string;
}

const testUser: TestUser = {
  id: 'test-e2e-user',
  email: 'e2e-test@song.local',
  name: 'E2E Test User',
};

const mockSearchResults = [
  {
    id: 'dQw4w9WgXcQ',
    title: 'Rick Astley - Never Gonna Give You Up',
    thumbnail: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
    duration: 213,
    channel: { name: 'Rick Astley', thumbnail: '' },
  },
  {
    id: 'JGwWNGJdvx8',
    title: 'Ed Sheeran - Shape of You',
    thumbnail: 'https://i.ytimg.com/vi/JGwWNGJdvx8/hqdefault.jpg',
    duration: 264,
    channel: { name: 'Ed Sheeran', thumbnail: '' },
  },
];

const mockChart = Array.from({ length: 5 }, (_, i) => ({
  rank: i + 1,
  title: `Chart Song ${i + 1}`,
  artist: `Artist ${i + 1}`,
  albumArt: `https://via.placeholder.com/100?text=${i + 1}`,
}));

const mockPlaylist = {
  id: 'pl-1',
  name: '테스트 재생목록',
  description: '',
  track_count: 2,
  is_system: false,
  tracks: [
    { video_id: 'dQw4w9WgXcQ', title: 'Never Gonna Give You Up', channel: 'Rick Astley', thumbnail: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg', duration: 213 },
    { video_id: 'JGwWNGJdvx8', title: 'Shape of You', channel: 'Ed Sheeran', thumbnail: 'https://i.ytimg.com/vi/JGwWNGJdvx8/hqdefault.jpg', duration: 264 },
  ],
};

function setupApiMocks(page: import('@playwright/test').Page) {
  page.route('http://localhost:3000/api/**', async (route) => {
    const url = route.request().url();
    const method = route.request().method();

    if (url.includes('/api/auth/refresh')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ token: 'mock-token' }) });
    }
    if (url.includes('/api/youtube/search')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ results: mockSearchResults }) });
    }
    if (url.includes('/api/youtube/audio/info')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({
        id: 'dQw4w9WgXcQ', title: 'Never Gonna Give You Up', description: '', duration: 213, viewCount: 1000,
        thumbnail: 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg', channel: { name: 'Rick Astley' },
      }) });
    }
    if (url.includes('/api/youtube/audio/stream')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ url: 'https://example.com/audio.mp3' }) });
    }
    if (url.includes('/api/youtube/audio/related')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ results: mockSearchResults }) });
    }
    if (url.match(/\/api\/playlists\/pl-1$/) && method === 'GET') {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockPlaylist) });
    }
    if (url.match(/\/api\/playlists\/pl-1\/tracks/) || url.match(/\/api\/playlists\/pl-1\/reorder/)) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({}) });
    }
    if (url.includes('/api/playlists') && method === 'GET') {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([mockPlaylist]) });
    }
    if (url.includes('/api/playlists') && method === 'POST') {
      const body = route.request().postDataJSON();
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({
        id: 'pl-new', name: body?.name || 'New Playlist', description: '', track_count: 0, is_system: false, tracks: [],
      }) });
    }
    if (url.includes('/api/likes/check/')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ liked: false }) });
    }
    if (url.includes('/api/likes') && method === 'GET') {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
    }
    if (url.includes('/api/likes')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({}) });
    }
    if (url.includes('/api/history') && method === 'GET') {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
    }
    if (url.includes('/api/history') && method === 'DELETE') {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({}) });
    }
    if (url.includes('/api/history')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({}) });
    }
    if (url.includes('/api/home')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({
        chart: mockChart, hot100: mockChart, dailyChart: mockChart, recent: [],
        recommendations: { fromChannels: [], fromRecent: [] },
      }) });
    }
    if (url.includes('/api/melon/chart')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(mockChart) });
    }
    if (url.includes('/api/recommendations')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ fromChannels: [], fromRecent: [] }) });
    }
    if (url.includes('/api/channels')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify([]) });
    }

    return route.fallback();
  });
}

type TestFixtures = {
  authenticatedPage: typeof base;
};

export const test = base.extend<TestFixtures>({
  authenticatedPage: async ({ page }, use) => {
    setupApiMocks(page);

    await page.goto('/login');
    await page.evaluate((user) => {
      localStorage.setItem('song_user', JSON.stringify(user));
    }, testUser);

    await page.goto('/home');
    await page.waitForURL('/home');
    await page.waitForTimeout(3000);

    await use(page);
  },
});

export { expect };
