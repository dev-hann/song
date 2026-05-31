import { NextResponse } from 'next/server';
import { requireAuth, validateBody, validateParams, handleErrors } from '@/server/lib/route-helpers';
import { useCases } from '@/server/application/wiring';
import { PathIdSchema, AddTrackSchema } from '@/server/application/schemas/request';

export const POST = handleErrors(async (
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) => {
  const { session, error } = await requireAuth();
  if (error) { return error; }

  const { id } = await params;
  const { data: pathData, error: paramError } = validateParams(PathIdSchema, { id });
  if (paramError) { return paramError; }

  const { data, error: bodyError } = validateBody(AddTrackSchema, await request.json());
  if (bodyError) { return bodyError; }

  const track = await useCases.playlists.addTrack(session.user.id, pathData.id, data);
  if (!track) {
    return NextResponse.json({ error: 'Track already in playlist or playlist not found' }, { status: 409 });
  }
  return NextResponse.json(track, { status: 201 });
});

export const DELETE = handleErrors(async (
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) => {
  const { session, error } = await requireAuth();
  if (error) { return error; }

  const { id } = await params;
  const { data: pathData, error: paramError } = validateParams(PathIdSchema, { id });
  if (paramError) { return paramError; }

  const videoId = new URL(request.url).searchParams.get('videoId');

  if (!videoId) {
    return NextResponse.json({ error: 'videoId is required' }, { status: 400 });
  }

  const removed = await useCases.playlists.removeTrack(session.user.id, pathData.id, videoId);
  if (!removed) {
    return NextResponse.json({ error: 'Track not found in playlist' }, { status: 404 });
  }
  return NextResponse.json({ success: true });
});
