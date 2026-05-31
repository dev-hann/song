import { describe, it, expect } from 'vitest';
import { cn } from '../utils';

describe('cn', () => {
  it('joins multiple class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });

  it('handles conditional classes', () => {
    const condition = false;
    expect(cn('foo', condition && 'bar')).toBe('foo');
  });

  it('ignores undefined', () => {
    expect(cn('foo', undefined)).toBe('foo');
  });

  it('merges object with truthy value', () => {
    expect(cn('foo', { bar: true })).toBe('foo bar');
  });

  it('ignores object with falsy value', () => {
    expect(cn('foo', { bar: false })).toBe('foo');
  });

  it('deduplicates tailwind classes via tailwind-merge', () => {
    expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4');
  });
});
