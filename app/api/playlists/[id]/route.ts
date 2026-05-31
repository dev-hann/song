import { NextResponse } from 'next/server';
import { requireAuth, validateBody, validateParams, handleErrors } from '@/server/lib/route-helpers';
import { useCases } from '@/server/application/wiring';
import { PathIdSchema, UpdatePlaylistSchema } from '@/server/application/schemas/request';

export const GET = handleErrors(async (
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) => {
  const { session, error } = await requireAuth();
  if (error) { return error; }

  const { id } = await params;
  const { data: pathData, error: paramError } = validateParams(PathIdSchema, { id });
  if (paramError) { return paramError; }

  const playlist = await useCases.playlists.getById(session.user.id, pathData.id);
  if (!playlist) {
    return NextResponse.json({ error: 'Playlist not found' }, { status: 404 });
  }

  if (playlist.isSystem) {
    const likedIds = await useCases.likes.getAll(session.user.id);
    return NextResponse.json({ ...playlist, trackCount: likedIds.length });
  }

  return NextResponse.json(playlist);
});

export const PATCH = handleErrors(async (
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) => {
  const { session, error } = await requireAuth();
  if (error) { return error; }

  const { id } = await params;
  const { data: pathData, error: paramError } = validateParams(PathIdSchema, { id });
  if (paramError) { return paramError; }

  const { data, error: bodyError } = validateBody(UpdatePlaylistSchema, await request.json());
  if (bodyError) { return bodyError; }

  const playlist = await useCases.playlists.update(session.user.id, pathData.id, data);
  if (!playlist) {
    return NextResponse.json({ error: 'Playlist not found' }, { status: 404 });
  }
  return NextResponse.json(playlist);
});

export const DELETE = handleErrors(async (
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) => {
  const { session, error } = await requireAuth();
  if (error) { return error; }

  const { id } = await params;
  const { data: pathData, error: paramError } = validateParams(PathIdSchema, { id });
  if (paramError) { return paramError; }

  const deleted = await useCases.playlists.delete(session.user.id, pathData.id);
  if (!deleted) {
    return NextResponse.json({ error: 'Playlist not found or is system playlist' }, { status: 404 });
  }
  return NextResponse.json({ success: true });
});
