---
name: component-testing
description: Test React components with Testing Library, user interactions, and accessibility
license: MIT
compatibility: opencode
metadata:
  category: testing
  complexity: intermediate
---

## What I do
- Write tests for React components using Testing Library
- Test user interactions (click, type, submit)
- Test conditional rendering and state changes
- Test form inputs and validation
- Test list rendering with keys
- Test async actions (loading, error states)
- Test accessibility (ARIA, keyboard navigation)
- Use mock helpers for consistent test data
- Follow AAA pattern (Arrange-Act-Assert)

## When to use me
Use this when you need to:
- Write tests for React components
- Test user interactions (click, type, submit)
- Test conditional rendering
- Test async actions (loading, error states)
- Test form inputs and validation
- Test accessibility (ARIA, keyboard)

I'll ask clarifying questions if:
- Component interaction behavior is unclear
- Test scenarios need clarification

## Pattern: Basic Component Test
```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { VideoCard } from '@/components/video-card';

describe('VideoCard', () => {
  it('should render video information', () => {
    const mockVideo = {
      id: 'video123',
      title: 'Test Video',
      thumbnail: 'https://example.com/thumb.jpg'
    };

    render(<VideoCard video={mockVideo} />);

    expect(screen.getByText('Test Video')).toBeInTheDocument();
    expect(screen.getByAltText('Test Video')).toBeInTheDocument();
  });
});
```

## Pattern: Testing User Interactions
```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { VideoCard } from '@/components/video-card';

describe('VideoCard Interactions', () => {
  it('should call onClick when play button is clicked', async () => {
    const onClick = vi.fn();
    const mockVideo = { id: 'video123', title: 'Test Video' };
    const user = userEvent.setup();

    render(<VideoCard video={mockVideo} onClick={onClick} />);

    const playButton = screen.getByRole('button', { name: /play/i });
    await user.click(playButton);

    expect(onClick).toHaveBeenCalledWith('video123');
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('should call onShare when share button is clicked', async () => {
    const onShare = vi.fn();
    const mockVideo = { id: 'video123', title: 'Test Video' };
    const user = userEvent.setup();

    render(<VideoCard video={mockVideo} onShare={onShare} />);

    const shareButton = screen.getByRole('button', { name: /share/i });
    await user.click(shareButton);

    expect(onShare).toHaveBeenCalledWith('video123');
  });
});
```

## Pattern: Testing Conditional Rendering
```typescript
describe('Conditional Rendering', () => {
  it('should show play button when onPlay is provided', () => {
    const mockVideo = { id: 'video123', title: 'Test Video' };
    render(<VideoCard video={mockVideo} onPlay={vi.fn()} />);

    expect(screen.getByRole('button', { name: /play/i })).toBeInTheDocument();
  });

  it('should not show play button when onPlay is not provided', () => {
    const mockVideo = { id: 'video123', title: 'Test Video' };
    render(<VideoCard video={mockVideo} />);

    expect(screen.queryByRole('button', { name: /play/i })).not.toBeInTheDocument();
  });

  it('should show loading state when isLoading is true', () => {
    const mockVideo = { id: 'video123', title: 'Test Video' };
    render(<VideoCard video={mockVideo} isLoading={true} />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });
});
```

## Pattern: Testing Form Inputs
```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SearchBar } from '@/components/search-bar';

describe('SearchBar', () => {
  it('should update query when typing', async () => {
    const onSearch = vi.fn();
    const user = userEvent.setup();

    render(<SearchBar onSearch={onSearch} />);

    const input = screen.getByRole('textbox');
    await user.type(input, 'test query');

    expect(input).toHaveValue('test query');
  });

  it('should call onSearch when form is submitted', async () => {
    const onSearch = vi.fn();
    const user = userEvent.setup();

    render(<SearchBar onSearch={onSearch} />);

    const input = screen.getByRole('textbox');
    await user.type(input, 'test query');

    const submitButton = screen.getByRole('button', { type: 'submit' });
    await user.click(submitButton);

    expect(onSearch).toHaveBeenCalledWith('test query');
  });

  it('should clear input after submission', async () => {
    const onSearch = vi.fn();
    const user = userEvent.setup();

    render(<SearchBar onSearch={onSearch} />);

    const input = screen.getByRole('textbox');
    await user.type(input, 'test query');

    const submitButton = screen.getByRole('button', { type: 'submit' });
    await user.click(submitButton);

    expect(input).toHaveValue('');
  });
});
```

