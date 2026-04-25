import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ShuffleButton } from '@/components/ui/shuffle-button';

describe('ShuffleButton', () => {
  it('should render button', () => {
    render(<ShuffleButton isShuffle={false} onToggle={vi.fn()} />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('should display text-zinc-400 when not active', () => {
    render(<ShuffleButton isShuffle={false} onToggle={vi.fn()} />);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('text-zinc-400');
  });

  it('should display text-white when active', () => {
    render(<ShuffleButton isShuffle={true} onToggle={vi.fn()} />);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('text-white');
  });

  it('should call onToggle when clicked', async () => {
    const onToggleMock = vi.fn();
    render(<ShuffleButton isShuffle={false} onToggle={onToggleMock} />);
    
    const button = screen.getByRole('button');
    await userEvent.click(button);
    
    expect(onToggleMock).toHaveBeenCalledTimes(1);
  });

  it('should have correct aria-label when not shuffled', () => {
    render(<ShuffleButton isShuffle={false} onToggle={vi.fn()} />);
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-label', '셔플 켜기');
  });

  it('should have correct aria-label when shuffled', () => {
    render(<ShuffleButton isShuffle={true} onToggle={vi.fn()} />);
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-label', '셔플 끄기');
  });
});
