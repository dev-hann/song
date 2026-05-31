import { NextResponse } from 'next/server';
import { requireAuth, validateParams, handleErrors } from '@/server/lib/route-helpers';
import { useCases } from '@/server/application/wiring';
import { PathIdSchema } from '@/server/application/schemas/request';
import { ChannelResponseSchema } from '@/server/application/schemas/response';

export const GET = handleErrors(async (
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) => {
  const { session, error } = await requireAuth();
  if (error) { return error; }

  const { id } = await params;
  const { data, error: paramError } = validateParams(PathIdSchema, { id });
  if (paramError) { return paramError; }

  const channel = await useCases.channels.get(session.user.id, data.id);
  return NextResponse.json(ChannelResponseSchema.parse(channel));
});
