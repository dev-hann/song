import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSwipeDown } from '@/hooks/use-swipe-down';

function createTouchEvent(type: string, touches: { clientY: number }[] = []) {
  const event = new Event(type, { bubbles: true });
  if (touches.length > 0) {
    Object.defineProperty(event, 'touches', {
      value: touches.map((t) => ({ clientY: t.clientY })),
    });
  }
  if (type === 'touchend') {
    Object.defineProperty(event, 'changedTouches', {
      value: touches.map((t) => ({ clientY: t.clientY })),
    });
  }
  return event;
}

describe('useSwipeDown', () => {
  let onSwipeDown: ReturnType<typeof vi.fn>;
  let element: HTMLDivElement;

  beforeEach(() => {
    onSwipeDown = vi.fn();
    element = document.createElement('div');
    document.body.appendChild(element);
  });

  function setup() {
    const { result } = renderHook(() =>
      useSwipeDown({ onSwipeDown }),
    );
    act(() => {
      result.current.elementRef(element);
    });
    return result;
  }

  it('should not call onSwipeDown when swipe distance is below threshold', () => {
    setup();

    element.dispatchEvent(createTouchEvent('touchstart', [{ clientY: 100 }]));
    element.dispatchEvent(createTouchEvent('touchmove', [{ clientY: 140 }]));
    element.dispatchEvent(createTouchEvent('touchend', [{ clientY: 140 }]));

    expect(onSwipeDown).not.toHaveBeenCalled();
  });

  it('should call onSwipeDown when swipe distance exceeds threshold', () => {
    setup();

    element.dispatchEvent(createTouchEvent('touchstart', [{ clientY: 100 }]));
    element.dispatchEvent(createTouchEvent('touchmove', [{ clientY: 250 }]));
    element.dispatchEvent(createTouchEvent('touchend', [{ clientY: 250 }]));

    expect(onSwipeDown).toHaveBeenCalledTimes(1);
  });

  it('should set up the element via the returned ref callback', () => {
    const { result } = renderHook(() =>
      useSwipeDown({ onSwipeDown }),
    );

    expect(result.current.elementRef).toBeInstanceOf(Function);

    act(() => {
      result.current.elementRef(element);
    });

    element.dispatchEvent(createTouchEvent('touchstart', [{ clientY: 100 }]));
    element.dispatchEvent(createTouchEvent('touchmove', [{ clientY: 250 }]));
    element.dispatchEvent(createTouchEvent('touchend', [{ clientY: 250 }]));

    expect(onSwipeDown).toHaveBeenCalled();
  });
});
