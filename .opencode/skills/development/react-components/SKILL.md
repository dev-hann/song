---
name: react-components
description: Create Server and Client React components with proper props, state, and patterns
license: MIT
compatibility: opencode
metadata:
  category: development
  complexity: intermediate
---

## What I do
- Create Server Components (no 'use client') for static content and data fetching
- Create Client Components ('use client') for interactivity and hooks
- Define props interfaces explicitly
- Use React hooks (useState, useEffect, useContext, useRef, useCallback, useMemo)
- Implement conditional rendering, list rendering, and composition patterns
- Manage component state and handle events
- Handle loading, error, and success states

## When to use me
Use this when you need to:
- Display static content or fetch data on server
- Create interactive components (buttons, forms, inputs)
- Use React hooks (useState, useEffect, etc.)
- Handle user events (onClick, onSubmit, onChange)
- Implement component patterns (compound, render props, HOC)
- Handle errors and loading states

I'll ask clarifying questions if:
- Server vs Client Component choice is unclear
- Prop structure is unclear
- State management strategy needs clarification

## Pattern: Server Components

### Basic Server Component

```typescript
import { Video } from '@/types/video';

interface VideoCardProps {
  video: Video;
  className?: string;
}

export function VideoCard({ video, className }: VideoCardProps) {
  return (
    <div className={className}>
      <img src={video.thumbnail} alt={video.title} />
      <h3>{video.title}</h3>
    </div>
  );
}
```

### Server Component with Data Fetching

```typescript
import { Video } from '@/types/video';
import { getVideoInfo } from '@/lib/youtube';

interface VideoDisplayProps {
  videoId: string;
}

export async function VideoDisplay({ videoId }: VideoDisplayProps) {
  const video = await getVideoInfo(videoId);

  if (!video) {
    return <div>Video not found</div>;
  }

  return (
    <div>
      <h1>{video.title}</h1>
      <p>{video.description}</p>
    </div>
  );
}
```

### Server Component List Rendering

```typescript
import { Video } from '@/types/video';
import { VideoCard } from './video-card';

interface VideoListProps {
  videos: Video[];
}

export function VideoList({ videos }: VideoListProps) {
  if (videos.length === 0) {
    return <div>No videos found</div>;
  }

  return (
    <div>
      {videos.map((video) => (
        <VideoCard key={video.id} video={video} />
      ))}
    </div>
  );
}
```

### Suspense for Loading State

```typescript
import { Suspense } from 'react';

export function VideoPage({ videoId }: { videoId: string }) {
  return (
    <Suspense fallback={<div>Loading video...</div>}>
      <VideoDisplay videoId={videoId} />
    </Suspense>
  );
}
```

## Pattern: Client Components

### Basic Client Component

```typescript
'use client';

import { useState } from 'react';

interface SearchBarProps {
  onSearch: (query: string) => void;
}

export function SearchBar({ onSearch }: SearchBarProps) {
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="검색어를 입력하세요"
      />
      <button type="submit">Search</button>
    </form>
  );
}
```

### Client Component with Async Actions

```typescript
'use client';

import { useState } from 'react';

interface VideoCardProps {
  video: Video;
  onPlay?: (videoId: string) => Promise<void>;
}

export function VideoCard({ video, onPlay }: VideoCardProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePlay = async () => {
    if (!onPlay) return;

    setIsLoading(true);
    setError(null);

    try {
      await onPlay(video.id);
    } catch (err) {
      setError('Failed to play video');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h3>{video.title}</h3>
      {error && <div className="error">{error}</div>}
      {onPlay && (
        <button onClick={handlePlay} disabled={isLoading}>
          {isLoading ? 'Loading...' : 'Play'}
        </button>
      )}
    </div>
  );
}
```

### Multiple Hooks

```typescript
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

export function VideoPlayer({ videoId }: { videoId: string }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const playerRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const player = playerRef.current;
    if (player) {
      player.currentTime = 0;
    }
  }, [videoId]);

  const togglePlay = useCallback(() => {
    const player = playerRef.current;
    if (player) {
      if (isPlaying) {
        player.pause();
      } else {
        player.play();
      }
      setIsPlaying(!isPlaying);
    }
  }, [isPlaying]);

  return (
    <div>
      <video ref={playerRef} src={`video/${videoId}`} />
      <button onClick={togglePlay}>
        {isPlaying ? 'Pause' : 'Play'}
      </button>
      <div>Time: {currentTime}s</div>
    </div>
  );
}
```

