import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth, validateBody, handleErrors } from '@/server/lib/route-helpers';
import { reorderPlaylistTracks, getPlaylistById } from '@/server/models/playlist';

const ReorderSchema = z.object({
  trackIds: z.array(z.number().int().positive()).min(1),
});

export const PUT = handleErrors(async (
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) => {
  const { session, error } = await requireAuth();
  if (error) {return error;}

  const { id } = await params;
  const { data, error: bodyError } = validateBody(ReorderSchema, await request.json());
  if (bodyError) {return bodyError;}

  await reorderPlaylistTracks(session.user.id, id, data.trackIds);
  const playlist = await getPlaylistById(session.user.id, id);
  return NextResponse.json(playlist);
});
