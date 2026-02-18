---
name: zod-validation
description: Create Zod schemas for runtime validation with basic and advanced features
license: MIT
compatibility: opencode
metadata:
  category: development
  complexity: intermediate
---

## What I do
- Create object schemas with z.object()
- Validate strings, numbers, booleans with constraints
- Create enums with z.enum() and literals
- Add optional fields with .optional() and defaults with .default()
- Create nested object schemas and arrays
- Use discriminated unions with z.discriminatedUnion()
- Add custom validation with .refine()
- Transform data with .transform() and preprocess with .preprocess()
- Use .passthrough(), .strict(), or .strip() for extra fields
- Create lazy schemas with z.lazy() for recursive types
- Use partial(), required(), pick(), omit() for schema manipulation

## When to use me
Use this when you need to:
- Create validation schemas for API requests/responses
- Validate configuration objects
- Type data at runtime
- Parse multiple types with a type field
- Add custom validation rules
- Transform parsed data
- Normalize input before validation
- Create recursive or lazy schemas

I'll ask clarifying questions if:
- Schema structure is unclear
- Validation rules need clarification

## Pattern: Basic Object Schema

```typescript
import { z } from 'zod';

export const VideoSchema = z.object({
  id: z.string().min(1, 'ID is required'),
  type: z.literal('video'),
  title: z.string().min(1, 'Title is required'),
  description: z.string().default(''),
  duration: z.number().default(0),
  viewCount: z.number().default(0),
  thumbnail: z.string().url('Invalid thumbnail URL')
});

// Infer type from schema
export type Video = z.infer<typeof VideoSchema>;
```

## Pattern: String Validation

```typescript
const NonEmptyStringSchema = z.string()
  .min(1, 'Cannot be empty')
  .max(100, 'Must be 100 characters or less');

const EmailSchema = z.string().email('Invalid email address');

const UrlSchema = z.string().url('Invalid URL');

const RegexSchema = z.string()
  .regex(/^[A-Z]/, 'Must start with uppercase');

const YouTubeUrlSchema = z.string()
  .url('Invalid URL')
  .refine(
    (url) => {
      return url.includes('youtube.com') || url.includes('youtu.be');
    },
    'Must be a YouTube URL'
  );
```

## Pattern: Number Validation

```typescript
const PositiveNumberSchema = z.number()
  .positive('Must be positive');

const BoundedNumberSchema = z.number()
  .min(0, 'Cannot be negative')
  .max(100, 'Cannot exceed 100');

const IntegerSchema = z.number()
  .int('Must be an integer');

// Coerce string to number
const CoercedNumberSchema = z.coerce.number();
```

## Pattern: Booleans, Enums, Literals

```typescript
const BooleanSchema = z.boolean();

// Coerce string to boolean
const CoercedBooleanSchema = z.coerce.boolean();

const VideoTypeSchema = z.enum(['video', 'channel', 'playlist']);

const VideoLiteralSchema = z.literal('video');

const QualitySchema = z.enum(['360p', '720p', '1080p']);
```

## Pattern: Optional Fields & Defaults

```typescript
export const VideoSchema = z.object({
  id: z.string(),
  title: z.string(),

  // Optional without default
  description: z.string().optional(),
  published: z.string().optional(),
  isLive: z.boolean().optional(),

  // Optional with default
  duration: z.number().default(0),
  viewCount: z.number().default(0)
});
```

## Pattern: Array & Nested Objects

```typescript
// Array validation
const StringArraySchema = z.array(z.string())
  .min(1, 'At least one item required')
  .max(100, 'Cannot have more than 100 items');

const VideoArraySchema = z.array(VideoSchema);

// Nested objects
const ChannelInfoSchema = z.object({
  id: z.string(),
  name: z.string(),
  thumbnail: z.union([
    z.string().url(),
    z.object({
      url: z.string().url(),
      width: z.number().positive(),
      height: z.number().positive()
    })
  ]),
  subscribers: z.number().default(0)
});

const VideoSchema = z.object({
  id: z.string(),
  title: z.string(),
  channel: ChannelInfoSchema
});
```