### Event Handler Typing

```typescript
'use client';

import type { ChangeEvent, FormEvent, MouseEvent, KeyboardEvent } from 'react';

export function FormComponent() {
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    console.log(e.target.value);
  };

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
  };

  const handleClick = (e: MouseEvent<HTMLButtonElement>) => {
    console.log('Button clicked');
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      console.log('Enter pressed');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        onChange={handleChange}
        onKeyDown={handleKeyDown}
      />
      <button type="button" onClick={handleClick}>Click</button>
    </form>
  );
}
```

## Pattern: Props Interface

### Basic Props

```typescript
interface VideoCardProps {
  video: Video;
}

export function VideoCard({ video }: VideoCardProps) {
  return <div>{video.title}</div>;
}
```

### Optional Props

```typescript
interface VideoCardProps {
  video: Video;
  onPlay?: (videoId: string) => void;
  className?: string;
  showThumbnail?: boolean;
}

export function VideoCard({ video, onPlay, className, showThumbnail = true }: VideoCardProps) {
  return (
    <div className={className}>
      {showThumbnail && <img src={video.thumbnail} alt={video.title} />}
      <h3>{video.title}</h3>
      {onPlay && <button onClick={() => onPlay(video.id)}>Play</button>}
    </div>
  );
}
```

### Children Prop

```typescript
interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  sidebar?: React.ReactNode;
}

export function Layout({ children, title, sidebar }: LayoutProps) {
  return (
    <div className="layout">
      <header>{title && <h1>{title}</h1>}</header>
      <div className="content">
        {sidebar && <aside>{sidebar}</aside>}
        <main>{children}</main>
      </div>
    </div>
  );
}
```

## Pattern: Conditional Rendering

### Simple Conditional

```typescript
export function VideoCard({ video, onPlay }: VideoCardProps) {
  return (
    <div>
      <h3>{video.title}</h3>
      {onPlay && <button onClick={() => onPlay(video.id)}>Play</button>}
    </div>
  );
}
```

### Ternary Operator

```typescript
export function VideoCard({ video, onPlay }: VideoCardProps) {
  return (
    <div>
      <h3>{video.title}</h3>
      {onPlay ? (
        <button onClick={() => onPlay(video.id)}>Play</button>
      ) : (
        <span>Not available</span>
      )}
    </div>
  );
}
```

### Multiple Conditions

```typescript
export function VideoStatus({ video }: { video: Video }) {
  return (
    <div>
      {video.isLive ? (
        <span className="badge badge--live">LIVE</span>
      ) : video.isPremiere ? (
        <span className="badge badge--premiere">PREMIERE</span>
      ) : video.isNew ? (
        <span className="badge badge--new">NEW</span>
      ) : null}
    </div>
  );
}
```

### Early Return

```typescript
export function VideoCard({ video }: { video: Video | null }) {
  if (!video) {
    return <div>Video not found</div>;
  }

  return (
    <div>
      <h3>{video.title}</h3>
    </div>
  );
}
```

## Pattern: Component Patterns

### Compound Components

```typescript
'use client';

import { createContext, useContext, ReactNode, useState } from 'react';

interface TabsContextType {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const TabsContext = createContext<TabsContextType | null>(null);

export function Tabs({ children, defaultTab }: { children: ReactNode; defaultTab: string }) {
  const [activeTab, setActiveTab] = useState(defaultTab);

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className="tabs">{children}</div>
    </TabsContext.Provider>
  );
}

export function TabList({ children }: { children: ReactNode }) {
  return <div className="tab-list">{children}</div>;
}

export function Tab({ value, children }: { value: string; children: ReactNode }) {
  const context = useContext(TabsContext);
  if (!context) throw new Error('Tab must be used within Tabs');

  const { activeTab, setActiveTab } = context;
  const isActive = activeTab === value;

  return (
    <button
      className={`tab ${isActive ? 'tab--active' : ''}`}
      onClick={() => setActiveTab(value)}
    >
      {children}
    </button>
  );
}

export function TabPanel({ value, children }: { value: string; children: ReactNode }) {
  const context = useContext(TabsContext);
  if (!context) throw new Error('TabPanel must be used within Tabs');

  const { activeTab } = context;
  if (activeTab !== value) return null;

  return <div className="tab-panel">{children}</div>;
}
```

