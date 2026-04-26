# SONG Player

Personal streaming PWA.

## Architecture

```
song/
├── apps/
│   ├── client/       # React 19 + Vite + PWA (@song/client)
│   │   ├── src/
│   │   │   ├── components/   # UI components
│   │   │   ├── pages/        # Route pages
│   │   │   ├── hooks/        # Custom hooks
│   │   │   ├── queries/      # TanStack Query keys + options
│   │   │   ├── services/     # API call functions
│   │   │   ├── store/        # Zustand stores
│   │   │   ├── context/      # React contexts
│   │   │   ├── lib/          # Utilities (api-client, formatters, utils)
│   │   │   ├── types/        # Client-specific types (store)
│   │   │   ├── constants/    # Re-exports from @song/types
│   │   │   └── styles/       # Global styles
│   │   ├── tests/            # Unit + component tests
│   │   └── package.json
│   └── server/       # Express + TypeScript (@song/server)
│       └── src/
│           ├── routes/      # Express routers
│           ├── services/    # Business logic (youtube, melon, recommendations, error-reporter, github-issues)
│           ├── models/      # DB functions + Zod schemas
│           ├── schemas/     # API request/response Zod schemas
│           ├── middleware/   # auth, cors, rate-limit, logger, error-handler
│           └── lib/         # Utilities (env, db)
├── packages/
│   └── types/        # Shared types, enums, constants (@song/types)
│       ├── src/
│       │   ├── types/    # Audio, SearchResultAudio, Playlist, User, Recommendation, etc.
│       │   └── constants/ # AudioStatus, SearchStatus, RepeatMode
│       └── package.json
├── tests/              # E2E tests (Playwright)
├── turbo.json          # Turborepo pipeline config
├── package.json        # Root workspace config
└── tsconfig.json       # Base TypeScript config
```

## Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start all packages in dev mode (concurrently) |
| `npm run dev:client` | Start Vite dev server (port 3000) |
| `npm run dev:server` | Start Express server with tsx watch |
| `npm run build` | Build all packages (Turborepo) |
| `npm run build:client` | Build client only |
| `npm run build:server` | Build server only |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint across all packages |
| `npm run typecheck` | Run TypeScript type checking across all packages |
| `npm run test` | Run Vitest once |
| `npm run test:watch` | Run Vitest in watch mode |
| `npm run test:coverage` | Run Vitest with coverage |
| `npm run test:e2e` | Run Playwright e2e tests |

## Workspace Packages

| Package | Name | Description |
|---------|------|-------------|
| `packages/types` | `@song/types` | Shared TypeScript types, interfaces, enums |
| `apps/client` | `@song/client` | React 19 + Vite + PWA client |
| `apps/server` | `@song/server` | Express + TypeScript API server |

## Coding Conventions

- TypeScript strict mode
- ESM modules (`"type": "module"`)
- Path alias: `@/` → `./src/` (client)
- File naming: `kebab-case.ts` / `kebab-case.tsx`
- No comments unless explicitly requested
- Zod for runtime validation (server)
- Helmet for security headers
- crypto.randomUUID() for ID generation

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | No | Server port (default: 4000) |
| `JWT_SECRET` | Yes | Secret for signing JWT tokens |
| `GOOGLE_CLIENT_ID` | Yes | Google OAuth Client ID |
| `GITHUB_TOKEN` | No | GitHub token for error reporting |
| `GITHUB_REPO` | No | GitHub repo for error issues (default: dev-hann/song) |
| `CORS_ORIGINS` | No | Comma-separated allowed origins (default: localhost) |

## Shared Models (Canonical) — `@song/types`

All shared types are defined in `packages/types/src/types/`. Both client and server import from `@song/types`.

### Audio

```typescript
interface Audio {
  id: string;
  type: 'video';
  title: string;
  description: string;
  duration: number;
  viewCount: number;
  published?: string;
  thumbnail: string;
  channel: {
    id?: string;
    name: string;
    thumbnail?: string;
  };
}
```

### ExtendedAudio

```typescript
interface ExtendedAudio extends Audio {
  uploadDate?: Date;
}
```

### SearchResultAudio

```typescript
interface SearchResultAudio {
  id: string;
  title: string;
  thumbnail: string;
  duration: number;
  channel: {
    name: string;
    thumbnail?: string;
  };
}
```

### SearchResponse

```typescript
interface SearchResponse {
  query: string;
  results: SearchResultAudio[];
  has_continuation: boolean;
}
```

### StreamUrlResponse

```typescript
interface StreamUrlResponse {
  url: string;
}
```

### ErrorResponse

```typescript
interface ErrorResponse {
  error: string;
  code?: string;
}
```

