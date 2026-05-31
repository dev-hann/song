import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth, validateBody, handleErrors } from '@/server/lib/route-helpers';
import { getRecentHistory, addToHistory, clearHistory } from '@/server/models/history';

const HistoryQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(500).default(100),
});

const AddHistorySchema = z.object({
  videoId: z.string().min(1).max(20),
  title: z.string().min(1).max(500),
  channel: z.string().max(200).default(''),
  thumbnail: z.string().max(1000).default(''),
  duration: z.number().int().min(0).default(0),
});

export const GET = handleErrors(async (request: Request) => {
  const { session, error } = await requireAuth();
  if (error) {return error;}

  const sp = new URL(request.url).searchParams;
  const { data, error: paramError } = validateBody(HistoryQuerySchema, { limit: sp.get('limit') ?? undefined });
  if (paramError) {return paramError;}

  const history = await getRecentHistory(session.user.id, data.limit);
  return NextResponse.json(history);
});

export const POST = handleErrors(async (request: Request) => {
  const { session, error } = await requireAuth();
  if (error) {return error;}

  const { data, error: bodyError } = validateBody(AddHistorySchema, await request.json());
  if (bodyError) {return bodyError;}

  await addToHistory(session.user.id, data);
  return NextResponse.json({ success: true }, { status: 201 });
});

export const DELETE = handleErrors(async () => {
  const { session, error } = await requireAuth();
  if (error) {return error;}

  await clearHistory(session.user.id);
  return NextResponse.json({ success: true });
});
