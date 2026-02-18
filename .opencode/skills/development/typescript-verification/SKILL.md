---
name: typescript-verification
description: Ensure TypeScript type safety when working with external data using type guards and safe property access
license: MIT
compatibility: opencode
metadata:
  category: development
  complexity: intermediate
---

## What I do
- Use `unknown` type for external data
- Create type guard functions for complex types
- Use safe property access helpers
- Avoid direct type assertions without validation
- Provide default values for optional fields
- Handle null/undefined explicitly
- Use optional chaining `?.` and nullish coalescing `??`

## When to use me
Use this when you need to:
- Parse external data from APIs
- Type guard for complex types
- Access nested object properties safely
- Handle optional fields with default values

I'll ask clarifying questions if:
- The data structure is unclear
- Required fields are ambiguous

## Pattern: Basic Type Guard

```typescript
function isVideo(data: unknown): data is Video {
  if (!data || typeof data !== 'object') return false;
  const obj = data as Record<string, unknown>;

  return (
    typeof obj.id === 'string' &&
    typeof obj.title === 'string'
  );
}
```

## Pattern: Object Type Guard

```typescript
function isObject(data: unknown): data is Record<string, unknown> {
  return data !== null && typeof data === 'object';
}

function hasProperty<T extends string>(
  data: unknown,
  property: T
): data is Record<T, unknown> {
  return isObject(data) && property in data;
}
```

## Pattern: Safe Property Access

```typescript
function safeGet<T>(
  obj: unknown,
  key: string,
  defaultValue: T
): T {
  if (!obj || typeof obj !== 'object' || !(key in obj)) {
    return defaultValue;
  }

  const value = (obj as Record<string, unknown>)[key];
  return value !== undefined && value !== null
    ? (value as T)
    : defaultValue;
}
```

## Pattern: Safe String Access

```typescript
function safeGetString(obj: unknown, key: string): string {
  const value = safeGet(obj, key, '');
  return typeof value === 'string' ? value : String(value);
}
```

## Pattern: Safe Number Access

```typescript
function safeGetNumber(obj: unknown, key: string): number {
  const value = safeGet(obj, key, 0);
  return typeof value === 'number' ? value : Number(value) || 0;
}
```

## Pattern: External Data Validation

```typescript
function parseExternalData(input: unknown): ParsedData | null {
  if (!input || typeof input !== 'object') return null;

  const obj = input as Record<string, unknown>;

  if (!('id' in obj) || !('name' in obj)) {
    return null;
  }

  return {
    id: safeGetString(obj, 'id'),
    name: safeGetString(obj, 'name'),
    count: safeGetNumber(obj, 'count', 0)
  };
}
```

## Type Guard Templates

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

## Common Type Errors

### Error: Element implicitly has an any type

```typescript
// Problem
const data = obj.data[0];

// Solution
const dataArray = obj.data as unknown[];
const data = Array.isArray(dataArray) && dataArray[0]
  ? dataArray[0] as DataType
  : defaultValue;
```

### Error: Property does not exist on type '{}'

```typescript
// Problem
const thumbnail = obj.thumbnails[0].url;

// Solution
function getThumbnailUrl(obj: unknown): string {
  if (!obj || typeof obj !== 'object') return '';

  const data = obj as Record<string, unknown>;
  const thumbnails = data.thumbnails;

  if (!Array.isArray(thumbnails) || thumbnails.length === 0) return '';

  const first = thumbnails[0];
  if (!first || typeof first !== 'object') return '';

  const thumbnailObj = first as Record<string, unknown>;
  return typeof thumbnailObj.url === 'string' ? thumbnailObj.url : '';
}
```

## Explicit Type Annotations

```typescript
// Function with explicit return type
export async function getVideo(id: string): Promise<Video | null> {
  const data = await fetchData(id);
  return parseVideo(data);
}

// Function with typed parameters
export function processVideo(video: Video): ProcessedVideo {
  return {
    id: video.id,
    processedTitle: video.title.toUpperCase()
  };
}
```

## Optional Chaining & Nullish Coalescing

```typescript
// Optional chaining
const title = video?.basic_info?.title;
const views = stats?.view_count ?? 0;

// Nullish coalescing (null/undefined only)
const limit = options?.limit ?? 20;
```
