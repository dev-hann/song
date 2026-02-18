---
name: api-route-development
description: Create API routes with proper validation and error handling for Next.js Edge Runtime
license: MIT
compatibility: opencode
metadata:
  category: development
  complexity: intermediate
---

## What I do
- Create API routes with Next.js App Router
- Implement GET/POST methods with Edge Runtime
- Validate request parameters using Zod schemas
- Handle errors with appropriate HTTP status codes
- Type request parameters and responses
- Log errors for debugging
- Follow kebab-case file naming conventions
- Use Web APIs (fetch, Response, Request)
- Avoid Node.js APIs (fs, path, os, etc.)

## When to use me
Use this when you need to:
- Create a new API endpoint
- Add GET/POST methods to existing routes
- Validate incoming request data
- Implement error handling for API routes
- Work with Next.js Edge Runtime

I'll ask clarifying questions if:
- The required HTTP method is unclear
- Request parameter structure is ambiguous
- Error handling strategy needs clarification

## Pattern: GET Route with Query Parameters
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { SearchParamsSchema } from '@/schemas/api';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  try {
    // 1. Validate request parameters
    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams);
    const paramsResult = SearchParamsSchema.safeParse(queryParams);

    if (!paramsResult.success) {
      return NextResponse.json(
        { error: paramsResult.error.errors[0].message },
        { status: 400 }
      );
    }

    // 2. Process request
    const { q, filter } = paramsResult.data;
    const results = await searchVideos(q, filter);

    // 3. Return typed response
    return NextResponse.json({ results });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

## Pattern: Dynamic Route with Path Parameters
```typescript
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!id) {
    return NextResponse.json(
      { error: 'ID parameter is required' },
      { status: 400 }
    );
  }

  const data = await fetchData(id);
  return NextResponse.json(data);
}
```

## Pattern: POST Route with Body Validation
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { CreateVideoSchema } from '@/schemas/api';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    // 1. Validate request body
    const body = await request.json();
    const validationResult = CreateVideoSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.errors[0].message },
        { status: 400 }
      );
    }

    // 2. Process request
    const videoData = validationResult.data;
    const result = await createVideo(videoData);

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Failed to create video' },
      { status: 500 }
    );
  }
}
```

## Pattern: Error Response

### Validation Error (400)
```typescript
return NextResponse.json(
  { error: 'Query parameter "q" is required' },
  { status: 400 }
);
```

### Not Found (404)
```typescript
return NextResponse.json(
  { error: 'Resource not found' },
  { status: 404 }
);
```

### Server Error (500)
```typescript
return NextResponse.json(
  { error: 'Internal server error' },
  { status: 500 }
);
```

## Edge Runtime Constraints

✅ **DO use:**
- Web APIs (fetch, Response, Request)
- Standard JavaScript APIs
- Browser-compatible APIs

❌ **DON'T use:**
- Node.js APIs (fs, path, os, etc.)
- File system operations
- Process environment variables (use process.env only)

## Common Imports
```typescript
// Always import these
import { NextRequest, NextResponse } from 'next/server';

// For Zod validation
import { SearchParamsSchema } from '@/schemas/api';

// For types
import type { Video, Channel } from '@/types';
```
