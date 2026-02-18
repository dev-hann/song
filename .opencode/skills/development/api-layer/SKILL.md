---
name: api-layer
description: API request pattern with Query Layer, centralized query key management with factory pattern, and TanStack Query integration
license: MIT
compatibility: opencode
metadata:
  category: development
  complexity: intermediate
---

## What I do
- Create API layer in `src/services/api/` for all API requests
- Create Query Layer in `src/queries/` for centralized query management
- Use TanStack Query for state management with caching and refetching
- Manage query keys with factory pattern for type safety
- Separate API logic from components and hooks
- Ensure consistent error handling across all API calls
- Follow resource-based file organization

## When to use me
Use this when you need to:
- Add new API endpoints
- Modify existing API request logic
- Create hooks for API data fetching
- Integrate with TanStack Query
- Handle API errors consistently
- Manage query keys with factory pattern

I'll ask clarifying questions if:
- API endpoint structure is unclear
- Caching strategy needs clarification
- Query key pattern needs clarification

## Architecture Overview

```
┌─────────────────┐
│   Components    │
└────────┬────────┘
          │
┌────────▼────────┐
│     Hooks       │ (useSearch, useAudioInfo, etc.)
└────────┬────────┘
          │
┌────────▼────────┐
│   Query Layer   │ (useSearchQuery, useAudioInfoQuery, etc.)
│   src/queries/  │ (Query Keys, Query Options, Mutations)
└────────┬────────┘
          │
┌────────▼────────┐
│   API Layer     │ (fetchSearch, fetchAudioInfo, etc.)
│  src/services/  │
└────────┬────────┘
          │
┌────────▼────────┐
│  API Endpoints  │ (/api/youtube/...)
└─────────────────┘
```

## Pattern: Query Layer Structure

### Directory Organization

```
src/queries/
├── index.ts                    # Barrel file
├── keys.ts                     # Query key factory pattern
├── options.ts                  # Common query options
├── search.ts                   # Search-related queries
└── audio.ts                    # Audio-related queries and mutations
```

### Query Key Factory Pattern

```typescript
// src/queries/keys.ts
export const queryKeys = {
  all: ['youtube'] as const,

  search: {
    all: () => [...queryKeys.all, 'search'] as const,
    query: (q: string) => [...queryKeys.search.all(), q] as const,
  },

  audio: {
    all: () => [...queryKeys.all, 'audio'] as const,
    info: (id: string) => [...queryKeys.audio.all(), 'info', id] as const,
    stream: (id: string) => [...queryKeys.audio.all(), 'stream', id] as const,
  },
} as const;
```

**Benefits:**
- Hierarchical structure for organized query management
- Type safety with `as const`
- Easy query invalidation
- IDE autocompletion support

**Usage Example:**

```typescript
// Invalidate specific query
queryClient.invalidateQueries({
  queryKey: queryKeys.audio.info('abc123')
});

// Invalidate all audio-related queries
queryClient.invalidateQueries({
  queryKey: queryKeys.audio.all()
});
```

### Common Query Options

```typescript
// src/queries/options.ts
import type { UseQueryOptions } from '@tanstack/react-query';

export const commonQueryOptions: Partial<UseQueryOptions> = {
  staleTime: 5 * 60 * 1000,
  refetchOnWindowFocus: false,
  retry: 1,
};

export const queryOptions = {
  search: {
    ...commonQueryOptions,
    staleTime: 5 * 60 * 1000,
  },

  audioInfo: {
    ...commonQueryOptions,
    staleTime: 10 * 60 * 1000,
  },

  audioStream: {
    ...commonQueryOptions,
    staleTime: 5 * 60 * 1000,
  },
} as const;
```

### Query Implementation

```typescript
// src/queries/search.ts
import { useQuery } from '@tanstack/react-query';
import { queryKeys, queryOptions } from './keys';
import { fetchSearch } from '@/services/api';

export function useSearchQuery(query: string) {
  return useQuery({
    queryKey: queryKeys.search.query(query),
    queryFn: () => fetchSearch(query),
    enabled: query.trim().length > 0,
    ...queryOptions.search,
  });
}
```

### Mutation Implementation

```typescript
// src/queries/audio.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from './keys';

export function useLikeMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => {
      return Promise.resolve();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.audio.all(),
      });
    },
  });
}
```

### Barrel File

```typescript
// src/queries/index.ts
export * from './keys';
export * from './options';
export * from './search';
export * from './audio';
```

## Pattern: API Layer Structure

### Directory Organization

```
src/services/
├── api/
│   ├── search.ts          # Search-related API functions
│   ├── audio.ts           # Audio-related API functions
│   └── index.ts           # Barrel file for exports
└── index.ts               # Main barrel file
```

### Resource-Based File Organization

