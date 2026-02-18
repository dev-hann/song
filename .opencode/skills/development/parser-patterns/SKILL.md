---
name: parser-patterns
description: Create parser functions for external data with basic and advanced patterns
license: MIT
compatibility: opencode
metadata:
  category: development
  complexity: intermediate
---

## What I do
- Create parser functions with `unknown` parameter type
- Return `Type | null` for all parser functions
- Check for null/undefined and object type
- Validate required fields
- Use type-safe property access with safeGet, safeGetString, safeGetNumber
- Create parsers for discriminated unions using switch statements
- Parse nested objects with helper functions
- Use Zod schemas for runtime validation
- Filter arrays with validation
- Collect parse errors for debugging
- Implement parser caching with WeakMap
- Handle YouTube.js special types (TextRun, duration, thumbnail)
- Provide default values for optional fields

## When to use me
Use this when you need to:
- Create parser functions for external data
- Parse YouTube.js response data
- Type guard for complex types
- Parse objects with unknown types
- Validate nested structures
- Handle optional fields with defaults
- Parse multiple types (video, channel, playlist) from single source
- Implement parser caching for performance

I'll ask clarifying questions if:
- The data structure is unclear
- Required vs optional fields are ambiguous
- Parser composition strategy is unclear

## Pattern: Basic Parser Function

```typescript
export function parseVideo(item: unknown): Video | null {
  // 1. Type guard: Check if object
  if (!item || typeof item !== 'object') {
    return null;
  }

  const obj = item as Record<string, unknown>;

  // 2. Validate required fields
  if (obj.type !== 'Video') {
    return null;
  }
  if (!obj.id || typeof obj.id !== 'string') {
    return null;
  }
  if (!obj.title || typeof obj.title !== 'string') {
    return null;
  }

  // 3. Extract and transform data
  return {
    id: obj.id,
    type: 'video',
    title: obj.title,
    description: String(obj.description ?? ''),
    duration: typeof obj.duration === 'number' ? obj.duration : 0,
    viewCount: typeof obj.view_count === 'number' ? obj.view_count : 0,
    thumbnail: getThumbnailUrl(obj.thumbnail),
    channel: parseChannelInfo(obj.channel)
  };
}
```

## Pattern: Safe Property Access Helpers

```typescript
function safeGet<T>(
  obj: unknown,
  key: string,
  defaultValue: T
): T {
  if (obj && typeof obj === 'object' && key in obj) {
    const value = (obj as Record<string, unknown>)[key];
    return value !== undefined && value !== null
      ? (value as T)
      : defaultValue;
  }
  return defaultValue;
}

function safeGetString(obj: unknown, key: string): string {
  const value = safeGet(obj, key, '');
  return typeof value === 'string' ? value : String(value);
}

function safeGetNumber(obj: unknown, key: string): number {
  const value = safeGet(obj, key, 0);
  return typeof value === 'number' ? value : 0;
}

function safeGetArray<T>(obj: unknown, key: string): T[] {
  const value = safeGet(obj, key, []);
  return Array.isArray(value) ? value : [];
}
```

## Pattern: YouTube.js Special Types

### TextRun Objects

```typescript
function extractText(text: string | { text: string }): string {
  if (typeof text === 'string') {
    return text;
  }

  if (typeof text === 'object' && text !== null && 'text' in text) {
    return String(text.text);
  }

  return '';
}

export function parseVideo(item: unknown): Video | null {
  if (!item || typeof item !== 'object') return null;
  const obj = item as Record<string, unknown>;

  return {
    id: safeGetString(obj, 'id'),
    title: extractText(obj.title),
    description: extractText(obj.description)
  };
}
```

### Duration Objects

```typescript
function extractDuration(duration: number | { seconds: number }): number {
  if (typeof duration === 'number') {
    return duration;
  }

  if (typeof duration === 'object' && duration !== null && 'seconds' in duration) {
    return typeof duration.seconds === 'number' ? duration.seconds : 0;
  }

  return 0;
}

export function parseVideo(item: unknown): Video | null {
  if (!item || typeof item !== 'object') return null;
  const obj = item as Record<string, unknown>;

  return {
    id: safeGetString(obj, 'id'),
    title: safeGetString(obj, 'title'),
    duration: extractDuration(obj.duration)
  };
}
```

### Thumbnail Objects

```typescript
function getThumbnailUrl(thumbnail: unknown): string {
  // Case 1: String URL
  if (typeof thumbnail === 'string') {
    return thumbnail;
  }

  // Case 2: Object with url property
  if (typeof thumbnail === 'object' && thumbnail !== null && 'url' in thumbnail) {
    const url = (thumbnail as { url: unknown }).url;
    return typeof url === 'string' ? url : '';
  }

  // Case 3: Array of thumbnails
  if (Array.isArray(thumbnail) && thumbnail.length > 0) {
    const firstThumbnail = thumbnail[0];
    return getThumbnailUrl(firstThumbnail);
  }

  // Case 4: Invalid
  return '';
}
```

