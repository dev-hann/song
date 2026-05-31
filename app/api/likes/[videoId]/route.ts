import { NextResponse } from 'next/server';
import { requireAuth, handleErrors } from '@/server/lib/route-helpers';
import { removeLike } from '@/server/models/like';

export const DELETE = handleErrors(async (
  _request: Request,
  { params }: { params: Promise<{ videoId: string }> },
) => {
  const { session, error } = await requireAuth();
  if (error) {return error;}

  const { videoId } = await params;
  const removed = await removeLike(session.user.id, videoId);
  if (!removed) {
    return NextResponse.json({ error: 'Like not found' }, { status: 404 });
  }
  return NextResponse.json({ success: true });
});
