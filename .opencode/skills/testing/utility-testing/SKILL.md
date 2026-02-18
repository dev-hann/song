---
name: utility-testing
description: Test utility functions, parsers, and schemas with proper validation patterns
license: MIT
compatibility: opencode
metadata:
  category: testing
  complexity: intermediate
---

## What I do
- Write tests for parser functions using Vitest
- Write tests for formatter functions
- Write tests for Zod schemas
- Follow AAA pattern (Arrange-Act-Assert)
- Test valid inputs, invalid inputs, and edge cases
- Test YouTube.js special types (TextRun, duration, thumbnail)
- Test nested objects
- Use mock helpers for consistent test data
- Ensure descriptive test names ("should X when Y")

## When to use me
Use this when you need to:
- Write tests for parser functions
- Write tests for formatter functions
- Write tests for Zod schemas
- Test type validation and type guards
- Test parsing of complex data structures

I'll ask clarifying questions if:
- Test scenarios need clarification

## Pattern: Parser Function Test
```typescript
import { describe, it, expect } from 'vitest';
import { parseVideo } from '@/lib/parsers';

describe('parseVideo', () => {
  it('should parse valid video object', () => {
    const validVideo = {
      type: 'Video',
      id: 'video123',
      title: 'Test Video',
      duration: { seconds: 120 },
      view_count: 5000
    };

    const result = parseVideo(validVideo);

    expect(result).not.toBeNull();
    expect(result?.id).toBe('video123');
    expect(result?.title).toBe('Test Video');
    expect(result?.duration).toBe(120);
    expect(result?.viewCount).toBe(5000);
  });

  it('should return null for non-object input', () => {
    const result = parseVideo('not an object');
    expect(result).toBeNull();
  });

  it('should return null for wrong type', () => {
    const result = parseVideo({ type: 'Channel' });
    expect(result).toBeNull();
  });

  it('should handle missing optional fields', () => {
    const minimalVideo = {
      type: 'Video',
      id: 'video123',
      title: 'Test Video'
    };

    const result = parseVideo(minimalVideo);

    expect(result?.duration).toBe(0);
    expect(result?.viewCount).toBe(0);
  });
});
```

## Pattern: Formatter Function Test
```typescript
import { describe, it, expect } from 'vitest';
import { formatDuration, formatViewCount } from '@/lib/formatters';

describe('formatDuration', () => {
  it('should format seconds to MM:SS', () => {
    expect(formatDuration(0)).toBe('0:00');
    expect(formatDuration(65)).toBe('1:05');
    expect(formatDuration(125)).toBe('2:05');
    expect(formatDuration(3600)).toBe('60:00');
  });

  it('should pad single digit seconds', () => {
    expect(formatDuration(5)).toBe('0:05');
    expect(formatDuration(9)).toBe('0:09');
  });
});

describe('formatViewCount', () => {
  it('should format millions', () => {
    expect(formatViewCount(1500000)).toBe('1.5M');
    expect(formatViewCount(2500000)).toBe('2.5M');
  });

  it('should format thousands', () => {
    expect(formatViewCount(1000)).toBe('1.0K');
    expect(formatViewCount(2500)).toBe('2.5K');
  });

  it('should return string for small numbers', () => {
    expect(formatViewCount(500)).toBe('500');
    expect(formatViewCount(0)).toBe('0');
  });
});
```

## Pattern: Zod Schema Test
```typescript
import { describe, it, expect } from 'vitest';
import { VideoSchema } from '@/schemas/video';

describe('VideoSchema', () => {
  it('should validate complete video object', () => {
    const validVideo = {
      id: 'video123',
      type: 'video',
      title: 'Test Video',
      description: 'Test Description',
      duration: 120,
      viewCount: 5000
    };

    const result = VideoSchema.safeParse(validVideo);

    expect(result.success).toBe(true);
    expect(result.data).toEqual(validVideo);
  });

  it('should reject video without id', () => {
    const invalidVideo = {
      type: 'video',
      title: 'Test Video'
    };

    const result = VideoSchema.safeParse(invalidVideo);

    expect(result.success).toBe(false);
    expect(result.error.errors[0].path).toEqual(['id']);
  });

  it('should reject invalid thumbnail URL', () => {
    const invalidVideo = {
      id: 'video123',
      type: 'video',
      title: 'Test Video',
      thumbnail: 'not-a-url'
    };

    const result = VideoSchema.safeParse(invalidVideo);

    expect(result.success).toBe(false);
    expect(result.error.errors[0].message).toContain('Invalid URL');
  });
});
```

