import type { PlaylistTrack } from '@/types';

export function filterTracks(tracks: PlaylistTrack[], query: string): PlaylistTrack[] {
  const trimmed = query.trim().toLowerCase();
  if (!trimmed) {return [...tracks];}

  return tracks.filter(
    (t) =>
      t.title.toLowerCase().includes(trimmed) ||
      t.channel.toLowerCase().includes(trimmed),
  );
}
