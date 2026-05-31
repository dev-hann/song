import { NextResponse } from 'next/server';
import { requireAuth, validateParams, handleErrors } from '@/server/lib/route-helpers';
import { useCases } from '@/server/application/wiring';
import { PathVideoIdSchema } from '@/server/application/schemas/request';
import { LikeCheckResponseSchema } from '@/server/application/schemas/response';

export const GET = handleErrors(async (
  _request: Request,
  { params }: { params: Promise<{ videoId: string }> },
) => {
  const { session, error } = await requireAuth();
  if (error) { return error; }

  const { videoId } = await params;
  const { data, error: paramError } = validateParams(PathVideoIdSchema, { videoId });
  if (paramError) { return paramError; }

  const result = await useCases.likes.check(session.user.id, data.videoId);
  return NextResponse.json(LikeCheckResponseSchema.parse(result));
});
