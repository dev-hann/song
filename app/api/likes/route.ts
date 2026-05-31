import { NextResponse } from 'next/server';
import { requireAuth, validateBody, handleErrors } from '@/server/lib/route-helpers';
import { useCases } from '@/server/application/wiring';
import { AddLikeSchema } from '@/server/application/schemas/request';
import { LikesResponseSchema } from '@/server/application/schemas/response';

export const GET = handleErrors(async () => {
  const { session, error } = await requireAuth();
  if (error) { return error; }

  const likes = await useCases.likes.getAll(session.user.id);
  return NextResponse.json(LikesResponseSchema.parse(likes));
});

export const POST = handleErrors(async (request: Request) => {
  const { session, error } = await requireAuth();
  if (error) { return error; }

  const { data, error: bodyError } = validateBody(AddLikeSchema, await request.json());
  if (bodyError) { return bodyError; }

  const like = await useCases.likes.add(session.user.id, data);
  return NextResponse.json(like, { status: 201 });
});
