import { NextResponse } from 'next/server';
import { requireAuth, handleErrors } from '@/server/lib/route-helpers';
import { isLiked } from '@/server/models/like';

export const GET = handleErrors(async (
  _request: Request,
  { params }: { params: Promise<{ videoId: string }> },
) => {
  const { session, error } = await requireAuth();
  if (error) {return error;}

  const { videoId } = await params;
  const liked = await isLiked(session.user.id, videoId);
  return NextResponse.json({ videoId, liked });
});
