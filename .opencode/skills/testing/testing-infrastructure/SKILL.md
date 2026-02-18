---
name: testing-infrastructure
description: Set up testing infrastructure with Vitest, Playwright, and MSW
license: MIT
compatibility: opencode
metadata:
  category: testing
  complexity: basic
---

## What I do
- Set up Vitest configuration for unit and integration tests
- Set up Playwright configuration for end-to-end tests
- Set up MSW (Mock Service Worker) for API mocking
- Configure testing environment and globals
- Set up test coverage thresholds
- Configure test reporters and outputs

## When to use me
Use this when you need to:
- Set up new testing infrastructure
- Configure Vitest for React testing
- Configure Playwright for E2E testing
- Set up MSW for API mocking
- Configure test coverage and thresholds

I'll ask clarifying questions if:
- Testing framework choice needs clarification
- Configuration requirements are unclear

## Pattern: Vitest Configuration
```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.test.ts',
        '**/*.test.tsx',
        '**/*.spec.ts',
        '**/*.spec.tsx',
        '**/types/',
        'next-env.d.ts',
      ],
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 70,
        statements: 70,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

## Pattern: Playwright Configuration
```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

## Pattern: Test Setup File
```typescript
// tests/setup.ts
import '@testing-library/jest-dom';
import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';

afterEach(() => {
  cleanup();
});

global.matchMedia = vi.fn().mockImplementation((query) => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: vi.fn(),
  removeListener: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
}));
```

## Pattern: MSW Handlers
```typescript
// tests/mocks/handlers.ts
import { http, HttpResponse } from 'msw';

export const handlers = [
  http.get('/api/youtube/search', () => {
    return HttpResponse.json({
      query: 'test',
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
    });
  }),

  http.get('/api/youtube/video/info', () => {
    return HttpResponse.json({
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
    });
  }),
];
```

## Pattern: Package.json Scripts
```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui"
  }
}
```

## Pattern: Test Directory Structure
```
tests/
├── setup.ts
├── mocks/
│   └── handlers.ts
├── unit/
│   ├── lib/
│   │   ├── formatters.test.ts
│   │   ├── parsers.test.ts
│   │   └── youtube.test.ts
│   └── schemas/
│       ├── video.test.ts
│       └── api.test.ts
├── components/
│   ├── video-card.test.tsx
│   ├── search-bar.test.tsx
│   └── results-display.test.tsx
├── hooks/
│   ├── use-youtube-search.test.ts
│   ├── use-video-info.test.ts
│   └── use-feed.test.ts
├── api/
│   ├── search.test.ts
│   ├── video-info.test.ts
│   └── feeds.test.ts
└── e2e/
    ├── search.spec.ts
    ├── feeds.spec.ts
    └── channel.spec.ts
```

## Pattern: Dependencies Installation
```bash
# Install Vitest and testing dependencies
npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event msw

# Install Playwright
npm install -D @playwright/test
npx playwright install chromium
```

## Vitest Configuration Options

| Option | Description |
|--------|-------------|
| `environment` | Test environment (jsdom, node) |
| `setupFiles` | Files to run before each test |
| `globals` | Enable global test functions |
| `coverage.provider` | Coverage provider (v8, istanbul) |
| `coverage.reporter` | Coverage output format |
| `coverage.thresholds` | Minimum coverage percentages |

## Playwright Configuration Options

| Option | Description |
|--------|-------------|
| `testDir` | Directory containing E2E tests |
| `fullyParallel` | Run tests in parallel |
| `retries` | Number of retries on failure |
| `reporter` | Test reporter format |
| `use.baseURL` | Base URL for navigation |
| `webServer.command` | Command to start web server |

## MSW Handler Types

| Type | Description |
|------|-------------|
| `http.get` | Mock GET requests |
| `http.post` | Mock POST requests |
| `http.put` | Mock PUT requests |
| `http.delete` | Mock DELETE requests |
| `http.all` | Mock all HTTP methods |

---

**Related SKILLS:** component-testing.md, hook-testing.md, api-testing.md, youtube-mocking.md
