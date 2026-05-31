import { NextResponse } from 'next/server';
import { requireAuth, validateBody, handleErrors } from '@/server/lib/route-helpers';
import { useCases } from '@/server/application/wiring';
import { AddHistorySchema, HistoryQuerySchema } from '@/server/application/schemas/request';
import { HistoryResponseSchema } from '@/server/application/schemas/response';

export const GET = handleErrors(async (request: Request) => {
  const { session, error } = await requireAuth();
  if (error) { return error; }

  const sp = new URL(request.url).searchParams;
  const { data, error: paramError } = validateBody(HistoryQuerySchema, { limit: sp.get('limit') ?? undefined });
  if (paramError) { return paramError; }

  const history = await useCases.history.get(session.user.id, data.limit);
  return NextResponse.json(HistoryResponseSchema.parse(history));
});

export const POST = handleErrors(async (request: Request) => {
  const { session, error } = await requireAuth();
  if (error) { return error; }

  const { data, error: bodyError } = validateBody(AddHistorySchema, await request.json());
  if (bodyError) { return bodyError; }

  await useCases.history.add(session.user.id, data);
  return NextResponse.json({ success: true }, { status: 201 });
});

export const DELETE = handleErrors(async () => {
  const { session, error } = await requireAuth();
  if (error) { return error; }

  await useCases.history.clear(session.user.id);
  return NextResponse.json({ success: true });
});