## Pattern: Union Types

```typescript
const ThumbnailSchema = z.union([
  z.string().url('Invalid thumbnail URL'),
  z.object({
    url: z.string().url('Invalid thumbnail URL'),
    width: z.number().positive('Width must be positive'),
    height: z.number().positive('Height must be positive')
  })
]);

const StringOrNumberSchema = z.union([
  z.string(),
  z.number()
]);
```

## Pattern: API Request/Response Schemas

```typescript
export const SearchParamsSchema = z.object({
  q: z.string().min(1, 'Query is required'),
  filter: z.enum(['video', 'channel', 'playlist']).optional(),
  limit: z.coerce.number().positive().optional()
});

export type SearchParams = z.infer<typeof SearchParamsSchema>;

export const SearchResponseSchema = z.object({
  query: z.string(),
  results: z.array(VideoSchema),
  has_continuation: z.boolean().default(false)
});

export type SearchResponse = z.infer<typeof SearchResponseSchema>;
```

## Pattern: Discriminated Union

```typescript
export const SearchResultSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('video'),
    id: z.string(),
    title: z.string()
  }),
  z.object({
    type: z.literal('channel'),
    id: z.string(),
    name: z.string()
  }),
  z.object({
    type: z.literal('playlist'),
    id: z.string(),
    title: z.string()
  })
]);
```

## Pattern: Transform

```typescript
// Capitalize first letter
const CapitalizedNameSchema = z.string()
  .transform((val) => {
    return val.charAt(0).toUpperCase() + val.slice(1);
  });

// Handle YouTube.js TextRun objects
const StringOrTextRunSchema = z.union([
  z.string(),
  z.object({
    text: z.string(),
    runs: z.array(z.any())
  })
]).transform((val) => {
  if (typeof val === 'string') return val;
  if ('text' in val && typeof val.text === 'string') {
    return val.text;
  }
  return String(val);
});
```

## Pattern: Preprocess

```typescript
// Trim strings before validation
const TrimmedStringSchema = z.preprocess(
  (val) => {
    if (typeof val === 'string') {
      return val.trim();
    }
    return val;
  },
  z.string().min(1, 'Cannot be empty')
);

// Normalize email
const NormalizedEmailSchema = z.preprocess(
  (val) => {
    if (typeof val === 'string') {
      return val.toLowerCase().trim();
    }
    return val;
  },
  z.string().email('Invalid email')
);

// Convert strings to numbers
const NumberStringSchema = z.preprocess(
  (val) => {
    if (typeof val === 'string') {
      return parseInt(val, 10);
    }
    return val;
  },
  z.number().int('Must be a number')
);
```

## Pattern: Lazy Schema (Recursive)

```typescript
const CategorySchema: z.ZodType<Category> = z.lazy(() =>
  z.object({
    id: z.string(),
    name: z.string(),
    subcategories: z.array(CategorySchema).optional()
  })
);

export type Category = z.infer<typeof CategorySchema>;
```

## Pattern: Intersection, Record, Tuple

```typescript
// Intersection
const BaseSchema = z.object({
  id: z.string(),
  createdAt: z.date()
});

const VideoSchema = BaseSchema.extend({
  type: z.literal('video'),
  title: z.string()
});

// Record (Dictionary)
const MetadataSchema = z.record(
  z.string().min(1),
  z.string()
);

const VideoTagsSchema = z.record(z.string(), z.string());

// Tuple
const CoordinatesSchema = z.tuple([
  z.number(),  // x
  z.number()   // y
]);

const RangeSchema = z.tuple([
  z.number().min(0),  // start
  z.number().min(0)   // end
]);
```

## Pattern: Passthrough, Strict, Strip

```typescript
// Passthrough: Allow extra fields
const PassthroughSchema = z.object({
  id: z.string(),
  name: z.string()
}).passthrough();

// Strict: Reject extra fields
const StrictSchema = z.object({
  id: z.string(),
  name: z.string()
}).strict();

// Strip: Remove extra fields (default)
const StripSchema = z.object({
  id: z.string(),
  name: z.string()
});
```

