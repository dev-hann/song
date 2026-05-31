import { NextResponse } from 'next/server';
import { requireAuth, validateBody, validateParams, handleErrors } from '@/server/lib/route-helpers';
import { useCases } from '@/server/application/wiring';
import { PathIdSchema, ReorderSchema } from '@/server/application/schemas/request';

export const PUT = handleErrors(async (
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) => {
  const { session, error } = await requireAuth();
  if (error) { return error; }

  const { id } = await params;
  const { data: pathData, error: paramError } = validateParams(PathIdSchema, { id });
  if (paramError) { return paramError; }

  const { data, error: bodyError } = validateBody(ReorderSchema, await request.json());
  if (bodyError) { return bodyError; }

  await useCases.playlists.reorder(session.user.id, pathData.id, data.trackIds);
  const playlist = await useCases.playlists.getById(session.user.id, pathData.id);
  return NextResponse.json(playlist);
});
