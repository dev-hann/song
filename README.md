# SONG - YouTube Audio Player PWA

A mobile-first Progressive Web App that lets you search YouTube and play audio without ads or video distractions.

## Features

- 🎵 **YouTube Audio Streaming** - Play audio from YouTube videos without the video player
- 🔍 **Search** - Search YouTube for music, podcasts, and more
- 📱 **Mobile-First PWA** - Designed for mobile devices with PWA capabilities
- 🎵 **Queue Management** - Add tracks to queue and manage playback order
- 🔁 **Playback Controls** - Play/pause, skip, shuffle, repeat modes
- ⏩ **Speed Control** - Adjust playback speed (0.5x - 2x)
- 👍 **Like & Save** - Mark your favorite tracks
- 👆 **Swipe Gestures** - Swipe down on full player to close
- 📐 **Responsive Design** - Works on mobile and desktop
- 🎨 **Dark Theme** - Beautiful dark UI with Tailwind CSS

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | **Next.js 16** (App Router) |
| Language | **TypeScript 5** |
| UI | **React 19** |
| Styling | **Tailwind CSS v4** |
| State Management | **Zustand v5** |
| Server State | **TanStack Query v5** |
| YouTube API | **youtubei.js v16** |
| Validation | **Zod v4** |
| Icons | **Lucide React** |
| Testing | **Vitest**, **Playwright**, **MSW** |

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/
│   │   └── youtube/       # API routes
│   │       ├── audio/info/route.ts      # Audio metadata
│   │       ├── audio/stream/route.ts    # Audio streaming URL
│   │       └── search/route.ts          # YouTube search
│   ├── home/page.tsx     # Home page
│   ├── search/page.tsx    # Search page
│   ├── library/page.tsx   # Library page
│   └── layout.tsx         # Root layout with PWA metadata
├── components/            # React components
│   ├── app-layout.tsx     # Main app wrapper
│   ├── audio-card.tsx     # Search result card
│   ├── bottom-nav.tsx     # Navigation bar
│   ├── full-player.tsx    # Full-screen player
│   ├── library-section.tsx # Library content
│   ├── player-bar.tsx     # Mini player bar
│   ├── search-section.tsx # Search UI
│   └── ui/                # UI primitives
├── constants/             # Enums (AudioStatus, RepeatMode, etc.)
├── hooks/                 # Custom React hooks
├── lib/                   # Utilities (formatters, youtube singleton)
├── models/                # Domain models with Zod schemas
├── queries/               # TanStack Query hooks
├── schemas/               # API request/response schemas
├── services/              # API service functions
├── store/                 # Zustand audio store
└── types/                 # TypeScript types
```

## API Endpoints

### Search YouTube

```
GET /api/youtube/search?q={query}
```

**Parameters:**
- `q` (required): Search query

**Response:** List of audio items with metadata

### Get Audio Info

```
GET /api/youtube/audio/info?id={videoId}
```

**Parameters:**
- `id` (required): YouTube video ID

**Response:** Extended audio metadata (duration, title, channel, thumbnail, etc.)

### Get Audio Stream URL

```
GET /api/youtube/audio/stream?id={videoId}
```

**Parameters:**
- `id` (required): YouTube video ID

**Response:** Audio stream URL (audio-only)

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm, yarn, or pnpm

### Installation

```bash
# Clone the repository
git clone https://github.com/dev-hann/song.git
cd song

# Install dependencies
npm install
```

### Development

```bash
# Start development server
npm run dev

# Open http://localhost:3000
```

### Build

```bash
# Build for production
npm run build

# Start production server
npm start
```

## Testing

```bash
# Run unit tests
npm run test

# Run tests with coverage
npm run test:coverage

# Run E2E tests
npm run test:e2e

# Run linter
npm run lint

# Type check
npx tsc --noEmit
```

## Code Quality

This project follows **OpenCode SKILLS** conventions for consistent code quality. See `.opencode/skills/` for detailed guidelines:

- **code-standards.md** - Code formatting, comments, naming
- **react-components.md** - Server/Client component patterns
- **zod-validation.md** - Runtime validation patterns
- **parser-patterns.md** - Parser function patterns
- **api-route-development.md** - API route best practices
- **typescript-verification.md** - Type safety patterns
- **testing-infrastructure.md** - Testing setup
- **component-testing.md** - Component testing with Testing Library
- **api-testing.md** - API route testing

## Browser Support

- Chrome/Edge (latest)
- Safari (latest)
- Firefox (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## License

MIT

## Disclaimer

This project uses an unofficial YouTube API (youtubei.js). 

- **NOT affiliated with YouTube or Google**
- Verify YouTube's Terms of Service before commercial use
- Excessive requests may be rate-limited
- For personal/educational use only

---

Built with ❤️ using Next.js, React, and Tailwind CSS
