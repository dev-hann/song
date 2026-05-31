import { NextResponse } from 'next/server';
import { requireAuth, validateBody, validateParams, handleErrors } from '@/server/lib/route-helpers';
import { useCases } from '@/server/application/wiring';
import { PathIdSchema, SharePlaylistSchema } from '@/server/application/schemas/request';

export const POST = handleErrors(async (
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) => {
  const { session, error } = await requireAuth();
  if (error) { return error; }

  const { id } = await params;
  const { data: pathData, error: paramError } = validateParams(PathIdSchema, { id });
  if (paramError) { return paramError; }

  const { data, error: bodyError } = validateBody(SharePlaylistSchema, await request.json());
  if (bodyError) { return bodyError; }

  const playlist = await useCases.playlists.update(session.user.id, pathData.id, { isPublic: data.isPublic });
  if (!playlist) {
    return NextResponse.json({ error: 'Playlist not found' }, { status: 404 });
  }

  return NextResponse.json({
    isPublic: playlist.isPublic,
    shareId: playlist.shareId,
  });
});