```typescript
// ✅ Good: Resource-based separation
// src/services/api/search.ts
export async function fetchSearch(query: string): Promise<SearchResult[]> { }

// src/services/api/audio.ts
export async function fetchAudioInfo(audioId: string): Promise<AudioInfo> { }
export async function fetchAudioStream(audioId: string): Promise<StreamUrl> { }

// src/services/api/index.ts
export { fetchSearch } from './search';
export { fetchAudioInfo, fetchAudioStream } from './audio';

// ❌ Bad: Single file for all APIs
// src/services/api.ts
export async function fetchSearch() { }
export async function fetchAudioInfo() { }
export async function fetchAudioStream() { }
```

## Pattern: API Function Implementation

### Basic API Function

```typescript
import type { SearchResultAudio } from '@/types';

/**
 * Fetches search results for a given query.
 *
 * @param query - Search query string
 * @returns Promise resolving to search results array
 * @throws Error if request fails
 */
export async function fetchSearch(query: string): Promise<SearchResultAudio[]> {
  const response = await fetch(`/api/youtube/search?q=${encodeURIComponent(query)}`);
  
  if (!response.ok) {
    throw new Error(`Failed to search: ${response.statusText}`);
  }

  const data = await response.json();
  return data.results || [];
}
```

### API Function with Error Handling

```typescript
import type { ExtendedAudio } from '@/types';

/**
 * Fetches audio information for a given video ID.
 *
 * @param audioId - YouTube audio/video ID
 * @returns Promise resolving to extended audio information
 * @throws Error if request fails or API returns error
 */
export async function fetchAudioInfo(audioId: string): Promise<ExtendedAudio> {
  const response = await fetch(`/api/youtube/audio/info?id=${encodeURIComponent(audioId)}`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch audio info: ${response.statusText}`);
  }

  const data = await response.json();
  
  if (data.error) {
    throw new Error(data.error);
  }

  return data;
}
```

## Pattern: Hook with Query Layer

### Basic Hook Implementation

```typescript
'use client';

import { useAudioInfoQuery } from '@/queries';
import type { ExtendedAudio } from '@/types';

interface UseAudioInfoOptions {
  enabled?: boolean;
}

/**
 * Custom hook for fetching audio information by ID.
 * Uses TanStack Query Query Layer for API state management with caching.
 *
 * @param audioId - The YouTube audio ID to fetch information for
 * @param options - Query options like enabled flag
 * @returns Query result with audio data, status, and error
 */
export function useAudioInfo(audioId: string | null, options: UseAudioInfoOptions = {}) {
  const { enabled = true } = options;

  const query = useAudioInfoQuery(enabled ? audioId : null);

  return {
    ...query,
    data: query.data,
    error: query.error,
  };
}
```

### Hook with Custom Interface (Hybrid Approach)

```typescript
'use client';

import { useState } from 'react';
import { useSearchQuery } from '@/queries';
import type { UseSearchReturn } from '@/types/hooks';
import { SearchStatus } from '@/constants';

/**
 * Custom hook for managing search functionality.
 * Handles search queries, results, status, and recent searches.
 * Uses TanStack Query Query Layer for API state management with caching.
 *
 * @returns Search state and handler functions
 */
export function useSearch(): UseSearchReturn {
  const [query, setQuery] = useState('');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [shouldSearch, setShouldSearch] = useState(false);

  const { data: results = [], status: queryStatus } = useSearchQuery(
    shouldSearch ? query : ''
  );

  const status = (() => {
    if (!shouldSearch) return SearchStatus.IDLE;
    if (queryStatus === 'pending') return SearchStatus.LOADING;
    if (queryStatus === 'error') return SearchStatus.ERROR;
    if (queryStatus === 'success') return SearchStatus.SUCCESS;
    return SearchStatus.IDLE;
  })();

  const search = async () => {
    if (!query.trim()) return;

    if (!recentSearches.includes(query)) {
      setRecentSearches([query, ...recentSearches.slice(0, 9)]);
    }

    setShouldSearch(true);
  };

  const clearResults = () => {
    setShouldSearch(false);
    setQuery('');
  };

  return {
    query,
    results,
    status,
    recentSearches,
    setQuery,
    search,
    clearResults,
    clearRecentSearches: () => setRecentSearches([]),
    removeRecentSearch: (search: string) => {
      setRecentSearches(recentSearches.filter(s => s !== search));
    },
  };
}
```

## Pattern: TanStack Query Caching Strategy

### Stale Time Configuration

```typescript
// Search results: 5 minutes (frequently changing content)
staleTime: 1000 * 60 * 5,

// Audio info: 10 minutes (static content)
staleTime: 1000 * 60 * 10,

// Stream URL: 5 minutes (short-lived tokens)
staleTime: 1000 * 60 * 5,
```

### Query Key Structure

```typescript
// Simple key
queryKey: ['audioInfo', audioId]