## Pattern: Testing List Rendering
```typescript
describe('VideoList', () => {
  it('should render list of videos', () => {
    const mockVideos = [
      { id: 'video1', title: 'Video 1' },
      { id: 'video2', title: 'Video 2' },
      { id: 'video3', title: 'Video 3' }
    ];

    render(<VideoList videos={mockVideos} />);

    expect(screen.getByText('Video 1')).toBeInTheDocument();
    expect(screen.getByText('Video 2')).toBeInTheDocument();
    expect(screen.getByText('Video 3')).toBeInTheDocument();
  });

  it('should show empty state when no videos', () => {
    render(<VideoList videos={[]} />);

    expect(screen.getByText('No videos found')).toBeInTheDocument();
  });

  it('should use correct key for each video', () => {
    const mockVideos = [
      { id: 'video1', title: 'Video 1' },
      { id: 'video2', title: 'Video 2' }
    ];

    render(<VideoList videos={mockVideos} />);

    const cards = screen.getAllByRole('article');
    expect(cards).toHaveLength(2);
  });
});
```

## Pattern: Testing Async Actions
```typescript
describe('Async Actions', () => {
  it('should show loading state during async action', async () => {
    const onPlay = vi.fn().mockImplementation(
      () => new Promise(resolve => setTimeout(resolve, 100))
    );
    const mockVideo = { id: 'video123', title: 'Test Video' };
    const user = userEvent.setup();

    render(<VideoCard video={mockVideo} onPlay={onPlay} />);

    const playButton = screen.getByRole('button', { name: /play/i });
    await user.click(playButton);

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('should hide loading state after async action completes', async () => {
    const onPlay = vi.fn().mockResolvedValue(undefined);
    const mockVideo = { id: 'video123', title: 'Test Video' };
    const user = userEvent.setup();

    render(<VideoCard video={mockVideo} onPlay={onPlay} />);

    const playButton = screen.getByRole('button', { name: /play/i });
    await user.click(playButton);

    await waitFor(() => {
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });
  });

  it('should show error state when async action fails', async () => {
    const onPlay = vi.fn().mockRejectedValue(new Error('Failed to play'));
    const mockVideo = { id: 'video123', title: 'Test Video' };
    const user = userEvent.setup();

    render(<VideoCard video={mockVideo} onPlay={onPlay} />);

    const playButton = screen.getByRole('button', { name: /play/i });
    await user.click(playButton);

    await waitFor(() => {
      expect(screen.getByText('Failed to play')).toBeInTheDocument();
    });
  });
});
```

## Mock Helper Functions
```typescript
// __tests__/utils/component-helpers.ts

export function mockVideo(overrides = {}): Video {
  return {
    id: 'video123',
    type: 'video',
    title: 'Test Video',
    description: 'Test Description',
    duration: 120,
    viewCount: 5000,
    thumbnail: 'https://example.com/thumb.jpg',
    channel: {
      id: 'channel123',
      name: 'Test Channel',
      thumbnail: ''
    },
    ...overrides
  };
}

export function mockVideos(count: number): Video[] {
  return Array.from({ length: count }, (_, i) => mockVideo({
    id: `video${i}`,
    title: `Video ${i + 1}`
  }));
}
```

## Test Organization
```typescript
describe('VideoCard', () => {
  describe('Rendering', () => {
    it('should render video information');
    it('should render thumbnail');
    it('should render metadata');
  });

  describe('Interactions', () => {
    it('should call onClick when play button clicked');
    it('should call onShare when share button clicked');
  });

  describe('Conditional Rendering', () => {
    it('should show play button when onPlay provided');
    it('should show loading state when isLoading true');
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels');
    it('should be keyboard navigable');
  });
});
```

## Accessibility Testing
```typescript
describe('Accessibility', () => {
  it('should have proper ARIA labels', () => {
    const mockVideo = { id: 'video123', title: 'Test Video' };
    render(<VideoCard video={mockVideo} />);

    const playButton = screen.getByRole('button', { name: /play video/i });
    expect(playButton).toBeInTheDocument();
  });

  it('should be keyboard navigable', () => {
    const mockVideo = { id: 'video123', title: 'Test Video' };
    render(<VideoCard video={mockVideo} />);

    const playButton = screen.getByRole('button');
    expect(playButton).toHaveFocus();
  });
});
```
