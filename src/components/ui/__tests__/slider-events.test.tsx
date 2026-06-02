import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Slider } from '@/components/ui/slider';

describe('Slider event behavior', () => {
  it('does NOT fire onValueChange on mount with initial value', () => {
    const onValueChange = vi.fn();
    const onValueCommitted = vi.fn();

    render(
      <Slider
        value={[50]}
        min={0}
        max={100}
        onValueChange={onValueChange}
        onValueCommitted={onValueCommitted}
      />,
    );

    expect(onValueChange).not.toHaveBeenCalled();
    expect(onValueCommitted).not.toHaveBeenCalled();
  });

  it('does NOT fire onValueChange when value prop updates', () => {
    const onValueChange = vi.fn();
    const onValueCommitted = vi.fn();

    const { rerender } = render(
      <Slider
        value={[50]}
        min={0}
        max={100}
        onValueChange={onValueChange}
        onValueCommitted={onValueCommitted}
      />,
    );

    expect(onValueChange).not.toHaveBeenCalled();

    rerender(
      <Slider
        value={[75]}
        min={0}
        max={100}
        onValueChange={onValueChange}
        onValueCommitted={onValueCommitted}
      />,
    );

    expect(onValueChange).not.toHaveBeenCalled();
    expect(onValueCommitted).not.toHaveBeenCalled();
  });

  it('fires onValueChange only on user interaction', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    const onValueCommitted = vi.fn();

    const { container } = render(
      <Slider
        value={[50]}
        min={0}
        max={100}
        onValueChange={onValueChange}
        onValueCommitted={onValueCommitted}
      />,
    );

    const track = container.querySelector('[data-slot="slider-track"]');
    expect(track).toBeTruthy();

    await user.click(track!);

    expect(onValueChange).toHaveBeenCalled();
  });
});
