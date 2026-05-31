import { NextResponse } from 'next/server';
import { requireAuth, validateParams, handleErrors } from '@/server/lib/route-helpers';
import { useCases } from '@/server/application/wiring';
import { PathVideoIdSchema } from '@/server/application/schemas/request';

export const DELETE = handleErrors(async (
  _request: Request,
  { params }: { params: Promise<{ videoId: string }> },
) => {
  const { session, error } = await requireAuth();
  if (error) { return error; }

  const { videoId } = await params;
  const { data, error: paramError } = validateParams(PathVideoIdSchema, { videoId });
  if (paramError) { return paramError; }

  const removed = await useCases.likes.remove(session.user.id, data.videoId);
  if (!removed) {
    return NextResponse.json({ error: 'Like not found' }, { status: 404 });
  }
  return NextResponse.json({ success: true });
});