### Enums

```typescript
enum AudioStatus {
  IDLE = 'idle',
  LOADING = 'loading',
  READY = 'ready',
  PLAYING = 'playing',
  PAUSED = 'paused',
  ERROR = 'error',
}

enum SearchStatus {
  IDLE = 'idle',
  LOADING = 'loading',
  SUCCESS = 'success',
  ERROR = 'error',
}

enum RepeatMode {
  OFF = 'off',
  ALL = 'all',
  ONE = 'one',
}
```

## API Specification

Base path: `/api`
Auth: `Authorization: Bearer <token>` (required for protected routes, marked with 🔒)

### `POST /api/auth/verify`

Verify Google OAuth credential. Auto-creates user on first login.

**Request Body:**

```typescript
{ credential: string }
```

**Response 200:**

```typescript
{ registered: true; token: string; user: { id: string; email: string; name: string; picture?: string } }
```

Sets `refresh_token` httpOnly cookie.

**Response 400/401:** [`ErrorResponse`](#errorresponse)

---

### `POST /api/auth/refresh`

Refresh access token using httpOnly cookie.

**Response 200:**

```typescript
{ token: string }
```

**Response 401:** [`ErrorResponse`](#errorresponse)

---

### `POST /api/auth/logout`

Clear refresh token cookie and revoke server-side tokens.

**Response 200:**

```typescript
{ success: true }
```

---

### `GET /api/youtube/search`

Search YouTube videos.

**Query Parameters:**

| Param | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `q` | string | Yes | - | Search query (min 1 char) |
| `filter` | `'video' \| 'channel' \| 'playlist'` | No | `'video'` | Search filter |

**Response 200:** [`SearchResponse`](#searchresponse)

**Response 400:** [`ErrorResponse`](#errorresponse)

---

### `GET /api/youtube/audio/info`

Get detailed audio/video info.

**Query Parameters:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | Video ID |

**Response 200:** [`ExtendedAudio`](#extendedaudio)

**Response 400:** [`ErrorResponse`](#errorresponse)

---

### `GET /api/youtube/audio/stream`

Get audio stream URL.

**Query Parameters:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | Video ID |

**Response 200:** [`StreamUrlResponse`](#streamurlresponse)

**Response 400/404:** [`ErrorResponse`](#errorresponse)

---

### `GET /api/youtube/audio/related`

Get related videos.

**Query Parameters:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | string | Yes | Video ID |

**Response 200:** `{ videos: SearchResultAudio[] }`

---

### `GET /api/youtube/audio/play/:id`

Proxy audio stream with retry logic.

**Response 200:** Audio stream (binary)

---

### `GET /api/home` 🔒

Aggregated home page data (melon charts, recent history, likes, recommendations).

**Response 200:**

```typescript
{ chart: Audio[]; hot100: Audio[]; dailyChart: Audio[]; recent: PlayHistory[]; likesCount: number; recommendations?: Recommendations }
```

---

### `GET /api/melon/chart`

Get Melon chart data.

**Query Parameters:**

| Param | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `type` | `'realtime' \| 'hot100' \| 'daily'` | No | `'realtime'` | Chart type |

---

### `GET /api/recommendations` 🔒

Get personalized recommendations.

**Response 200:** `{ fromChannels: Audio[]; fromRecent: Audio[] }`

---

### `GET /api/playlists` 🔒
### `POST /api/playlists` 🔒
### `GET /api/playlists/:id` 🔒
### `PATCH /api/playlists/:id` 🔒
### `DELETE /api/playlists/:id` 🔒
### `POST /api/playlists/:id/tracks` 🔒
### `DELETE /api/playlists/:id/tracks/:videoId` 🔒
### `PUT /api/playlists/:id/reorder` 🔒

Playlist CRUD operations. All require authentication.

---

### `GET /api/likes` 🔒
### `POST /api/likes` 🔒
### `DELETE /api/likes/:videoId` 🔒
### `GET /api/likes/check/:videoId` 🔒

Like management. All require authentication.

---

### `GET /api/history` 🔒
### `POST /api/history` 🔒
### `DELETE /api/history` 🔒

Play history. All require authentication.

---

### `GET /api/channels/followed` 🔒
### `GET /api/channels/:id`
### `POST /api/channels/:id/follow` 🔒
### `DELETE /api/channels/:id/follow` 🔒

Channel follow management.

---

### `POST /api/errors` 🔒

Client error reporting to GitHub Issues. Requires authentication.

---

### `GET /health`

Health check.

**Response 200:**

```typescript
{ status: 'ok'; timestamp: string; uptime: number }
```

## Before Committing

Always run:

```bash
npm run build
npm run lint
npm run test
```
