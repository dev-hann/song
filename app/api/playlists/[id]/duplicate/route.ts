import { NextResponse } from 'next/server';
import { requireAuth, validateParams, handleErrors } from '@/server/lib/route-helpers';
import { useCases } from '@/server/application/wiring';
import { PathIdSchema } from '@/server/application/schemas/request';

export const POST = handleErrors(async (
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) => {
  const { session, error } = await requireAuth();
  if (error) { return error; }

  const { id } = await params;
  const { data, error: paramError } = validateParams(PathIdSchema, { id });
  if (paramError) { return paramError; }

  const result = await useCases.playlists.duplicate(session.user.id, data.id);

  if (!result) {
    return NextResponse.json({ error: 'Playlist not found' }, { status: 404 });
  }

  return NextResponse.json(result, { status: 201 });
});
