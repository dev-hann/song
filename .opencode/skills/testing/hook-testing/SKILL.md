---
name: hook-testing
description: Test React Hooks with proper state management and async handling using renderHook
license: MIT
compatibility: opencode
metadata:
  category: testing
  complexity: intermediate
---

## What I do
- Test React Hooks using `renderHook` from @testing-library/react
- Test state changes and re-renders
- Test async operations with `waitFor`
- Test error handling and loading states
- Test custom hooks with proper mocking
- Follow AAA pattern (Arrange-Act-Assert)
- Use mock helpers for consistent test data

## When to use me
Use this when you need to:
- Write tests for custom React hooks
- Test state management in hooks
- Test async operations in hooks
- Test error handling in hooks
- Test loading states in hooks

I'll ask clarifying questions if:
- Hook behavior needs clarification
- Test scenarios need clarification

## Pattern: Basic Hook Test
```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useYouTubeSearch } from '@/hooks/use-youtube';

vi.mock('@/lib/api-helpers', () => ({
  fetchAPI: vi.fn(),
}));

describe('useYouTubeSearch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with empty state', () => {
    const { result } = renderHook(() => useYouTubeSearch());

    expect(result.current.results).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBe('');
  });
});
```

## Pattern: Testing Async Operations
```typescript
describe('Async Operations', () => {
  it('should fetch and display search results', async () => {
    const mockData = {
      results: [
        {
          id: 'video123',
          type: 'video',
          title: 'Test Video',
          thumbnail: 'https://example.com/thumb.jpg',
          channel: { name: 'Test Channel' },
        },
      ],
    };

    const { fetchAPI } = await import('@/lib/api-helpers');
    vi.mocked(fetchAPI).mockResolvedValue(mockData);

    const { result } = renderHook(() => useYouTubeSearch());

    await result.current.searchVideos('test query');

    await waitFor(() => {
      expect(result.current.results).toHaveLength(1);
      expect(result.current.loading).toBe(false);
    });
  });

  it('should handle search errors', async () => {
    const { fetchAPI } = await import('@/lib/api-helpers');
    vi.mocked(fetchAPI).mockRejectedValue(new Error('Search failed'));

    const { result } = renderHook(() => useYouTubeSearch());

    await result.current.searchVideos('test query');

    await waitFor(() => {
      expect(result.current.error).toBe('Search failed');
      expect(result.current.loading).toBe(false);
    });
  });
});
```

## Pattern: Testing Loading States
```typescript
describe('Loading States', () => {
  it('should set loading to true when searching', async () => {
    const { fetchAPI } = await import('@/lib/api-helpers');
    vi.mocked(fetchAPI).mockImplementation(
      () => new Promise(() => {})
    );

    const { result } = renderHook(() => useYouTubeSearch());
    result.current.searchVideos('test query');

    expect(result.current.loading).toBe(true);
  });
});
```

## Pattern: Testing State Updates
```typescript
describe('State Updates', () => {
  it('should update results on multiple searches', async () => {
    const mockData1 = {
      results: [{ id: 'video1', type: 'video', title: 'Video 1', thumbnail: 'https://example.com/thumb.jpg', channel: { name: 'Test Channel' } }],
    };

    const mockData2 = {
      results: [{ id: 'video2', type: 'video', title: 'Video 2', thumbnail: 'https://example.com/thumb.jpg', channel: { name: 'Test Channel' } }],
    };

    const { fetchAPI } = await import('@/lib/api-helpers');
    vi.mocked(fetchAPI)
      .mockResolvedValueOnce(mockData1)
      .mockResolvedValueOnce(mockData2);

    const { result } = renderHook(() => useYouTubeSearch());

    await result.current.searchVideos('query1');
    await waitFor(() => {
      expect(result.current.results?.[0]?.id).toBe('video1');
    });

    await result.current.searchVideos('query2');
    await waitFor(() => {
      expect(result.current.results?.[0]?.id).toBe('video2');
    });
  });
});
```

## Pattern: Testing Edge Cases
```typescript
describe('Edge Cases', () => {
  it('should not search with empty query', async () => {
    const { fetchAPI } = await import('@/lib/api-helpers');
    vi.mocked(fetchAPI).mockResolvedValue({ results: [] });

    const { result } = renderHook(() => useYouTubeSearch());

    await result.current.searchVideos('');

    expect(fetchAPI).not.toHaveBeenCalled();
  });

  it('should handle null results', async () => {
    const { fetchAPI } = await import('@/lib/api-helpers');
    vi.mocked(fetchAPI).mockResolvedValue({ results: null });

    const { result } = renderHook(() => useYouTubeSearch());

    await result.current.searchVideos('test');

    await waitFor(() => {
      expect(result.current.results).toBeNull();
    });
  });
});
```

## Test Organization
```typescript
describe('useYouTubeSearch', () => {
  describe('Initialization', () => {
    it('should initialize with empty state');
  });

  describe('Loading States', () => {
    it('should set loading to true when searching');
  });

  describe('Success Cases', () => {
    it('should fetch and display search results');
    it('should update results on multiple searches');
  });

  describe('Error Cases', () => {
    it('should handle search errors');
    it('should handle network errors');
  });

  describe('Edge Cases', () => {
    it('should not search with empty query');
    it('should handle null results');
  });
});
```

## AAA Pattern
```typescript
describe('AAA Pattern Example', () => {
  it('should fetch and display search results', async () => {
    // Arrange
    const mockData = { results: [{ id: 'video123', type: 'video', title: 'Test Video', thumbnail: 'https://example.com/thumb.jpg', channel: { name: 'Test Channel' } }] };
    const { fetchAPI } = await import('@/lib/api-helpers');
    vi.mocked(fetchAPI).mockResolvedValue(mockData);

    // Act
    const { result } = renderHook(() => useYouTubeSearch());
    await result.current.searchVideos('test query');

    // Assert
    await waitFor(() => {
      expect(result.current.results).toHaveLength(1);
      expect(result.current.loading).toBe(false);
    });
  });
});
```

## Testing Patterns Reference

| Test Type | What to Test |
|-----------|--------------|
| Hook Initialization | Initial state values |
| Loading States | Loading flag during async operations |
| Success Cases | Correct data after successful operations |
| Error Cases | Error messages and state on failures |
| State Updates | State changes on subsequent calls |
| Edge Cases | Empty inputs, null values, etc. |

| Pattern | Description |
|---------|-------------|
| `renderHook` | Render a hook for testing |
| `waitFor` | Wait for async state updates |
| `vi.clearAllMocks` | Clear all mocks before each test |
| `vi.mocked` | Type-safe mock access |
| `await import()` | Lazy import for mocking |

---

**Related SKILLS:** component-testing.md, api-testing.md, utility-testing.md
