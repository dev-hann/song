import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth, validateBody, handleErrors } from '@/server/lib/route-helpers';
import {
  getAllPlaylists,
  getOrCreateLikedPlaylist,
  createPlaylist,
} from '@/server/models/playlist';

const CreatePlaylistSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(1000).default(''),
});

export const GET = handleErrors(async () => {
  const { session, error } = await requireAuth();
  if (error) {return error;}

  const playlists = await getAllPlaylists(session.user.id);
  const likedPlaylist = await getOrCreateLikedPlaylist(session.user.id);
  const allPlaylists = [likedPlaylist, ...playlists.filter(p => p.id !== likedPlaylist.id)];
  return NextResponse.json(allPlaylists);
});

export const POST = handleErrors(async (request: Request) => {
  const { session, error } = await requireAuth();
  if (error) {return error;}

  const { data, error: bodyError } = validateBody(CreatePlaylistSchema, await request.json());
  if (bodyError) {return bodyError;}

  const playlist = await createPlaylist(session.user.id, data.name, data.description);
  return NextResponse.json(playlist, { status: 201 });
});
