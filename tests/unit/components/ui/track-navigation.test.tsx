import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TrackNavigation } from '@/components/ui/track-navigation';

describe('TrackNavigation', () => {
  it('should render both buttons', () => {
    render(
      <TrackNavigation 
        onPrevious={vi.fn()} 
        onNext={vi.fn()} 
      />
    );
    
    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(2);
  });

  it('should call onPrevious when previous button is clicked', async () => {
    const onPreviousMock = vi.fn();
    render(
      <TrackNavigation 
        onPrevious={onPreviousMock} 
        onNext={vi.fn()} 
      />
    );
    
    const previousButton = screen.getByLabelText('이전 트랙');
    await userEvent.click(previousButton);
    
    expect(onPreviousMock).toHaveBeenCalledTimes(1);
  });

  it('should call onNext when next button is clicked', async () => {
    const onNextMock = vi.fn();
    render(
      <TrackNavigation 
        onPrevious={vi.fn()} 
        onNext={onNextMock} 
      />
    );
    
    const nextButton = screen.getByLabelText('다음 트랙');
    await userEvent.click(nextButton);
    
    expect(onNextMock).toHaveBeenCalledTimes(1);
  });

  it('should disable buttons when disabled prop is true', () => {
    render(
      <TrackNavigation 
        onPrevious={vi.fn()} 
        onNext={vi.fn()} 
        disabled={true}
      />
    );
    
    const buttons = screen.getAllByRole('button');
    buttons.forEach(button => {
      expect(button).toBeDisabled();
    });
  });

  it('should not disable buttons when disabled prop is false', () => {
    render(
      <TrackNavigation 
        onPrevious={vi.fn()} 
        onNext={vi.fn()} 
        disabled={false}
      />
    );
    
    const buttons = screen.getAllByRole('button');
    buttons.forEach(button => {
      expect(button).not.toBeDisabled();
    });
  });

  it('should display ChevronLeft icon for previous button', () => {
    render(
      <TrackNavigation 
        onPrevious={vi.fn()} 
        onNext={vi.fn()} 
      />
    );
    
    const previousButton = screen.getByLabelText('이전 트랙');
    const svg = previousButton.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('should display ChevronRight icon for next button', () => {
    render(
      <TrackNavigation 
        onPrevious={vi.fn()} 
        onNext={vi.fn()} 
      />
    );
    
    const nextButton = screen.getByLabelText('다음 트랙');
    const svg = nextButton.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });
});
