// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { parseTranscriptSegments } from '../parsers';

describe('parseTranscriptSegments', () => {
  it('parses valid transcript segments into lyrics lines', () => {
    const segments = [
      { start_ms: '0', end_ms: '5000', snippet: { text: 'Hello' }, start_time_text: { text: '0:00' }, target_id: '1' },
      { start_ms: '5000', end_ms: '10000', snippet: { text: 'World' }, start_time_text: { text: '0:05' }, target_id: '2' },
    ];

    const result = parseTranscriptSegments(segments);

    expect(result).toEqual([
      { startTimeMs: 0, endTimeMs: 5000, text: 'Hello' },
      { startTimeMs: 5000, endTimeMs: 10000, text: 'World' },
    ]);
  });

  it('handles snippet as string directly', () => {
    const segments = [
      { start_ms: '1000', end_ms: '3000', snippet: 'Direct text', start_time_text: { text: '0:01' }, target_id: '1' },
    ];

    const result = parseTranscriptSegments(segments);

    expect(result).toEqual([
      { startTimeMs: 1000, endTimeMs: 3000, text: 'Direct text' },
    ]);
  });

  it('skips segments with empty text', () => {
    const segments = [
      { start_ms: '0', end_ms: '5000', snippet: { text: 'Hello' }, start_time_text: { text: '0:00' }, target_id: '1' },
      { start_ms: '5000', end_ms: '10000', snippet: { text: '' }, start_time_text: { text: '0:05' }, target_id: '2' },
      { start_ms: '10000', end_ms: '15000', snippet: { text: 'World' }, start_time_text: { text: '0:10' }, target_id: '3' },
    ];

    const result = parseTranscriptSegments(segments);

    expect(result).toHaveLength(2);
    expect(result[0].text).toBe('Hello');
    expect(result[1].text).toBe('World');
  });

  it('skips TranscriptSectionHeader items (no start_ms)', () => {
    const segments = [
      { start_ms: '0', end_ms: '5000', snippet: { text: 'Hello' }, start_time_text: { text: '0:00' }, target_id: '1' },
      { type: 'TranscriptSectionHeader' },
      { start_ms: '5000', end_ms: '10000', snippet: { text: 'World' }, start_time_text: { text: '0:05' }, target_id: '3' },
    ];

    const result = parseTranscriptSegments(segments);

    expect(result).toHaveLength(2);
  });

  it('returns empty array for null/undefined input', () => {
    expect(parseTranscriptSegments(null)).toEqual([]);
    expect(parseTranscriptSegments(undefined)).toEqual([]);
  });

  it('returns empty array for non-array input', () => {
    expect(parseTranscriptSegments('not an array')).toEqual([]);
    expect(parseTranscriptSegments(123)).toEqual([]);
  });

  it('handles snippet with text property as object', () => {
    const segments = [
      { start_ms: '2000', end_ms: '6000', snippet: { text: 'Nested text' }, start_time_text: { text: '0:02' }, target_id: '1' },
    ];

    const result = parseTranscriptSegments(segments);

    expect(result).toEqual([
      { startTimeMs: 2000, endTimeMs: 6000, text: 'Nested text' },
    ]);
  });

  it('trims whitespace from text', () => {
    const segments = [
      { start_ms: '0', end_ms: '5000', snippet: { text: '  Hello  ' }, start_time_text: { text: '0:00' }, target_id: '1' },
    ];

    const result = parseTranscriptSegments(segments);

    expect(result[0].text).toBe('Hello');
  });

  it('handles numeric start_ms and end_ms', () => {
    const segments = [
      { start_ms: 1000, end_ms: 5000, snippet: { text: 'Numeric' }, start_time_text: { text: '0:01' }, target_id: '1' },
    ];

    const result = parseTranscriptSegments(segments);

    expect(result).toEqual([
      { startTimeMs: 1000, endTimeMs: 5000, text: 'Numeric' },
    ]);
  });
});
