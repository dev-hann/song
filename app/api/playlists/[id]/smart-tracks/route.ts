import { NextResponse } from 'next/server';
import { requireAuth, handleErrors } from '@/server/lib/route-helpers';
import { getPlaylistById, getSmartPlaylistTracks } from '@/server/models/playlist';

export const GET = handleErrors(async (
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) => {
  const { session, error } = await requireAuth();
  if (error) {return error;}

  const { id } = await params;
  const playlist = await getPlaylistById(session.user.id, id);
  if (!playlist) {
    return NextResponse.json({ error: 'Playlist not found' }, { status: 404 });
  }

  if (!playlist.rules) {
    return NextResponse.json({ error: 'Not a smart playlist' }, { status: 400 });
  }

  const tracks = await getSmartPlaylistTracks(session.user.id, playlist.rules);
  return NextResponse.json(tracks);
});
