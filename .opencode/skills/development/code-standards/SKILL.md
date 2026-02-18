---
name: code-standards
description: Comprehensive code formatting, commenting, naming, and import/export conventions
license: MIT
compatibility: opencode
metadata:
  category: development
  complexity: intermediate
---

## What I do
- Format code with 2 spaces and lines under 100 characters
- Add JSDoc comments for public APIs and inline comments explaining WHY
- Use kebab-case for files, PascalCase for components/types, camelCase for variables
- Import in order: External → Internal (@/) → Relative → Type-only
- Use named exports (not default exports)
- Add trailing commas and semicolons consistently
- Use double quotes and consistent spacing

## When to use me
Use this when you need to:
- Format code consistently
- Document public functions and types
- Name files, components, variables, and constants
- Organize imports and exports
- Follow project style guidelines

I'll ask clarifying questions if:
- Formatting rule is unclear

## Pattern: Code Formatting

### Indentation

```typescript
// ✅ Good (2 spaces)
function example() {
  if (condition) {
    doSomething();
  }
}

// ❌ Bad (4 spaces or tabs)
function example() {
    if (condition) {
        doSomething();
    }
}
```

### Line Length

```typescript
// ✅ Good (within 100 chars)
export async function getVideoInfo(videoId: string): Promise<VideoInfo | null> {
  const info = await fetchVideo(videoId);
  return info;
}

// ✅ Good (break long lines)
export async function searchVideos(
  query: string,
  filter: SearchFilter = 'video'
): Promise<Video[]> {
  const results = await search(query, filter);
  return results;
}

// ❌ Bad (too long)
export async function searchVideos(query: string, filter: SearchFilter = 'video', limit: number = 20): Promise<Video[]> { }
```

### Trailing Commas

```typescript
// ✅ Good
const videos = [
  { id: '1', title: 'Video 1' },
  { id: '2', title: 'Video 2' },
];

function process(videos: Video[], options?: { limit?: number }) {
  // ...
}

// ❌ Bad
const videos = [
  { id: '1', title: 'Video 1' },
  { id: '2', title: 'Video 2' }
];
```

### Semicolons & Quotes

```typescript
// ✅ Good (semicolons, double quotes)
const video = { id: '1', title: 'Video 1' };
const title = video.title;
export function getVideo() { }

// Acceptable (single quotes)
const title = 'Video Title';
```

### Spacing

```typescript
// ✅ Good
const videos = [video1, video2, video3];
const obj = { a: 1, b: 2 };
const sum = a + b;
func(arg1, arg2);

// ❌ Bad
const videos = [video1,video2,video3];
const obj = {a:1,b:2};
const sum = a+b;
```

## Pattern: JSDoc Comments

```typescript
/**
 * Fetches a video's information from YouTube.
 *
 * @param videoId - The YouTube video ID (e.g., "dQw4w9WgXcQ")
 * @returns Promise that resolves to video information or null if not found
 */
export async function getVideoInfo(videoId: string): Promise<VideoInfo | null> {
  const innertube = await getInnertube();
  const info = await innertube.getInfo(videoId);
  return info;
}

/**
 * Represents a YouTube video.
 */
export interface Video {
  /** The YouTube video ID */
  id: string;

  /** The video title */
  title: string;

  /** Duration in seconds */
  duration: number;
}
```

## Pattern: Inline Comments

```typescript
// ✅ Good - Explains why
// Cache session to avoid re-initializing Innertube on each request
let innertubeInstance: Innertube | null = null;

// ✅ Good - Explains complex logic
// Handle YouTube.js special type where duration can be number or { seconds: number }
const duration = typeof rawDuration === 'number'
  ? rawDuration
  : rawDuration?.seconds ?? 0;

// ✅ Good - Explains design decision
// Use WeakMap for cache (no memory leak, no manual cleanup needed)
const parseCache = new WeakMap<unknown, Video | null>();

// ❌ Bad - Explains what (obvious)
// Create a variable for the video ID
const videoId = "dQw4w9WgXcQ";
```

## Pattern: Comment Types

```typescript
// TODO: Implement caching for better performance
// TODO: Add error handling for rate limits

// FIXME: This is a temporary workaround for YouTube API rate limits
const delay = () => new Promise(resolve => setTimeout(resolve, 1000));

// NOTE: This function is edge-compatible, cannot use Node.js APIs
export async function GET(request: NextRequest) { }

// XXX: This mutates the input object - should refactor to be immutable
function updateVideo(video: Video): Video {
  video.viewCount += 1;
  return video;
}

// === Section Separator ===
// ==================== Session Management ====================
```