### Render Props

```typescript
export function VideoList({ videos, render }: { videos: Video[]; render: (video: Video) => React.ReactNode }) {
  return (
    <div>
      {videos.map((video) => (
        <div key={video.id}>
          {render(video)}
        </div>
      ))}
    </div>
  );
}

// Usage
<VideoList
  videos={videos}
  render={(video) => (
    <VideoCard video={video} />
  )}
/>
```

### Higher-Order Component

```typescript
'use client';

import { ComponentType } from 'react';

function withLoading<T extends { isLoading: boolean }>(
  Component: ComponentType<T>
) {
  return function WithLoading(props: T) {
    if (props.isLoading) {
      return <div>Loading...</div>;
    }
    return <Component {...props} />;
  };
}

// Usage
const VideoListWithLoading = withLoading(VideoList);
```

### Error Boundary

```typescript
'use client';

import { Component, ReactNode, ErrorInfo } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return this.props.fallback || <div>Something went wrong</div>;
    }

    return this.props.children;
  }
}
```

## Server vs Client Components

### Use Server Component When:

```typescript
// ✅ Displaying static content
export function VideoCard({ video }: { video: Video }) {
  return <div>{video.title}</div>;
}

// ✅ Fetching data on server
export async function VideoList() {
  const videos = await fetchVideos();
  return videos.map(v => <VideoCard key={v.id} video={v} />);
}

// ✅ No user interaction needed
export function VideoTitle({ title }: { title: string }) {
  return <h1>{title}</h1>;
}
```

### Use Client Component When:

```typescript
// ✅ Using React hooks
'use client';
import { useState } from 'react';

// ✅ Handling user events (onClick, onSubmit, onChange)
// ✅ Using browser APIs (window, document, navigator, localStorage)
// ✅ Managing client-side state
// ✅ Creating custom hooks
```

### Wrap Pattern

```typescript
// Server component (no 'use client')
export function VideoCard({ video }: { video: Video }) {
  return <div>{video.title}</div>;
}

// Client component for interactivity
'use client';

import { useState } from 'react';
import { VideoCard } from './video-card';

export function InteractiveVideoCard({ video }: { video: Video }) {
  const [isPlaying, setIsPlaying] = useState(false);

  return (
    <div>
      <VideoCard video={video} />
      <button onClick={() => setIsPlaying(!isPlaying)}>
        {isPlaying ? 'Pause' : 'Play'}
      </button>
    </div>
  );
}
```

## Checklist

Before committing component code:

- [ ] Server Component: No 'use client' directive
- [ ] Client Component: 'use client' directive at top
- [ ] Props interface defined explicitly
- [ ] Event handlers properly typed
- [ ] Loading, error, success states handled
- [ ] Lists use key prop
- [ ] Conditional rendering is clear
- [ ] Named export used (not default)
- [ ] File name matches component name (kebab-case → PascalCase)
- [ ] JSDoc comments for public components

## Quick Reference

| Type | Directive | Use For |
|------|-----------|---------|
| Server Component | None | Static content, data fetching, no interactivity |
| Client Component | 'use client' | Interactivity, hooks, events, browser APIs |

| Hook | Purpose |
|------|---------|
| useState | Component state |
| useEffect | Side effects |
| useContext | Context values |
| useRef | DOM refs, persistent values |
| useCallback | Memoized callbacks |
| useMemo | Memoized values |

| Event Type | Example |
|------------|---------|
| ChangeEvent | `<input onChange>` |
| FormEvent | `<form onSubmit>` |
| MouseEvent | `<button onClick>` |
| KeyboardEvent | `<input onKeyDown>` |

| Pattern | Use For |
|---------|---------|
| Compound Components | Related components sharing state |
| Render Props | Custom rendering logic |
| HOC | Component enhancement |
| Error Boundary | Error catching |

---

**Related SKILLS:** code-standards.md, api-testing.md, component-testing.md