## Pattern: Custom Validation

```typescript
const PasswordSchema = z.string()
  .min(8, 'Must be at least 8 characters')
  .refine(
    (val) => /[A-Z]/.test(val),
    'Must contain at least one uppercase letter'
  )
  .refine(
    (val) => /[a-z]/.test(val),
    'Must contain at least one lowercase letter'
  );

const UsernameSchema = z.string()
  .refine(
    (val) => /^[a-zA-Z0-9]+$/,
    'Must be alphanumeric with no special characters'
  );
```

## Pattern: Async Validation

```typescript
const UniqueEmailSchema = z.string()
  .email('Invalid email')
  .refine(
    async (email) => {
      const exists = await checkEmailExists(email);
      return !exists;
    },
    'Email already exists'
  );

const AsyncVideoIdSchema = z.string()
  .min(11, 'Invalid video ID')
  .refine(
    async (id) => {
      const exists = await checkVideoExists(id);
      return exists;
    },
    'Video does not exist'
  );
```

## Pattern: Partial, Required, Pick, Omit

```typescript
const FullVideoSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  duration: z.number()
});

// Make all fields optional
const PartialVideoSchema = FullVideoSchema.partial();

// Make specific fields optional
const SomeOptionalSchema = FullVideoSchema.partial({
  description: true,
  duration: true
});

// Make all fields required
const RequiredVideoSchema = PartialVideoSchema.required();

// Pick specific fields
const VideoBasicSchema = FullVideoSchema.pick({
  id: true,
  title: true
});

// Omit specific fields
const VideoMetaSchema = FullVideoSchema.omit({
  description: true
});
```

## Pattern: Using Schemas

### Using safeParse (Non-blocking)

```typescript
import { VideoSchema } from '@/schemas/video';

export function parseVideo(data: unknown): Video | null {
  const result = VideoSchema.safeParse(data);

  if (!result.success) {
    console.error('Validation errors:', result.error.errors);
    return null;
  }

  return result.data;
}
```

### Using parse (Blocking)

```typescript
export function processVideo(data: unknown): Video {
  try {
    return VideoSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Validation failed: ${error.errors[0].message}`);
    }
    throw error;
  }
}
```

## Checklist

Before committing schema code:

- [ ] Schema imported from 'zod'
- [ ] Infer type with z.infer<typeof Schema>
- [ ] Error messages are clear and helpful
- [ ] Required fields validated properly
- [ ] Optional fields use .optional()
- [ ] Default values provided where appropriate
- [ ] Nested objects structured correctly
- [ ] Arrays validated for length/contents
- [ ] Custom validation logic is clear
- [ ] Schema exported with named export

## Quick Reference

| Basic Method | Use For |
|--------------|---------|
| `z.string()` | String type |
| `z.number()` | Number type |
| `z.boolean()` | Boolean type |
| `z.enum()` | Fixed set of values |
| `z.literal()` | Specific value |
| `z.object()` | Object shape |
| `z.array()` | Array type |
| `z.union()` | Multiple possible types |

| Advanced Method | Use For |
|-----------------|---------|
| `z.discriminatedUnion()` | Type field discrimination |
| `.refine()` | Custom validation |
| `.transform()` | Data transformation |
| `.preprocess()` | Input normalization |
| `z.lazy()` | Recursive types |
| `.passthrough()` | Allow extra fields |
| `.strict()` | Reject extra fields |
| `.partial()` | Make fields optional |
| `.required()` | Make fields required |
| `.pick()` | Select specific fields |
| `.omit()` | Remove specific fields |

| Modifier | Purpose |
|----------|---------|
| `.min()` | Minimum value/length |
| `.max()` | Maximum value/length |
| `.optional()` | Optional field |
| `.default()` | Default value |
| `.safeParse()` | Non-blocking validation |
| `.parse()` | Blocking validation |

---

**Related SKILLS:** code-standards.md, parser-patterns.md, api-route-development.md
