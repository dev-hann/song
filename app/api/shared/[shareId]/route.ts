import { NextResponse } from 'next/server';
import { handleErrors } from '@/server/lib/route-helpers';
import { getSharedPlaylist } from '@/server/models/playlist';

export const GET = handleErrors(async (
  _request: Request,
  { params }: { params: Promise<{ shareId: string }> },
) => {
  const { shareId } = await params;
  const playlist = await getSharedPlaylist(shareId);
  if (!playlist) {
    return NextResponse.json({ error: 'Playlist not found' }, { status: 404 });
  }

  return NextResponse.json({
    id: playlist.id,
    name: playlist.name,
    description: playlist.description,
    coverImage: playlist.coverImage,
    trackCount: playlist.trackCount,
    tracks: playlist.tracks,
    createdAt: playlist.createdAt,
  });
});
