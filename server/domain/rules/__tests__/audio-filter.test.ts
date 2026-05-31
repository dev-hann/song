// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { isAudioContent } from '../audio-filter';

describe('isAudioContent', () => {
  it('accepts duration between 30 and 900 seconds', () => {
    expect(isAudioContent(30)).toBe(true);
    expect(isAudioContent(900)).toBe(true);
    expect(isAudioContent(300)).toBe(true);
  });

  it('rejects duration below 30 seconds', () => {
    expect(isAudioContent(0)).toBe(false);
    expect(isAudioContent(29)).toBe(false);
    expect(isAudioContent(1)).toBe(false);
  });

  it('rejects duration above 900 seconds', () => {
    expect(isAudioContent(901)).toBe(false);
    expect(isAudioContent(3600)).toBe(false);
  });
});
