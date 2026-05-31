import { NextResponse } from 'next/server';
import { requireAuth, validateBody, handleErrors } from '@/server/lib/route-helpers';
import { updatePlaylist } from '@/server/models/playlist';
import { z } from 'zod';

const SharePlaylistSchema = z.object({
  isPublic: z.boolean(),
});

export const POST = handleErrors(async (
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) => {
  const { session, error } = await requireAuth();
  if (error) {return error;}

  const { id } = await params;
  const { data, error: bodyError } = validateBody(SharePlaylistSchema, await request.json());
  if (bodyError) {return bodyError;}

  const playlist = await updatePlaylist(session.user.id, id, { isPublic: data.isPublic });
  if (!playlist) {
    return NextResponse.json({ error: 'Playlist not found' }, { status: 404 });
  }

  return NextResponse.json({
    isPublic: playlist.isPublic,
    shareId: playlist.shareId,
  });
});