## Pattern: File Naming

| File Type | Format | Example |
|-----------|--------|---------|
| Component | kebab-case → PascalCase | `video-card.tsx` → `VideoCard` |
| Utility | kebab-case | `video-helpers.ts` |
| Type | kebab-case | `types/video.ts` |
| Schema | kebab-case | `schemas/video.ts` |
| API Route | kebab-case | `api/youtube/search/route.ts` |
| Page | kebab-case | `app/page.tsx`, `app/search/page.tsx` |

## Pattern: Naming Conventions

```typescript
// Variables and functions: camelCase
const videoId = 'dQw4w9WgXcQ';
const sessionCache = new Map();
async function getYouTubeSession() { }

// Classes, interfaces, types: PascalCase
class YouTubeService { }
interface VideoInfo { }
type VideoQuality = '360p' | '720p';

// Constants: SCREAMING_SNAKE_CASE
const DEFAULT_LANGUAGE = 'ko';
const SUPPORTED_QUALITIES = ['360p', '720p'];
```

## Pattern: Import Order

```typescript
// 1. External libraries
import { useState } from 'react';
import { NextRequest, NextResponse } from 'next/server';
import { Innertube } from 'youtubei.js';

// 2. Internal imports (using @/ alias)
import { Video } from '@/types/video';
import { getYouTubeSession } from '@/lib/youtube';
import { VideoSchema } from '@/schemas/video';

// 3. Relative imports
import { localHelper } from './helpers';
import { utils } from '../utils';

// 4. Type-only imports
import type { VideoInfo } from '@/types/video';
import type { SessionConfig } from '@/types/session';
```

## Pattern: Named Exports (Preferred)

```typescript
// ✅ Good: Named exports
export async function getInnertube(): Promise<Innertube> {
  return Innertube.create({ generate_session_locally: true });
}

export async function getYouTubeSession(): Promise<Session> {
  const innertube = await getInnertube();
  return innertube.session;
}

// Import usage
import { getInnertube, getYouTubeSession } from '@/lib/youtube';

// ❌ Avoid: Default exports
export default async function getInnertube() {
  return Innertube.create({ generate_session_locally: true });
}
```

## Pattern: Re-exports & Barrel Files

```typescript
// Re-export multiple functions from single file
export {
  getInnertube,
  getYouTubeSession,
  createSession
} from './youtube';

// Re-export multiple types
export type {
  Video,
  VideoInfo,
  SessionConfig
} from './types';

// Barrel file: types/video/index.ts
export type { Video } from './video';
export type { VideoInfo } from './video-info';
export type { VideoMetadata } from './metadata';
```

## Checklist

Before committing code:

- [ ] 2 spaces for indentation (no tabs)
- [ ] Lines under 100 characters
- [ ] Trailing commas in multi-line arrays/objects
- [ ] Semicolons at end of statements
- [ ] JSDoc comments for public APIs
- [ ] Inline comments explain WHY (not WHAT)
- [ ] Component files use kebab-case (e.g., `video-card.tsx`)
- [ ] Component names use PascalCase (e.g., `VideoCard`)
- [ ] Variable names use camelCase
- [ ] Type names use PascalCase
- [ ] Constants use SCREAMING_SNAKE_CASE
- [ ] Imports in correct order (External → Internal → Relative → Type-only)
- [ ] Named exports (not default exports)

## Quick Reference

| Category | Rule | Example |
|----------|------|---------|
| Indentation | 2 spaces | `function() {` |
| Line length | < 100 chars | `func(a, b)` |
| Trailing commas | In multi-line | `['a', 'b', ]` |
| Semicolons | Always | `const x = 1;` |
| Quotes | Double (single OK) | `"text"` |
| Spaces | After commas/colons | `a + b` |
| JSDoc | Public APIs | See above |
| Inline | Explain WHY | `// Cache to avoid...` |
| File names | kebab-case | `video-card.tsx` |
| Component names | PascalCase | `VideoCard` |
| Variables | camelCase | `videoId` |
| Types | PascalCase | `VideoInfo` |
| Constants | SCREAMING_SNAKE | `MAX_COUNT` |
| Imports | External → @/ → . | See above |
| Exports | Named | `export function` |

---

**Related SKILLS:** react-components.md, zod-validation.md, parser-patterns.md
