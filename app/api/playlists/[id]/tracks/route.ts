import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth, validateBody, handleErrors } from '@/server/lib/route-helpers';
import { addTrackToPlaylist, removeTrackFromPlaylist } from '@/server/models/playlist';

const AddTrackSchema = z.object({
  videoId: z.string().min(1).max(20),
  title: z.string().min(1).max(500),
  channel: z.string().max(200).default(''),
  thumbnail: z.string().max(1000).default(''),
  duration: z.number().int().min(0).default(0),
});

export const POST = handleErrors(async (
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) => {
  const { session, error } = await requireAuth();
  if (error) {return error;}

  const { id } = await params;
  const { data, error: bodyError } = validateBody(AddTrackSchema, await request.json());
  if (bodyError) {return bodyError;}

  const track = await addTrackToPlaylist(session.user.id, id, data);
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
  if (error) {return error;}

  const { id } = await params;
  const videoId = new URL(request.url).searchParams.get('videoId');

  if (!videoId) {
    return NextResponse.json({ error: 'videoId is required' }, { status: 400 });
  }

  const removed = await removeTrackFromPlaylist(session.user.id, id, videoId);
  if (!removed) {
    return NextResponse.json({ error: 'Track not found in playlist' }, { status: 404 });
  }
  return NextResponse.json({ success: true });
});
