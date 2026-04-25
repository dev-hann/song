import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LikeButton } from '@/components/ui/like-button';

describe('LikeButton', () => {
  it('should render button', () => {
    render(<LikeButton isLiked={false} onToggle={vi.fn()} />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('should display unfilled heart when not liked', () => {
    render(<LikeButton isLiked={false} onToggle={vi.fn()} />);
    const svg = screen.getByRole('button').querySelector('svg');
    expect(svg).toHaveClass('text-zinc-400');
  });

  it('should display filled heart when liked', () => {
    render(<LikeButton isLiked={true} onToggle={vi.fn()} />);
    const svg = screen.getByRole('button').querySelector('svg');
    expect(svg).toHaveClass('text-white');
    expect(svg).toHaveClass('fill-white');
  });

  it('should call onToggle when clicked', async () => {
    const onToggleMock = vi.fn();
    render(<LikeButton isLiked={false} onToggle={onToggleMock} />);
    
    const button = screen.getByRole('button');
    await userEvent.click(button);
    
    expect(onToggleMock).toHaveBeenCalledTimes(1);
  });

  it('should have correct aria-label when not liked', () => {
    render(<LikeButton isLiked={false} onToggle={vi.fn()} />);
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-label', '좋아요');
  });

  it('should have correct aria-label when liked', () => {
    render(<LikeButton isLiked={true} onToggle={vi.fn()} />);
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-label', '좋아요 취소');
  });
});
