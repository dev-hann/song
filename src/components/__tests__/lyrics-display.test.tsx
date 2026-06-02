import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LyricsDisplay } from '@/components/lyrics-display';
import type { LyricsLine } from '@/types';

const mockLines: LyricsLine[] = [
  { startTimeMs: 0, endTimeMs: 5000, text: 'First line' },
  { startTimeMs: 5000, endTimeMs: 10000, text: 'Second line' },
  { startTimeMs: 10000, endTimeMs: 15000, text: 'Third line' },
];

describe('LyricsDisplay', () => {
  it('renders lyrics lines', () => {
    render(<LyricsDisplay lines={mockLines} currentTimeMs={0} onSeek={() => {}} />);

    expect(screen.getByText('First line')).toBeInTheDocument();
    expect(screen.getByText('Second line')).toBeInTheDocument();
    expect(screen.getByText('Third line')).toBeInTheDocument();
  });

  it('highlights the active line based on currentTimeMs', () => {
    const { container } = render(
      <LyricsDisplay lines={mockLines} currentTimeMs={7000} onSeek={() => {}} />,
    );

    const lines = container.querySelectorAll('[data-line-active]');
    expect(lines).toHaveLength(1);
    expect(lines[0]).toHaveTextContent('Second line');
  });

  it('shows empty state when no lines', () => {
    render(<LyricsDisplay lines={[]} currentTimeMs={0} onSeek={() => {}} />);

    expect(screen.getByText('가사를 찾을 수 없습니다')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    render(<LyricsDisplay lines={null} currentTimeMs={0} onSeek={() => {}} isLoading />);

    expect(screen.getByText('가사 불러오는 중...')).toBeInTheDocument();
  });

  it('calls onSeek when a line is clicked', async () => {
    const onSeek = vi.fn();
    const user = (await import('@testing-library/user-event')).default.setup();

    render(<LyricsDisplay lines={mockLines} currentTimeMs={0} onSeek={onSeek} />);

    await user.click(screen.getByText('Second line'));
    expect(onSeek).toHaveBeenCalledWith(5000);
  });
});
