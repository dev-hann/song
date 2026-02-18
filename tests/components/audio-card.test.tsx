import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AudioCard } from '@/components/audio-card';
import type { SearchResultAudio } from '@/types';

describe('AudioCard', () => {
  const createMockAudio = (overrides: Partial<SearchResultAudio> = {}): SearchResultAudio => ({
    id: 'audio123',
    title: 'Test Audio',
    thumbnail: 'https://example.com/thumb.jpg',
    duration: 120,
    channel: {
      name: 'Test Channel',
    },
    ...overrides,
  });

  it('should render audio information', () => {
    const mockAudio = createMockAudio();

    render(<AudioCard audio={mockAudio} onClick={vi.fn()} />);

    expect(screen.getByText('Test Audio')).toBeInTheDocument();
  });

  it('should render channel name', () => {
    const mockAudio = createMockAudio();

    render(<AudioCard audio={mockAudio} onClick={vi.fn()} />);

    expect(screen.getByText('Test Channel')).toBeInTheDocument();
  });

  it('should render duration', () => {
    const mockAudio = createMockAudio({ duration: 125 });

    render(<AudioCard audio={mockAudio} onClick={vi.fn()} />);

    expect(screen.getByText('2:05')).toBeInTheDocument();
  });

  it('should call onClick when clicked', () => {
    const onClick = vi.fn();
    const mockAudio = createMockAudio();

    const { container } = render(<AudioCard audio={mockAudio} onClick={onClick} />);

    const cardElement = container.querySelector('div.cursor-pointer') as HTMLElement;
    fireEvent.click(cardElement);

    expect(onClick).toHaveBeenCalledWith('audio123');
  });

  it('should not render duration when 0', () => {
    const mockAudio = createMockAudio({ duration: 0 });

    render(<AudioCard audio={mockAudio} onClick={vi.fn()} />);

    expect(screen.queryByText('0:00')).not.toBeInTheDocument();
  });
});
