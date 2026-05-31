// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { evaluateSmartPlaylistRules } from '../smart-playlist';

const tracks = [
  { title: 'Song A', channel: 'Artist X', duration: 200, addedAt: '2024-01-01' },
  { title: 'Song B', channel: 'Artist Y', duration: 400, addedAt: '2024-06-01' },
  { title: 'Song C', channel: 'Artist X', duration: 100, addedAt: '2024-12-01' },
  { title: 'Distant Dreamer', channel: 'Artist Z', duration: 300, addedAt: '2024-03-01' },
];

describe('evaluateSmartPlaylistRules', () => {
  describe('match: all', () => {
    it('filters tracks matching all conditions', () => {
      const rules = {
        match: 'all' as const,
        conditions: [
          { field: 'channel' as const, operator: 'contains' as const, value: 'Artist X' },
          { field: 'minDuration' as const, operator: 'gte' as const, value: 150 },
        ],
      };
      const result = evaluateSmartPlaylistRules(tracks, rules);
      expect(result).toEqual([
        { title: 'Song A', channel: 'Artist X', duration: 200, addedAt: '2024-01-01' },
      ]);
    });

    it('returns empty when no track matches all conditions', () => {
      const rules = {
        match: 'all' as const,
        conditions: [
          { field: 'channel' as const, operator: 'equals' as const, value: 'Nonexistent' },
        ],
      };
      const result = evaluateSmartPlaylistRules(tracks, rules);
      expect(result).toEqual([]);
    });
  });

  describe('match: any', () => {
    it('filters tracks matching any condition', () => {
      const rules = {
        match: 'any' as const,
        conditions: [
          { field: 'channel' as const, operator: 'equals' as const, value: 'Artist X' },
          { field: 'channel' as const, operator: 'equals' as const, value: 'Artist Y' },
        ],
      };
      const result = evaluateSmartPlaylistRules(tracks, rules);
      expect(result).toHaveLength(3);
    });
  });

  describe('operators', () => {
    it('contains — case-insensitive substring match', () => {
      const rules = { match: 'all' as const, conditions: [{ field: 'title' as const, operator: 'contains' as const, value: 'distant' }] };
      const result = evaluateSmartPlaylistRules(tracks, rules);
      expect(result).toEqual([tracks[3]]);
    });

    it('equals — exact match', () => {
      const rules = { match: 'all' as const, conditions: [{ field: 'channel' as const, operator: 'equals' as const, value: 'Artist X' }] };
      const result = evaluateSmartPlaylistRules(tracks, rules);
      expect(result).toHaveLength(2);
    });

    it('startsWith — case-insensitive prefix match', () => {
      const rules = { match: 'all' as const, conditions: [{ field: 'title' as const, operator: 'startsWith' as const, value: 'song' }] };
      const result = evaluateSmartPlaylistRules(tracks, rules);
      expect(result).toHaveLength(3);
    });

    it('gt — greater than', () => {
      const rules = { match: 'all' as const, conditions: [{ field: 'minDuration' as const, operator: 'gt' as const, value: 200 }] };
      const result = evaluateSmartPlaylistRules(tracks, rules);
      expect(result.every((t) => t.duration > 200)).toBe(true);
    });

    it('lt — less than', () => {
      const rules = { match: 'all' as const, conditions: [{ field: 'maxDuration' as const, operator: 'lt' as const, value: 200 }] };
      const result = evaluateSmartPlaylistRules(tracks, rules);
      expect(result.every((t) => t.duration < 200)).toBe(true);
    });

    it('gte — greater than or equal', () => {
      const rules = { match: 'all' as const, conditions: [{ field: 'minDuration' as const, operator: 'gte' as const, value: 200 }] };
      const result = evaluateSmartPlaylistRules(tracks, rules);
      expect(result.every((t) => t.duration >= 200)).toBe(true);
    });

    it('lte — less than or equal', () => {
      const rules = { match: 'all' as const, conditions: [{ field: 'maxDuration' as const, operator: 'lte' as const, value: 200 }] };
      const result = evaluateSmartPlaylistRules(tracks, rules);
      expect(result.every((t) => t.duration <= 200)).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('returns all tracks when conditions match everything', () => {
      const rules = { match: 'all' as const, conditions: [{ field: 'minDuration' as const, operator: 'gte' as const, value: 0 }] };
      const result = evaluateSmartPlaylistRules(tracks, rules);
      expect(result).toHaveLength(4);
    });

    it('handles unknown field gracefully', () => {
      const rules = { match: 'all' as const, conditions: [{ field: 'unknown' as unknown as 'channel', operator: 'equals' as const, value: 'test' }] };
      const result = evaluateSmartPlaylistRules(tracks, rules);
      expect(result).toEqual([]);
    });

    it('handles unknown operator gracefully', () => {
      const rules = { match: 'all' as const, conditions: [{ field: 'channel' as const, operator: 'unknown' as unknown as 'equals', value: 'test' }] };
      const result = evaluateSmartPlaylistRules(tracks, rules);
      expect(result).toEqual([]);
    });

    it('works with addedAfter/addedBefore fields', () => {
      const rules = { match: 'all' as const, conditions: [{ field: 'addedAfter' as const, operator: 'gte' as const, value: '2024-06-01' }] };
      const result = evaluateSmartPlaylistRules(tracks, rules);
      expect(result).toHaveLength(2);
    });
  });
});