// Composite key
queryKey: ['search', query, filter]

// Nested key
queryKey: ['user', userId, 'playlists', 'liked']
```

### Refetch Configuration

```typescript
useQuery({
  queryKey: ['data'],
  queryFn: fetchData,
  
  // Disable refetch on window focus
  refetchOnWindowFocus: false,
  
  // Refetch on reconnect
  refetchOnReconnect: true,
  
  // Refetch on mount (if stale)
  refetchOnMount: true,
  
  // Retry failed requests
  retry: 1,
  
  // Retry delay
  retryDelay: 1000,
});
```

## Pattern: Using API Layer in Stores

### Zustand Store with API Layer

```typescript
import { create } from 'zustand';
import { fetchAudioInfo } from '@/services/api';

export const useAudioStore = create<AudioStore>((set) => ({
  audio: null,
  status: AudioStatus.IDLE,

  setAudio: async (audioId: string) => {
    set({ status: AudioStatus.LOADING });

    try {
      const audioData = await fetchAudioInfo(audioId);
      
      set({
        audio: audioData,
        status: AudioStatus.READY,
      });
    } catch (error) {
      console.error('Error fetching audio info:', error);
      set({ status: AudioStatus.ERROR });
    }
  },
}));
```

## Pattern: Barrel Files

### API Module Barrel File

```typescript
// src/services/api/index.ts
export { fetchSearch } from './search';
export { fetchAudioInfo, fetchAudioStream } from './audio';
```

### Main Services Barrel File

```typescript
// src/services/index.ts
export * from './api';
```

## Rules

### MUST

- ✅ All API requests MUST go through `src/services/api/`
- ✅ All queries MUST use Query Layer from `src/queries/`
- ✅ Query keys MUST use factory pattern from `src/queries/keys.ts`
- ✅ Hooks MUST NOT call `fetch` directly
- ✅ Hooks MUST use Query Layer functions (not TanStack Query directly)
- ✅ API functions MUST throw errors on failure
- ✅ Use TanStack Query for all data fetching in components
- ✅ Handle errors gracefully in hooks and components
- ✅ Use appropriate `staleTime` based on data volatility

### SHOULD

- ✅ SHOULD organize API functions by resource
- ✅ SHOULD organize queries by resource in Query Layer
- ✅ SHOULD provide JSDoc comments for API functions
- ✅ SHOULD use `enabled` option to conditionally run queries
- ✅ SHOULD set `refetchOnWindowFocus: false` for most queries
- ✅ SHOULD type all API function parameters and returns
- ✅ SHOULD use query key factory pattern for type safety
- ✅ SHOULD use query keys for invalidation

### MUST NOT

- ❌ MUST NOT call `fetch` directly in components or hooks
- ❌ MUST NOT use TanStack Query directly in hooks (use Query Layer)
- ❌ MUST NOT hardcode query keys (use factory pattern)
- ❌ MUST NOT mix API logic with UI logic
- ❌ MUST NOT use default exports for API functions
- ❌ MUST NOT hardcode API URLs (use path parameters)
- ❌ MUST NOT ignore errors from API calls

## Checklist

Before adding new API endpoints:

- [ ] Create API function in `src/services/api/[resource].ts`
- [ ] Function has proper TypeScript types
- [ ] Function has JSDoc documentation
- [ ] Function throws errors on failure
- [ ] Add export to barrel file (`src/services/api/index.ts`)
- [ ] Create query function in `src/queries/[resource].ts`
- [ ] Query uses factory pattern from `src/queries/keys.ts`
- [ ] Query has appropriate caching configuration
- [ ] Add export to barrel file (`src/queries/index.ts`)
- [ ] Create hook using Query Layer function
- [ ] Hook exported from hooks barrel file
- [ ] Test API function with MSW

## Quick Reference

| Concept | Pattern | Example |
|---------|---------|---------|
| API Layer | Resource files | `src/services/api/audio.ts` |
| Query Layer | Resource files | `src/queries/audio.ts` |
| API Function Naming | `fetch[Resource]` | `fetchAudioInfo()` |
| Query Function Naming | `use[Resource]Query` | `useAudioInfoQuery()` |
| Hook Naming | `use[Resource]` | `useAudioInfo()` |
| Query Keys | Factory pattern | `queryKeys.audio.info(id)` |
| Query Invalidator | Use query keys | `queryClient.invalidateQueries({ queryKey: queryKeys.audio.all() })` |
| Stale Time | Data volatility | `staleTime: 1000 * 60 * 5` |
| Error Handling | Throw errors | `throw new Error(msg)` |
| Exports | Named | `export async function` |

---

**Related SKILLS:** code-standards.md, react-components.md, hook-testing.md, api-testing.md
