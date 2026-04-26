import { describe, it, expect } from 'vitest';
import { formatDuration, getThumbnailUrl } from '@/lib/formatters';

describe('formatDuration', () => {
  it('formats 0 as 00:00', () => {
    expect(formatDuration(0)).toBe('00:00');
  });

  it('formats single-digit seconds with leading zero', () => {
    expect(formatDuration(8)).toBe('00:08');
  });

  it('formats 65 seconds as 01:05', () => {
    expect(formatDuration(65)).toBe('01:05');
  });

  it('formats 125 seconds as 02:05', () => {
    expect(formatDuration(125)).toBe('02:05');
  });

  it('formats 3600 seconds as 1:00:00', () => {
    expect(formatDuration(3600)).toBe('1:00:00');
  });

  it('formats 3661 seconds as 1:01:01', () => {
    expect(formatDuration(3661)).toBe('1:01:01');
  });

  it('handles negative numbers gracefully', () => {
    expect(formatDuration(-5)).toBe('-1:-5');
  });
});

describe('getThumbnailUrl', () => {
  it('returns string when thumbnail is a string', () => {
    expect(getThumbnailUrl('https://example.com/thumb.jpg')).toBe('https://example.com/thumb.jpg');
  });

  it('returns url when thumbnail is an object with url', () => {
    expect(getThumbnailUrl({ url: 'https://example.com/thumb.jpg', width: 120, height: 90 })).toBe('https://example.com/thumb.jpg');
  });

  it('returns empty string when thumbnail is undefined', () => {
    expect(getThumbnailUrl(undefined)).toBe('');
  });

  it('returns empty string when thumbnail is object without url', () => {
    expect(getThumbnailUrl({ width: 120, height: 90 } as any)).toBe('');
  });
});
