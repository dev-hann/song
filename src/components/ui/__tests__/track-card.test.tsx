import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TrackCard } from '@/components/ui/track-card';

const mockTrack = {
  id: 'video123',
  title: 'Test Track Title',
  channel: 'Test Channel',
  thumbnail: 'https://example.com/thumb.jpg',
  duration: 245,
};

describe('TrackCard', () => {
  describe('square variant', () => {
    it('renders square card with title, channel, and duration badge', () => {
      render(<TrackCard variant="square" {...mockTrack} />);

      expect(screen.getByText('Test Track Title')).toBeInTheDocument();
      expect(screen.getByText('Test Channel')).toBeInTheDocument();
      expect(screen.getByText('04:05')).toBeInTheDocument();
      expect(screen.getByAltText('Test Track Title')).toBeInTheDocument();
    });

    it('hides duration badge when duration is 0', () => {
      render(<TrackCard variant="square" {...mockTrack} duration={0} />);

      expect(screen.queryByText('04:05')).not.toBeInTheDocument();
    });

    it('calls onClick on card click', async () => {
      const onClick = vi.fn();
      const user = userEvent.setup();

      render(<TrackCard variant="square" {...mockTrack} onClick={onClick} />);

      await user.click(screen.getByRole('button'));
      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('renders without onClick', () => {
      render(<TrackCard variant="square" {...mockTrack} />);
      expect(screen.getByText('Test Track Title')).toBeInTheDocument();
    });

    it('applies active scale on click', () => {
      render(<TrackCard variant="square" {...mockTrack} onClick={vi.fn()} />);
      const button = screen.getByRole('button');
      expect(button.className).toContain('active:scale-95');
    });
  });

  describe('landscape variant', () => {
    it('renders landscape card with title, channel, and duration badge', () => {
      render(<TrackCard variant="landscape" {...mockTrack} />);

      expect(screen.getByText('Test Track Title')).toBeInTheDocument();
      expect(screen.getByText('Test Channel')).toBeInTheDocument();
      expect(screen.getByText('04:05')).toBeInTheDocument();
      expect(screen.getByAltText('Test Track Title')).toBeInTheDocument();
    });

    it('hides duration badge when duration is 0', () => {
      render(<TrackCard variant="landscape" {...mockTrack} duration={0} />);

      expect(screen.queryByText('04:05')).not.toBeInTheDocument();
    });

    it('calls onClick on row click', async () => {
      const onClick = vi.fn();
      const user = userEvent.setup();

      render(<TrackCard variant="landscape" {...mockTrack} onClick={onClick} />);

      await user.click(screen.getByRole('button'));
      expect(onClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('common behavior', () => {
    it('renders without thumbnail', () => {
      render(<TrackCard variant="square" {...mockTrack} thumbnail="" />);

      expect(screen.getByText('Test Track Title')).toBeInTheDocument();
      expect(screen.queryByAltText('Test Track Title')).not.toBeInTheDocument();
    });

    it('clamps long titles to 2 lines in square variant', () => {
      render(<TrackCard variant="square" {...mockTrack} title="A very long title that should be clamped to two lines maximum" />);

      const title = screen.getByText('A very long title that should be clamped to two lines maximum');
      expect(title.className).toContain('line-clamp-2');
    });

    it('clamps long titles to 2 lines in landscape variant', () => {
      render(<TrackCard variant="landscape" {...mockTrack} title="A very long title that should be clamped to two lines maximum" />);

      const title = screen.getByText('A very long title that should be clamped to two lines maximum');
      expect(title.className).toContain('line-clamp-2');
    });
  });
});