## Pattern: Testing Edge Cases
```typescript
describe('Edge Cases', () => {
  it('should handle null input', () => {
    const result = parseVideo(null);
    expect(result).toBeNull();
  });

  it('should handle undefined input', () => {
    const result = parseVideo(undefined);
    expect(result).toBeNull();
  });

  it('should handle empty object', () => {
    const result = parseVideo({});
    expect(result).toBeNull();
  });

  it('should handle array input', () => {
    const result = parseVideo([1, 2, 3]);
    expect(result).toBeNull();
  });

  it('should handle very long strings', () => {
    const longTitle = 'A'.repeat(1000);
    const video = {
      type: 'Video',
      id: 'video123',
      title: longTitle
    };

    const result = parseVideo(video);
    expect(result?.title).toBe(longTitle);
  });
});
```

## Pattern: Testing YouTube.js Special Types
```typescript
import { describe, it, expect } from 'vitest';
import { parseVideo } from '@/lib/parsers';

describe('YouTube.js Special Types', () => {
  it('should handle TextRun objects', () => {
    const video = {
      type: 'Video',
      id: 'video123',
      title: { text: 'Test Video' }
    };

    const result = parseVideo(video);
    expect(result?.title).toBe('Test Video');
  });

  it('should handle duration as number', () => {
    const video = {
      type: 'Video',
      id: 'video123',
      title: 'Test Video',
      duration: 120
    };

    const result = parseVideo(video);
    expect(result?.duration).toBe(120);
  });

  it('should handle duration as object', () => {
    const video = {
      type: 'Video',
      id: 'video123',
      title: 'Test Video',
      duration: { seconds: 120 }
    };

    const result = parseVideo(video);
    expect(result?.duration).toBe(120);
  });

  it('should handle thumbnail as string', () => {
    const video = {
      type: 'Video',
      id: 'video123',
      title: 'Test Video',
      thumbnail: 'https://example.com/thumb.jpg'
    };

    const result = parseVideo(video);
    expect(result?.thumbnail).toBe('https://example.com/thumb.jpg');
  });
});
```

## Test Organization
```typescript
describe('parseVideo', () => {
  describe('Valid Input', () => {
    it('should parse complete video object');
    it('should parse minimal video object');
  });

  describe('Invalid Input', () => {
    it('should return null for non-object');
    it('should return null for wrong type');
    it('should return null for missing required fields');
  });

  describe('Edge Cases', () => {
    it('should handle null input');
    it('should handle undefined input');
    it('should handle empty object');
    it('should handle array input');
  });

  describe('YouTube.js Types', () => {
    it('should handle TextRun objects');
    it('should handle duration objects');
    it('should handle thumbnail objects');
  });
});
```

## Testing Patterns Reference

| Test Type | What to Test |
|-----------|--------------|
| Parser | Valid input, invalid input, edge cases |
| Formatter | Input/output pairs, edge cases |
| Schema | Validation, coercion, error messages |
| Utility | Pure functions, no side effects |

| Edge Case | Test For |
|-----------|----------|
| null | Returns null or default |
| undefined | Returns null or default |
| empty object | Returns null or default |
| array | Returns null |
| special chars | Handled correctly |
| very long strings | No truncation |
| negative numbers | Handled correctly |

| YouTube.js Type | Parser Behavior |
|-----------------|-----------------|
| TextRun | Extract text property |
| Duration | Check number or { seconds } |
| Thumbnail | Check string, object, or array |
