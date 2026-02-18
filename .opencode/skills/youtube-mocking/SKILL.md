---
name: youtube-mocking
description: Mock YouTube.js API calls for isolated testing
license: MIT
compatibility: opencode
metadata:
  category: testing
  complexity: intermediate
---

## What I do
- Mock YouTube.js API calls with Vitest
- Mock Innertube.create() and session
- Mock search, video info, channel, playlist methods
- Mock feed methods (home, trending, subscriptions)
- Create consistent mock data helpers
- Test API routes in isolation

## When to use me
Use this when you need to:
- Mock YouTube.js API calls in tests
- Test API routes without external dependencies
- Create consistent mock data for tests
- Test error handling with mock errors
- Test edge cases with controlled responses

I'll ask clarifying questions if:
- YouTube.js API structure needs clarification
- Mock data requirements are unclear

## Pattern: Mocking YouTube.js Library
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('youtubei.js', () => ({
  Innertube: {
    create: vi.fn(),
  },
}));

describe('YouTube.js Mocking', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should mock Innertube.create', async () => {
    const mockInnertube = { session: {} };
    const { Innertube } = await import('youtubei.js');
    vi.mocked(Innertube.create).mockResolvedValue(mockInnertube as any);

    const result = await Innertube.create();

    expect(result).toBe(mockInnertube);
    expect(Innertube.create).toHaveBeenCalledWith({
      generate_session_locally: true,
      enable_session_cache: false,
      lang: 'ko',
      location: 'KR',
    });
  });
});
```

## Pattern: Mocking getInnertube Helper
```typescript
vi.mock('@/lib/youtube', () => ({
  getInnertube: vi.fn(),
}));

describe('getInnertube', () => {
  it('should return mocked Innertube instance', async () => {
    const mockInnertube = {
      search: vi.fn(),
      getBasicInfo: vi.fn(),
      getChannel: vi.fn(),
      getPlaylist: vi.fn(),
    };

    const { getInnertube } = await import('@/lib/youtube');
    vi.mocked(getInnertube).mockResolvedValue(mockInnertube as any);

    const result = await getInnertube();

    expect(result).toBe(mockInnertube);
  });
});
```

## Pattern: Mocking Search API
```typescript
it('should mock search results', async () => {
  const mockInnertube = {
    search: vi.fn().mockResolvedValue({
      results: [
        {
          id: 'video123',
          type: 'video',
          title: 'Test Video',
          thumbnail: 'https://example.com/thumb.jpg',
          channel: { name: 'Test Channel' },
        },
      ],
      has_continuation: false,
    }),
  };

  const { getInnertube } = await import('@/lib/youtube');
  vi.mocked(getInnertube).mockResolvedValue(mockInnertube as any);

  const innertube = await getInnertube();
  const results = await innertube.search('test query');

  expect(results.results).toHaveLength(1);
  expect(results.results[0].title).toBe('Test Video');
});
```

## Pattern: Mocking Video Info API
```typescript
it('should mock video info', async () => {
  const mockInnertube = {
    getBasicInfo: vi.fn().mockResolvedValue({
      basic_info: {
        id: 'video123',
        title: 'Test Video',
        short_description: 'Test Description',
        duration: { seconds: 120 },
        view_count: 5000,
        upload_date: '2024-01-01',
        thumbnail: [{ url: 'https://example.com/thumb.jpg' }],
        channel_id: 'channel123',
        channel: {
          name: 'Test Channel',
          thumbnails: [{ url: 'https://example.com/channel.jpg' }],
        },
      },
    }),
  };

  const { getInnertube } = await import('@/lib/youtube');
  vi.mocked(getInnertube).mockResolvedValue(mockInnertube as any);

  const innertube = await getInnertube();
  const info = await innertube.getBasicInfo('video123');

  expect(info.basic_info.title).toBe('Test Video');
  expect(info.basic_info.duration.seconds).toBe(120);
});
```

## Pattern: Mocking Channel API
```typescript
it('should mock channel info', async () => {
  const mockInnertube = {
    getChannel: vi.fn().mockResolvedValue({
      metadata: {
        title: 'Test Channel',
        description: 'Test Description',
        thumbnail: [{ url: 'https://example.com/channel.jpg' }],
      },
      videos: [
        {
          id: 'video123',
          title: 'Test Video',
          duration: { seconds: 120 },
          view_count: 5000,
          thumbnails: [{ url: 'https://example.com/thumb.jpg' }],
          upload_date: '2024-01-01',
        },
      ],
    }),
  };

  const { getInnertube } = await import('@/lib/youtube');
  vi.mocked(getInnertube).mockResolvedValue(mockInnertube as any);

  const innertube = await getInnertube();
  const channel = await innertube.getChannel('channel123');

  expect(channel.metadata.title).toBe('Test Channel');
  expect(channel.videos).toHaveLength(1);
});
```

## Pattern: Mocking Playlist API
```typescript
it('should mock playlist info', async () => {
  const mockInnertube = {
    getPlaylist: vi.fn().mockResolvedValue({
      info: {
        title: 'Test Playlist',
        description: 'Test Description',
        thumbnails: [{ url: 'https://example.com/playlist.jpg' }],
        total_items: 10,
        author: {
          name: 'Test Channel',
        },
      },
      items: [
        {
          id: 'video123',
          title: 'Test Video',
          duration: { seconds: 120 },
          thumbnails: [{ url: 'https://example.com/thumb.jpg' }],
          index: 1,
        },
      ],
    }),
  };

  const { getInnertube } = await import('@/lib/youtube');
  vi.mocked(getInnertube).mockResolvedValue(mockInnertube as any);

  const innertube = await getInnertube();
  const playlist = await innertube.getPlaylist('playlist123');

  expect(playlist.info.title).toBe('Test Playlist');
  expect(playlist.info.total_items).toBe(10);
});
```

## Pattern: Mocking Feed API
```typescript
it('should mock home feed', async () => {
  const mockInnertube = {
    getHomeFeed: vi.fn().mockResolvedValue([
      {
        id: 'video123',
        type: 'video',
        title: 'Test Video',
        thumbnail: 'https://example.com/thumb.jpg',
        channel: { name: 'Test Channel' },
      },
    ]),
  };

  const { getInnertube } = await import('@/lib/youtube');
  vi.mocked(getInnertube).mockResolvedValue(mockInnertube as any);

  const innertube = await getInnertube();
  const feed = await innertube.getHomeFeed();

  expect(feed).toHaveLength(1);
});
```

## Pattern: Mocking Error Responses
```typescript
it('should mock API error', async () => {
  const mockInnertube = {
    search: vi.fn().mockRejectedValue(new Error('API Error')),
  };

  const { getInnertube } = await import('@/lib/youtube');
  vi.mocked(getInnertube).mockResolvedValue(mockInnertube as any);

  const innertube = await getInnertube();

  await expect(innertube.search('test query')).rejects.toThrow('API Error');
});
```

## Pattern: Mock Helper Functions
```typescript
// tests/mocks/youtube-helpers.ts

