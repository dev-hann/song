import { describe, it, expect } from 'vitest';
import { filterTracks } from '../filter-tracks';
import type { PlaylistTrack } from '@/types';

const baseTrack = (overrides: Partial<PlaylistTrack> = {}): PlaylistTrack => ({
  id: 1,
  videoId: 'v1',
  title: 'Test Track',
  channel: 'Test Channel',
  thumbnail: '',
  duration: 200,
  sortOrder: 0,
  addedAt: '2024-01-01',
  ...overrides,
});

describe('filterTracks', () => {
  const tracks = [
    baseTrack({ id: 1, title: 'Dynamite', channel: 'BTS' }),
    baseTrack({ id: 2, title: 'Butter', channel: 'BTS' }),
    baseTrack({ id: 3, title: 'How You Like That', channel: 'BLACKPINK' }),
  ];

  it('returns all tracks for empty query', () => {
    expect(filterTracks(tracks, '')).toEqual(tracks);
  });

  it('filters by title case-insensitively', () => {
    const result = filterTracks(tracks, 'dynamite');
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Dynamite');
  });

  it('filters by channel case-insensitively', () => {
    const result = filterTracks(tracks, 'bts');
    expect(result).toHaveLength(2);
  });

  it('returns empty array for no matches', () => {
    expect(filterTracks(tracks, 'nonexistent')).toEqual([]);
  });

  it('matches partial strings', () => {
    const result = filterTracks(tracks, 'how');
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('How You Like That');
  });

  it('trims whitespace from query', () => {
    expect(filterTracks(tracks, '  butter  ')).toHaveLength(1);
  });

  it('does not mutate original array', () => {
    const copy = [...tracks];
    filterTracks(tracks, 'bts');
    expect(tracks).toEqual(copy);
  });
});