### Best Quality Thumbnail

```typescript
function getBestThumbnail(thumbnails: unknown): string {
  if (!Array.isArray(thumbnails) || thumbnails.length === 0) {
    return '';
  }

  // Sort by resolution (width * height) descending
  const sorted = thumbnails
    .filter((t) => typeof t === 'object' && t !== null && 'url' in t && 'width' in t && 'height' in t)
    .sort((a, b) => {
      const sizeA = (a.width as number) * (a.height as number);
      const sizeB = (b.width as number) * (b.height as number);
      return sizeB - sizeA;
    });

  if (sorted.length > 0) {
    return String(sorted[0].url);
  }

  return '';
}
```

### Channel Info

```typescript
function parseChannelInfo(channel: unknown): ChannelInfo {
  if (!channel || typeof channel !== 'object') {
    return { id: '', name: '', thumbnail: '', subscribers: 0 };
  }

  const obj = channel as Record<string, unknown>;

  return {
    id: safeGetString(obj, 'id'),
    name: extractText(obj.name),
    thumbnail: getThumbnailUrl(obj.thumbnail),
    subscribers: safeGetNumber(obj, 'subscriberCount')
  };
}
```

## Pattern: Discriminated Union Parser

```typescript
export function parseSearchResult(item: unknown): SearchResult | null {
  if (!item || typeof item !== 'object') {
    return null;
  }

  const obj = item as Record<string, unknown>;

  switch (obj.type) {
    case 'Video':
      return parseVideo(obj);
    case 'Channel':
      return parseChannel(obj);
    case 'Playlist':
      return parsePlaylist(obj);
    default:
      return null;
  }
}
```

## Pattern: Nested Object Parser

```typescript
function parseChannelInfo(channel: unknown): ChannelInfo {
  if (!channel || typeof channel !== 'object') {
    return { id: '', name: '', thumbnail: '', subscribers: 0 };
  }

  const obj = channel as Record<string, unknown>;

  return {
    id: safeGetString(obj, 'id'),
    name: extractText(obj.name),
    thumbnail: getThumbnailUrl(obj.thumbnail),
    subscribers: safeGetNumber(obj, 'subscriberCount')
  };
}

export function parseVideo(item: unknown): Video | null {
  if (!item || typeof item !== 'object') return null;
  const obj = item as Record<string, unknown>;

  return {
    id: safeGetString(obj, 'id'),
    title: safeGetString(obj, 'title'),
    channel: parseChannelInfo(obj.channel) // Nested parsing
  };
}
```

## Pattern: Zod-Enhanced Parser

```typescript
import { VideoSchema } from '@/schemas/video';

export function parseVideo(item: unknown): Video | null {
  const result = VideoSchema.safeParse(item);
  return result.success ? result.data : null;
}
```

## Pattern: Array Parser

```typescript
// Basic array parser
export function parseVideos(items: unknown): Video[] {
  if (!Array.isArray(items)) {
    return [];
  }

  return items
    .map((item) => parseVideo(item))
    .filter((video): video is Video => video !== null);
}

// Array parser with validation
export function parseVideosWithValidation(items: unknown, maxItems = 100): Video[] {
  if (!Array.isArray(items)) {
    return [];
  }

  const videos: Video[] = [];

  for (const item of items) {
    if (videos.length >= maxItems) {
      break;
    }

    const video = parseVideo(item);
    if (video) {
      videos.push(video);
    }
  }

  return videos;
}
```

## Pattern: Error Collection

```typescript
interface ParseResult<T> {
  data: T[];
  errors: Array<{ item: unknown; error: string }>;
}

export function parseVideosWithErrorCollection(items: unknown): ParseResult<Video> {
  const result: ParseResult<Video> = { data: [], errors: [] };

  if (!Array.isArray(items)) {
    result.errors.push({ item: items, error: 'Not an array' });
    return result;
  }

  for (const item of items) {
    try {
      const video = parseVideo(item);
      if (video) {
        result.data.push(video);
      } else {
        result.errors.push({ item, error: 'Failed to parse' });
      }
    } catch (error) {
      result.errors.push({
        item,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  return result;
}
```

## Pattern: Parser with Caching

```typescript
const parseCache = new WeakMap<unknown, Video | null>();

export function parseVideoWithCache(item: unknown): Video | null {
  if (parseCache.has(item)) {
    return parseCache.get(item)!;
  }

  const result = parseVideo(item);
  parseCache.set(item, result);
  return result;
}
```

## Pattern: Parser with Transformation

```typescript
export function parseVideoAndTransform(item: unknown): TransformedVideo | null {
  const video = parseVideo(item);

  if (!video) {
    return null;
  }

  return {
    ...video,
    formattedDuration: formatDuration(video.duration),
    formattedViews: formatViewCount(video.viewCount),
    thumbnailUrl: getBestThumbnail(video.thumbnail)
  };
}
```

