import { NextResponse } from 'next/server';
import { requireAuth, validateBody, handleErrors } from '@/server/lib/route-helpers';
import { useCases } from '@/server/application/wiring';
import { CreatePlaylistSchema } from '@/server/application/schemas/request';

export const GET = handleErrors(async () => {
  const { session, error } = await requireAuth();
  if (error) { return error; }

  const playlists = await useCases.playlists.getAll(session.user.id);
  const likedPlaylist = await useCases.playlists.getOrCreateLiked(session.user.id);
  const allPlaylists = [likedPlaylist, ...playlists.filter(p => p.id !== likedPlaylist.id)];
  return NextResponse.json(allPlaylists);
});

export const POST = handleErrors(async (request: Request) => {
  const { session, error } = await requireAuth();
  if (error) { return error; }

  const { data, error: bodyError } = validateBody(CreatePlaylistSchema, await request.json());
  if (bodyError) { return bodyError; }

  const playlist = await useCases.playlists.create(session.user.id, data.name, data.description);
  return NextResponse.json(playlist, { status: 201 });
});
