---
name: api-testing
description: Test API routes with proper validation, mocking, and error handling
license: MIT
compatibility: opencode
metadata:
  category: testing
  complexity: intermediate
---

## What I do
- Write tests for API routes using Vitest
- Mock external dependencies (YouTube.js, internal libraries)
- Test validation (required parameters, types)
- Test success cases
- Test error cases (API errors, network errors)
- Test response format (JSON, headers, structure)
- Follow AAA pattern (Arrange-Act-Assert)
- Use mock helpers for consistent test data

## When to use me
Use this when you need to:
- Write tests for API routes
- Mock external dependencies
- Test error handling in API routes
- Validate request/response formats
- Test query parameters and request bodies

I'll ask clarifying questions if:
- The HTTP method to test is unclear
- Required query parameters are ambiguous
- Error handling strategy needs clarification

## Pattern: Basic API Route Test
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from '@/app/api/youtube/search/route';

describe('GET /api/youtube/search', () => {
  let mockRequest: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockRequest = {
      url: new URL('http://localhost:3000/api/youtube/search'),
      nextUrl: { searchParams: new URLSearchParams() }
    };
  });

  it('should return 400 for missing query', async () => {
    mockRequest.url.searchParams.get.mockReturnValueOnce(null);
    const response = await GET(mockRequest);

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: 'Query parameter "q" is required'
    });
  });

  it('should return search results for valid query', async () => {
    mockRequest.url.searchParams.get.mockReturnValueOnce('test');

    const mockSearch = vi.fn().mockResolvedValueOnce({
      results: [mockVideo],
      has_continuation: false
    });
    vi.mock('@/lib/youtube', () => ({
      getInnertube: vi.fn().mockResolvedValue({ search: mockSearch })
    }));

    const response = await GET(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.results).toHaveLength(1);
  });
});
```

## Pattern: Mocking External Dependencies
```typescript
import { vi, beforeEach } from 'vitest';

describe('API Route with External Dependencies', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks();

    // Mock YouTube.js library
    vi.mock('youtubei.js', () => ({
      Innertube: {
        create: vi.fn().mockResolvedValue({
          search: vi.fn(),
          getInfo: vi.fn()
        })
      }
    }));

    // Mock internal library
    vi.mock('@/lib/youtube', () => ({
      getInnertube: vi.fn(),
      getYouTubeSession: vi.fn()
    }));
  });

  it('should call getInnertube with correct config', async () => {
    const mockRequest = createMockRequest({ q: 'test' });
    await GET(mockRequest);

    const { getInnertube } = await import('@/lib/youtube');
    expect(getInnertube).toHaveBeenCalled();
  });
});
```

## Pattern: Testing Error Cases
```typescript
describe('Error Handling', () => {
  it('should return 500 on YouTube.js error', async () => {
    vi.mock('@/lib/youtube', () => ({
      getInnertube: vi.fn().mockRejectedValue(new Error('API Error'))
    }));

    const mockRequest = createMockRequest({ q: 'test' });
    const response = await GET(mockRequest);

    expect(response.status).toBe(500);
    expect(await response.json()).toEqual({
      error: 'Internal server error'
    });
  });

  it('should return 404 for invalid video ID', async () => {
    const mockGetInfo = vi.fn().mockResolvedValue(null);
    vi.mock('@/lib/youtube', () => ({
      getInnertube: vi.fn().mockResolvedValue({ getInfo: mockGetInfo })
    }));

    const mockRequest = createMockRequest({ id: 'invalid' });
    const response = await GET(mockRequest);

    expect(response.status).toBe(404);
  });
});
```

## Pattern: Testing Query Parameters
```typescript
describe('Query Parameters', () => {
  it('should parse query parameter', async () => {
    const mockRequest = createMockRequest({ q: 'test' });

    const response = await GET(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(200);
  });

  it('should handle multiple parameters', async () => {
    const mockRequest = createMockRequest({
      q: 'test',
      filter: 'video',
      limit: '10'
    });

    const response = await GET(mockRequest);
    const data = await response.json();

    expect(response.status).toBe(200);
  });

  it('should validate parameter types', async () => {
    const mockRequest = createMockRequest({ limit: 'invalid' });
    const response = await GET(mockRequest);

    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({
      error: 'Invalid limit parameter'
    });
  });
});
```

## Pattern: Testing Response Format
```typescript
describe('Response Format', () => {
  it('should return JSON response', async () => {
    const mockRequest = createMockRequest({ q: 'test' });
    const response = await GET(mockRequest);

    expect(response.headers.get('content-type')).toContain('application/json');
  });

  it('should include CORS headers', async () => {
    const mockRequest = createMockRequest({ q: 'test' });
    const response = await GET(mockRequest);

    expect(response.headers.get('access-control-allow-origin')).toBe('*');
  });

  it('should have correct response structure', async () => {
    const mockRequest = createMockRequest({ q: 'test' });
    const response = await GET(mockRequest);
    const data = await response.json();

    expect(data).toHaveProperty('results');
    expect(Array.isArray(data.results)).toBe(true);
  });
});
```

## Mock Helper Functions
```typescript
// __tests__/utils/api-helpers.ts

export function createMockRequest(params: Record<string, string>): any {
  const url = new URL(`http://localhost:3000/api/youtube/search`);
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });

  return {
    url,
    nextUrl: { searchParams: url.searchParams }
  };
}

export function createMockVideo(overrides = {}): Video {
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
      thumbnail: ''
    },
    ...overrides
  };
}
```

## Test Organization
```typescript
describe('GET /api/youtube/search', () => {
  describe('Validation', () => {
    it('should require query parameter');
    it('should validate query type');
    it('should validate optional parameters');
  });

  describe('Success Cases', () => {
    it('should return search results');
    it('should handle pagination');
    it('should filter by type');
  });

  describe('Error Cases', () => {
    it('should handle YouTube API errors');
    it('should handle network errors');
    it('should handle timeout errors');
  });

  describe('Response Format', () => {
    it('should return JSON');
    it('should include CORS headers');
    it('should have correct structure');
  });
});
```

## AAA Pattern
```typescript
describe('AAA Pattern Example', () => {
  it('should return search results', async () => {
    // Arrange
    const mockRequest = createMockRequest({ q: 'test' });
    const mockSearch = vi.fn().mockResolvedValue({
      results: [createMockVideo()],
      has_continuation: false
    });
    vi.mock('@/lib/youtube', () => ({
      getInnertube: vi.fn().mockResolvedValue({ search: mockSearch })
    }));

    // Act
    const response = await GET(mockRequest);
    const data = await response.json();

    // Assert
    expect(response.status).toBe(200);
    expect(data.results).toHaveLength(1);
    expect(data.results[0].title).toBe('Test Video');
  });
});
```
