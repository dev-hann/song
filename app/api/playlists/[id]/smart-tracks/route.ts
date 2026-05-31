import { NextResponse } from 'next/server';
import { requireAuth, validateParams, handleErrors } from '@/server/lib/route-helpers';
import { useCases } from '@/server/application/wiring';
import { PathIdSchema } from '@/server/application/schemas/request';

export const GET = handleErrors(async (
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) => {
  const { session, error } = await requireAuth();
  if (error) { return error; }

  const { id } = await params;
  const { data, error: paramError } = validateParams(PathIdSchema, { id });
  if (paramError) { return paramError; }

  const playlist = await useCases.playlists.getById(session.user.id, data.id);
  if (!playlist) {
    return NextResponse.json({ error: 'Playlist not found' }, { status: 404 });
  }

  if (!playlist.rules) {
    return NextResponse.json({ error: 'Not a smart playlist' }, { status: 400 });
  }

  const tracks = await useCases.playlists.getSmartTracks(session.user.id, playlist.rules);
  return NextResponse.json(tracks);
});
