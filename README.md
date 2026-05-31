# SONG - YouTube Audio Player PWA

A mobile-first Progressive Web App that lets you search YouTube and play audio without ads or video distractions.

## Features

- YouTube Audio Streaming — Play audio from YouTube videos
- Search — Search YouTube for music, podcasts, and more
- Mobile-First PWA — Designed for mobile devices with PWA capabilities
- Queue Management — Add tracks to queue and manage playback order
- Playback Controls — Play/pause, skip, shuffle, repeat modes
- Speed Control — Adjust playback speed (0.5x - 2x)
- Like & Save — Mark your favorite tracks
- Swipe Gestures — Swipe down on full player to close
- Melon Chart — Browse Korean music charts
- Playlist Management — Create and manage playlists
- Channel Follow — Follow YouTube channels
- Dark Theme — Beautiful dark UI with Tailwind CSS

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | **Next.js 16** (App Router, standalone output) |
| Language | **TypeScript 5** (strict mode) |
| UI | **React 19** |
| Styling | **Tailwind CSS v4** |
| State Management | **Zustand v5** |
| Server State | **TanStack Query v5** |
| Auth | **Auth.js (next-auth v5)** — Google OAuth |
| Database | **SQLite** (better-sqlite3) |
| YouTube API | **youtubei.js** |
| Validation | **Zod v4** |
| Testing | **Vitest**, **React Testing Library**, **MSW** |
| Deployment | **Docker** (standalone) |

## Project Structure

```
song/
├── app/                    # Next.js App Router
│   ├── (auth)/login/       # Login page
│   ├── (main)/             # Authenticated pages
│   ├── api/                # Route Handlers (22 endpoints)
│   ├── layout.tsx
│   └── not-found.tsx
├── server/                 # Server-side business logic
│   ├── auth.ts             # Auth.js config
│   ├── lib/                # env.ts, db.ts
│   ├── models/             # DB functions + Zod schemas
│   ├── schemas/            # API request/response schemas
│   ├── services/           # youtube, melon, recommendations
│   └── utils/
├── src/                    # Client-side code
│   ├── components/         # UI components
│   ├── hooks/              # Custom hooks
│   ├── queries/            # TanStack Query keys + options
│   ├── services/           # API call functions
│   ├── store/              # Zustand stores
│   ├── context/            # React contexts
│   ├── lib/                # Utilities
│   ├── types/              # TypeScript types + enums
│   ├── constants/          # Re-exports from types/enums
│   └── styles/
├── public/                 # Static assets
├── proxy.ts                # Auth middleware
├── next.config.ts
├── Dockerfile
└── docker-compose.yml
```

## Getting Started

### Prerequisites

- Node.js 22+
- npm

### Installation

```bash
git clone https://github.com/dev-hann/song.git
cd song
npm install
```

### Environment Variables

Copy `.env.example` to `.env` and fill in:

```env
AUTH_SECRET=          # Generate: openssl rand -base64 32
GOOGLE_CLIENT_ID=     # Google Cloud Console OAuth 2.0
GOOGLE_CLIENT_SECRET= # Google Cloud Console OAuth 2.0
```

### Development

```bash
npm run dev            # http://localhost:3000
```

### Production (Docker)

```bash
docker compose up -d
```

## Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Dev server with Turbopack |
| `npm run build` | Production build (standalone) |
| `npm run start` | Start production server |
| `npm run lint` | ESLint (strict, 100+ rules) |
| `npm run typecheck` | TypeScript type checking |
| `npm run test` | Vitest |
| `npm run test:watch` | Vitest in watch mode |
| `npm run test:coverage` | Vitest with coverage |

## License

MIT

## Disclaimer

This project uses an unofficial YouTube API (youtubei.js).
NOT affiliated with YouTube or Google. For personal/educational use only.
