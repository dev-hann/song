import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ProgressBar } from '@/components/ui/progress-bar';

describe('ProgressBar', () => {
  const onChangeMock = vi.fn();
  const formatTimeMock = vi.fn((seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  });

  beforeEach(() => {
    onChangeMock.mockClear();
    formatTimeMock.mockClear();
  });

  it('should render input element', () => {
    render(
      <ProgressBar 
        value={50} 
        max={100} 
        onChange={onChangeMock} 
      />
    );
    
    const input = screen.getByRole('slider');
    expect(input).toBeInTheDocument();
  });

  it('should set correct initial value', () => {
    render(
      <ProgressBar 
        value={50} 
        max={100} 
        onChange={onChangeMock} 
      />
    );
    
    const input = screen.getByRole('slider');
    expect(input).toHaveValue('50');
  });

  it('should call onChange when value changes', () => {
    render(
      <ProgressBar 
        value={0} 
        max={100} 
        onChange={onChangeMock} 
      />
    );
    
    const input = screen.getByRole('slider');
    fireEvent.change(input, { target: { value: '75' } });
    
    expect(onChangeMock).toHaveBeenCalledWith(75);
  });

  it('should display time preview when formatTime is provided', () => {
    render(
      <ProgressBar 
        value={50} 
        max={100} 
        onChange={onChangeMock}
        formatTime={formatTimeMock}
      />
    );
    
    const input = screen.getByRole('slider');
    fireEvent.mouseMove(input, { clientX: 100, clientY: 50 });
    
    expect(formatTimeMock).toHaveBeenCalled();
  });

  it('should not display time preview when formatTime is not provided', () => {
    render(
      <ProgressBar 
        value={50} 
        max={100} 
        onChange={onChangeMock}
      />
    );
    
    const preview = screen.queryByText(/\d+:\d+/);
    expect(preview).not.toBeInTheDocument();
  });

  it('should calculate correct percentage for progress', () => {
    render(
      <ProgressBar 
        value={50} 
        max={100} 
        onChange={onChangeMock} 
      />
    );
    
    const input = screen.getByRole('slider');
    const style = input.style.background;
    expect(style).toContain('white 50%');
  });

  it('should display buffered range when buffered is provided', () => {
    render(
      <ProgressBar 
        value={50} 
        max={100} 
        onChange={onChangeMock}
        buffered={30}
      />
    );
    
    const input = screen.getByRole('slider');
    const style = input.style.background;
    expect(style).toContain('rgba(255, 255, 255, 0.4) 0%');
    expect(style).toContain('rgba(255, 255, 255, 0.4) 30%');
  });

  it('should handle zero max value', () => {
    render(
      <ProgressBar 
        value={0} 
        max={0} 
        onChange={onChangeMock} 
      />
    );
    
    const input = screen.getByRole('slider');
    expect(input).toBeInTheDocument();
  });

  it('should handle negative value', () => {
    render(
      <ProgressBar 
        value={-10} 
        max={100} 
        onChange={onChangeMock} 
      />
    );
    
    const input = screen.getByRole('slider');
    expect(input).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    const { container } = render(
      <ProgressBar 
        value={50} 
        max={100} 
        onChange={onChangeMock}
        className="custom-class"
      />
    );
    
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('should display 100% when value equals max', () => {
    render(
      <ProgressBar 
        value={100} 
        max={100} 
        onChange={onChangeMock} 
      />
    );
    
    const input = screen.getByRole('slider');
    const style = input.style.background;
    expect(style).toContain('white 100%');
  });

  it('should display 0% when value is zero', () => {
    render(
      <ProgressBar 
        value={0} 
        max={100} 
        onChange={onChangeMock} 
      />
    );
    
    const input = screen.getByRole('slider');
    const style = input.style.background;
    expect(style).toContain('white 0%');
  });
});
