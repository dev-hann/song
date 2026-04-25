import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSwipeDown } from '@/hooks/use-swipe-down';

describe('useSwipeDown', () => {
  const onSwipeDownMock = vi.fn();

  beforeEach(() => {
    onSwipeDownMock.mockClear();
  });

  it('should return elementRef', () => {
    const { result } = renderHook(() => useSwipeDown({ onSwipeDown: onSwipeDownMock }));
    expect(result.current.elementRef).toBeDefined();
    expect(typeof result.current.elementRef).toBe('function');
  });

  it('should not call onSwipeDown for small vertical movement', () => {
    const { result } = renderHook(() => useSwipeDown({ onSwipeDown: onSwipeDownMock }));
    const element = document.createElement('div');
    
    act(() => {
      result.current.elementRef(element);
    });
    
    const touchStartEvent = new TouchEvent('touchstart', {
      bubbles: true,
      cancelable: true,
      touches: [{ clientY: 100 } as Touch]
    });
    element.dispatchEvent(touchStartEvent);

    const touchMoveEvent = new TouchEvent('touchmove', {
      bubbles: true,
      cancelable: true,
      touches: [{ clientY: 120 } as Touch]
    });
    element.dispatchEvent(touchMoveEvent);

    const touchEndEvent = new TouchEvent('touchend', {
      bubbles: true,
      cancelable: true,
      changedTouches: [{ clientY: 120 } as Touch]
    });
    element.dispatchEvent(touchEndEvent);

    expect(onSwipeDownMock).not.toHaveBeenCalled();
  });

  it('should not call onSwipeDown for vertical movement below threshold', () => {
    const { result } = renderHook(() => useSwipeDown({ 
      onSwipeDown: onSwipeDownMock,
      threshold: 100 
    }));
    const element = document.createElement('div');
    
    act(() => {
      result.current.elementRef(element);
    });
    
    const touchStartEvent = new TouchEvent('touchstart', {
      bubbles: true,
      cancelable: true,
      touches: [{ clientY: 100 } as Touch]
    });
    element.dispatchEvent(touchStartEvent);

    const touchEndEvent = new TouchEvent('touchend', {
      bubbles: true,
      cancelable: true,
      changedTouches: [{ clientY: 180 } as Touch]
    });
    element.dispatchEvent(touchEndEvent);

    expect(onSwipeDownMock).not.toHaveBeenCalled();
  });

  it('should call onSwipeDown for vertical movement above threshold', async () => {
    const { result } = renderHook(() => useSwipeDown({ 
      onSwipeDown: onSwipeDownMock,
      threshold: 100 
    }));
    const element = document.createElement('div');
    
    await act(async () => {
      result.current.elementRef(element);
    });
    
    const touchStartEvent = new TouchEvent('touchstart', {
      bubbles: true,
      cancelable: true,
      touches: [{ clientY: 100 } as Touch]
    });
    element.dispatchEvent(touchStartEvent);

    const touchEndEvent = new TouchEvent('touchend', {
      bubbles: true,
      cancelable: true,
      changedTouches: [{ clientY: 250 } as Touch]
    });
    element.dispatchEvent(touchEndEvent);

    expect(onSwipeDownMock).toHaveBeenCalledTimes(1);
  });

  it('should use default threshold of 100', async () => {
    const { result } = renderHook(() => useSwipeDown({ onSwipeDown: onSwipeDownMock }));
    const element = document.createElement('div');
    
    await act(async () => {
      result.current.elementRef(element);
    });
    
    const touchStartEvent = new TouchEvent('touchstart', {
      bubbles: true,
      cancelable: true,
      touches: [{ clientY: 100 } as Touch]
    });
    element.dispatchEvent(touchStartEvent);

    const touchEndEvent = new TouchEvent('touchend', {
      bubbles: true,
      cancelable: true,
      changedTouches: [{ clientY: 210 } as Touch]
    });
    element.dispatchEvent(touchEndEvent);

    expect(onSwipeDownMock).toHaveBeenCalledTimes(1);
  });

  it('should not call onSwipeDown for upward swipe', () => {
    const { result } = renderHook(() => useSwipeDown({ 
      onSwipeDown: onSwipeDownMock,
      threshold: 100 
    }));
    const element = document.createElement('div');
    
    act(() => {
      result.current.elementRef(element);
    });
    
    const touchStartEvent = new TouchEvent('touchstart', {
      bubbles: true,
      cancelable: true,
      touches: [{ clientY: 300 } as Touch]
    });
    element.dispatchEvent(touchStartEvent);

    const touchEndEvent = new TouchEvent('touchend', {
      bubbles: true,
      cancelable: true,
      changedTouches: [{ clientY: 100 } as Touch]
    });
    element.dispatchEvent(touchEndEvent);

    expect(onSwipeDownMock).not.toHaveBeenCalled();
  });

  it('should handle horizontal swipe (should not trigger)', () => {
    const { result } = renderHook(() => useSwipeDown({ 
      onSwipeDown: onSwipeDownMock,
      threshold: 100 
    }));
    const element = document.createElement('div');
    
    act(() => {
      result.current.elementRef(element);
    });
    
    const touchStartEvent = new TouchEvent('touchstart', {
      bubbles: true,
      cancelable: true,
      touches: [{ clientY: 100, clientX: 100 } as Touch]
    });
    element.dispatchEvent(touchStartEvent);

    const touchEndEvent = new TouchEvent('touchend', {
      bubbles: true,
      cancelable: true,
      changedTouches: [{ clientY: 100, clientX: 300 } as Touch]
    });
    element.dispatchEvent(touchEndEvent);

    expect(onSwipeDownMock).not.toHaveBeenCalled();
  });
});