## Pattern: Parser with Validation Rules

```typescript
interface ValidationRule<T> {
  validate: (value: T) => boolean;
  error: string;
}

export function parseVideoWithRules(
  item: unknown,
  rules: ValidationRule<Video>[] = []
): Video | null {
  const video = parseVideo(item);

  if (!video) {
    return null;
  }

  for (const rule of rules) {
    if (!rule.validate(video)) {
      console.error(`Validation error: ${rule.error}`);
      return null;
    }
  }

  return video;
}
```

## Pattern: Parser Composition

```typescript
export function parseSearchResults(items: unknown): {
  videos: Video[];
  channels: Channel[];
  playlists: Playlist[];
} {
  const videos: Video[] = [];
  const channels: Channel[] = [];
  const playlists: Playlist[] = [];

  if (!Array.isArray(items)) {
    return { videos, channels, playlists };
  }

  for (const item of items) {
    const video = parseVideo(item);
    if (video) {
      videos.push(video);
      continue;
    }

    const channel = parseChannel(item);
    if (channel) {
      channels.push(channel);
      continue;
    }

    const playlist = parsePlaylist(item);
    if (playlist) {
      playlists.push(playlist);
    }
  }

  return { videos, channels, playlists };
}
```

## Pattern: Async Parser with Retry

```typescript
export async function parseVideoWithRetry(
  item: unknown,
  maxRetries = 3
): Promise<Video | null> {
  let lastError: Error | null = null;

  for (let i = 0; i < maxRetries; i++) {
    try {
      const video = await parseVideoAsync(item);
      if (video) {
        return video;
      }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
      await sleep(1000 * (i + 1)); // Exponential backoff
    }
  }

  throw lastError ?? new Error('Failed to parse after retries');
}
```

## Pattern: Type Guard Templates

```typescript
// Basic type guard
function isType<T>(value: unknown): value is T {
  // Implementation
}

// Object type guard
function isObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object';
}

// Array type guard
function isArray<T>(value: unknown): value is T[] {
  return Array.isArray(value);
}
```

## Common Validation Patterns

```typescript
// String validation
if (typeof value !== 'string') {
  return null;
}

// Number validation
if (typeof value !== 'number') {
  return defaultValue;
}

// Array validation
if (!Array.isArray(value)) {
  return [];
}

// Object validation
if (!value || typeof value !== 'object') {
  return defaultObject;
}

// Enum validation
const validTypes = ['Video', 'Channel', 'Playlist'] as const;
if (!validTypes.includes(obj.type as any)) {
  return null;
}
```

## Parser Function Template

```typescript
export function parseData(input: unknown): ParsedType | null {
  if (!input || typeof input !== 'object') {
    return null;
  }

  const obj = input as Record<string, unknown>;

  // Validate required fields
  if (!('id' in obj)) {
    return null;
  }

  return {
    id: safeGetString(obj, 'id'),
    name: safeGetString(obj, 'name'),
    // ... other fields with safe access
  };
}
```

## Checklist

Before committing parser code:

- [ ] Parameter type is `unknown`
- [ ] Return type is `Type | null`
- [ ] Check for null/undefined first
- [ ] Check typeof item === 'object'
- [ ] Validate required fields
- [ ] Use type-safe property access
- [ ] Provide default values for optional fields
- [ ] Return null for invalid input
- [ ] Export with named export
- [ ] Add JSDoc comments
- [ ] Handle YouTube.js special types correctly

## Quick Reference

| Helper | Purpose |
|--------|---------|
| `safeGet()` | Type-safe property access with default |
| `safeGetString()` | Get string value, convert if needed |
| `safeGetNumber()` | Get number value, convert if needed |
| `safeGetArray()` | Get array, ensure it's an array |

| YouTube.js Type | Format | Parser |
|-----------------|--------|--------|
| TextRun | `string` or `{ text: string }` | `extractText()` |
| Duration | `number` or `{ seconds: number }` | `extractDuration()` |
| Thumbnail | `string`, `{ url: string }`, or array | `getThumbnailUrl()` |
| Channel | Object with id, name, thumbnail | `parseChannelInfo()` |

| Advanced Pattern | Use For |
|------------------|---------|
| Discriminated Union | Type field discrimination |
| Nested Object | Complex object structures |
| Zod-Enhanced | Runtime validation |
| Array with Filtering | Filter invalid items |
| Error Collection | Collect all parse errors |
| Caching | Performance optimization |
| Transformation | Modify parsed data |
| Validation Rules | Custom validation logic |
| Composition | Parse multiple types |
| Async | Fetch additional data |
| Retry | Handle transient errors |

---

**Related SKILLS:** zod-validation.md, typescript-verification.md, utility-testing.md
