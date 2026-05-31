import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth, validateBody, handleErrors } from '@/server/lib/route-helpers';
import { movePlaylistToFolder } from '@/server/models/playlist';

const MoveToFolderSchema = z.object({
  folderId: z.string().nullable(),
});

export const POST = handleErrors(async (
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) => {
  const { session, error } = await requireAuth();
  if (error) {return error;}

  const { id } = await params;
  const { data, error: bodyError } = validateBody(MoveToFolderSchema, await request.json());
  if (bodyError) {return bodyError;}

  const moved = await movePlaylistToFolder(session.user.id, id, data.folderId);
  if (!moved) {
    return NextResponse.json({ error: 'Playlist or folder not found' }, { status: 404 });
  }
  return NextResponse.json({ success: true });
});
