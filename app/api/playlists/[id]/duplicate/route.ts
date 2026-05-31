import { NextResponse } from 'next/server';
import { requireAuth, handleErrors } from '@/server/lib/route-helpers';
import { duplicatePlaylist } from '@/server/models/playlist';

export const POST = handleErrors(async (
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) => {
  const { session, error } = await requireAuth();
  if (error) {return error;}

  const { id } = await params;
  const result = await duplicatePlaylist(session.user.id, id);

  if (!result) {
    return NextResponse.json({ error: 'Playlist not found' }, { status: 404 });
  }

  return NextResponse.json(result, { status: 201 });
});