export function createMockVideo(overrides = {}) {
  return {
    id: 'video123',
    type: 'video',
    title: 'Test Video',
    description: 'Test Description',
    duration: 120,
    viewCount: 5000,
    thumbnail: 'https://example.com/thumb.jpg',
    channel: {
      id: 'channel123',
      name: 'Test Channel',
      thumbnail: 'https://example.com/channel.jpg',
    },
    ...overrides,
  };
}

export function createMockChannel(overrides = {}) {
  return {
    id: 'channel123',
    type: 'channel',
    name: 'Test Channel',
    subscribers: 1000,
    thumbnail: 'https://example.com/channel.jpg',
    ...overrides,
  };
}

export function createMockPlaylist(overrides = {}) {
  return {
    id: 'playlist123',
    type: 'playlist',
    title: 'Test Playlist',
    videoCount: 10,
    thumbnail: 'https://example.com/playlist.jpg',
    channel: {
      name: 'Test Channel',
    },
    ...overrides,
  };
}

export function createMockInnertube() {
  return {
    search: vi.fn(),
    getBasicInfo: vi.fn(),
    getChannel: vi.fn(),
    getPlaylist: vi.fn(),
    getHomeFeed: vi.fn(),
    getTrending: vi.fn(),
    getSubscriptionsFeed: vi.fn(),
  };
}
```

## Pattern: Using Mock Helpers
```typescript
import { createMockVideo, createMockInnertube } from '@/tests/mocks/youtube-helpers';

it('should use mock helpers', async () => {
  const mockInnertube = createMockInnertube();
  mockInnertube.search.mockResolvedValue({
    results: [createMockVideo()],
    has_continuation: false,
  });

  const { getInnertube } = await import('@/lib/youtube');
  vi.mocked(getInnertube).mockResolvedValue(mockInnertube as any);

  const innertube = await getInnertube();
  const results = await innertube.search('test query');

  expect(results.results).toHaveLength(1);
  expect(results.results[0].id).toBe('video123');
});
```

## YouTube.js Mock Reference

| Method | Description |
|--------|-------------|
| `Innertube.create()` | Create Innertube instance |
| `innertube.search()` | Search for videos |
| `innertube.getBasicInfo()` | Get video info |
| `innertube.getChannel()` | Get channel info |
| `innertube.getPlaylist()` | Get playlist info |
| `innertube.getHomeFeed()` | Get home feed |
| `innertube.getTrending()` | Get trending videos |
| `innertube.getSubscriptionsFeed()` | Get subscriptions feed |

---

**Related SKILLS:** api-testing.md, testing-infrastructure.md, hook-testing.md
