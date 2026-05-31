import { describe, it, expect } from 'vitest';
import { sortTracks } from '../sort-tracks';
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

describe('sortTracks', () => {
  const tracks = [
    baseTrack({ id: 1, title: 'Banana', channel: 'Zed', duration: 300, sortOrder: 0, addedAt: '2024-01-03' }),
    baseTrack({ id: 2, title: 'Apple', channel: 'Alpha', duration: 100, sortOrder: 1, addedAt: '2024-01-01' }),
    baseTrack({ id: 3, title: 'Cherry', channel: 'Beta', duration: 200, sortOrder: 2, addedAt: '2024-01-02' }),
  ];

  it('returns original order for "default"', () => {
    expect(sortTracks(tracks, 'default')).toEqual(tracks);
  });

  it('sorts by title ascending', () => {
    const result = sortTracks(tracks, 'title');
    expect(result.map((t) => t.title)).toEqual(['Apple', 'Banana', 'Cherry']);
  });

  it('sorts by channel ascending', () => {
    const result = sortTracks(tracks, 'channel');
    expect(result.map((t) => t.channel)).toEqual(['Alpha', 'Beta', 'Zed']);
  });

  it('sorts by addedAt descending (most recent first)', () => {
    const result = sortTracks(tracks, 'addedAt');
    expect(result.map((t) => t.addedAt)).toEqual(['2024-01-03', '2024-01-02', '2024-01-01']);
  });

  it('sorts by duration ascending', () => {
    const result = sortTracks(tracks, 'duration');
    expect(result.map((t) => t.duration)).toEqual([100, 200, 300]);
  });

  it('does not mutate original array', () => {
    const copy = [...tracks];
    sortTracks(tracks, 'title');
    expect(tracks).toEqual(copy);
  });
});
