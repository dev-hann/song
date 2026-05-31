import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth, validateBody, handleErrors } from '@/server/lib/route-helpers';
import { getAllLikes, addLike } from '@/server/models/like';

const AddLikeSchema = z.object({
  videoId: z.string().min(1).max(20),
  title: z.string().min(1).max(500),
  channel: z.string().max(200).default(''),
  thumbnail: z.string().max(1000).default(''),
  duration: z.number().int().min(0).default(0),
});

export const GET = handleErrors(async () => {
  const { session, error } = await requireAuth();
  if (error) {return error;}

  const likes = await getAllLikes(session.user.id);
  return NextResponse.json(likes);
});

export const POST = handleErrors(async (request: Request) => {
  const { session, error } = await requireAuth();
  if (error) {return error;}

  const { data, error: bodyError } = validateBody(AddLikeSchema, await request.json());
  if (bodyError) {return bodyError;}

  const like = await addLike(session.user.id, data);
  return NextResponse.json(like, { status: 201 });
});
