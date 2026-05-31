---
name: api-route-development
description: Create API routes with proper validation and error handling for Next.js App Router (Node.js runtime)
license: MIT
compatibility: opencode
metadata:
  category: development
  complexity: intermediate
---

## What I do
- Create API routes with Next.js App Router
- Implement GET/POST/PUT/DELETE methods (Node.js runtime)
- Validate request parameters using Zod schemas
- Handle errors with appropriate HTTP status codes
- Type request parameters and responses
- Use `async params` (Next.js 16 requirement)
- Follow kebab-case file naming conventions
- Import business logic from `server/` directory

## When to use me
Use this when you need to:
- Create a new API endpoint
- Add GET/POST methods to existing routes
- Validate incoming request data
- Implement error handling for API routes

I'll ask clarifying questions if:
- The required HTTP method is unclear
- Request parameter structure is ambiguous
- Error handling strategy needs clarification

## Runtime

This project uses **Node.js runtime** (default) — not Edge Runtime.
This is required because we use `better-sqlite3` (native Node.js module).

```typescript
// DO NOT add this line:
// export const runtime = 'edge';

// Node.js runtime is the default, no declaration needed.
// This allows using: better-sqlite3, fs, path, etc.
```

## Pattern: GET Route with Query Parameters
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { SearchParamsSchema } from '@/server/schemas/search';
import { searchVideos } from '@/server/models/search';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams);
    const paramsResult = SearchParamsSchema.safeParse(queryParams);

    if (!paramsResult.success) {
      return NextResponse.json(
        { error: paramsResult.error.errors[0].message },
        { status: 400 }
      );
    }

    const { q, filter } = paramsResult.data;
    const results = await searchVideos(q, filter);

    return NextResponse.json(results);
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

## Pattern: Dynamic Route with Path Parameters (Next.js 16)
```typescript
import { NextRequest, NextResponse } from 'next/server';

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
import { CreatePlaylistSchema } from '@/server/schemas/playlist';
import { createPlaylist } from '@/server/models/playlist';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validationResult = CreatePlaylistSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: validationResult.error.errors[0].message },
        { status: 400 }
      );
    }

    const playlistData = validationResult.data;
    const result = createPlaylist(playlistData);

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Failed to create resource' },
      { status: 500 }
    );
  }
}
```

## Pattern: Auth-Protected Route

Protected routes are automatically enforced by `proxy.ts`.
No auth check needed in the route handler itself — just use the session:

```typescript
import { auth } from '@/server/auth';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const userId = session.user.id;
  const data = await getUserData(userId);
  return NextResponse.json(data);
}
```

## Pattern: Error Responses

```typescript
// 400 Bad Request (validation error)
return NextResponse.json({ error: 'message' }, { status: 400 });

// 401 Unauthorized
return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

// 404 Not Found
return NextResponse.json({ error: 'Not found' }, { status: 404 });

// 500 Internal Server Error
return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
```

## Common Imports
```typescript
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/server/auth';
import type { Audio, Playlist } from '@/types';
```

## Rules

### MUST
- ✅ Use `async params` — `{ params }: { params: Promise<{ id: string }> }`
- ✅ Validate all input with Zod schemas
- ✅ Return proper HTTP status codes
- ✅ Import business logic from `@/server/*`
- ✅ Use named exports (`export async function GET`)
- ✅ Handle errors with try/catch

### MUST NOT
- ❌ Do NOT use `export const runtime = 'edge'` — this breaks better-sqlite3
- ❌ Do NOT access `params` without `await` (Next.js 16)
- ❌ Do NOT put business logic in route handlers — delegate to `server/`
- ❌ Do NOT use default exports
