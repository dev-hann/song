import { describe, it, expect } from 'vitest';
import { formatDuration, formatTotalDuration, getThumbnailUrl } from '../formatters';

describe('formatDuration', () => {
  it('returns "00:00" for 0 seconds', () => {
    expect(formatDuration(0)).toBe('00:00');
  });

  it('returns "00:01" for 1 second', () => {
    expect(formatDuration(1)).toBe('00:01');
  });

  it('returns "00:59" for 59 seconds', () => {
    expect(formatDuration(59)).toBe('00:59');
  });

  it('returns "01:01" for 61 seconds', () => {
    expect(formatDuration(61)).toBe('01:01');
  });

  it('returns "03:05" for 185 seconds', () => {
    expect(formatDuration(185)).toBe('03:05');
  });

  it('returns "1:00:00" for 3600 seconds', () => {
    expect(formatDuration(3600)).toBe('1:00:00');
  });

  it('returns "1:01:01" for 3661 seconds', () => {
    expect(formatDuration(3661)).toBe('1:01:01');
  });

  it('returns "2:02:05" for 7325 seconds', () => {
    expect(formatDuration(7325)).toBe('2:02:05');
  });
});

describe('formatTotalDuration', () => {
  it('returns empty string for 0 seconds', () => {
    expect(formatTotalDuration(0)).toBe('');
  });

  it('returns seconds only for under 60 seconds', () => {
    expect(formatTotalDuration(32)).toBe('32초');
  });

  it('returns minutes only when seconds are 0', () => {
    expect(formatTotalDuration(60)).toBe('1분');
  });

  it('returns minutes and seconds', () => {
    expect(formatTotalDuration(92)).toBe('1분 32초');
  });

  it('returns hours only when minutes and seconds are 0', () => {
    expect(formatTotalDuration(3600)).toBe('1시간');
  });

  it('returns hours and minutes', () => {
    expect(formatTotalDuration(3660)).toBe('1시간 1분');
  });

  it('returns hours, minutes and seconds', () => {
    expect(formatTotalDuration(3661)).toBe('1시간 1분 1초');
  });

  it('returns 2 hours 2 minutes 5 seconds', () => {
    expect(formatTotalDuration(7325)).toBe('2시간 2분 5초');
  });
});

describe('getThumbnailUrl', () => {
  it('returns empty string for undefined', () => {
    expect(getThumbnailUrl(undefined)).toBe('');
  });

  it('returns empty string for empty string', () => {
    expect(getThumbnailUrl('')).toBe('');
  });

  it('returns the string when given a valid URL string', () => {
    expect(getThumbnailUrl('https://example.com/img.jpg')).toBe('https://example.com/img.jpg');
  });

  it('returns url from thumbnail object with valid url', () => {
    const thumbnail = { url: 'https://example.com/img.jpg', width: 100, height: 100 };
    expect(getThumbnailUrl(thumbnail)).toBe('https://example.com/img.jpg');
  });

  it('returns empty string from thumbnail object with empty url', () => {
    const thumbnail = { url: '', width: 100, height: 100 };
    expect(getThumbnailUrl(thumbnail)).toBe('');
  });
});
