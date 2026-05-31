import type { PlaylistTrack } from '@/types';

export type SortBy = 'default' | 'title' | 'channel' | 'addedAt' | 'duration';

export function sortTracks(tracks: PlaylistTrack[], sortBy: SortBy): PlaylistTrack[] {
  if (sortBy === 'default') {return [...tracks];}

  return [...tracks].sort((a, b) => {
    switch (sortBy) {
      case 'title':
        return a.title.localeCompare(b.title, 'ko');
      case 'channel':
        return a.channel.localeCompare(b.channel, 'ko');
      case 'addedAt':
        return b.addedAt.localeCompare(a.addedAt);
      case 'duration':
        return a.duration - b.duration;
      default:
        return 0;
    }
  });
}
