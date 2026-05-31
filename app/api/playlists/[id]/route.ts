import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth, validateBody, handleErrors } from '@/server/lib/route-helpers';
import {
  getPlaylistById,
  updatePlaylist,
  deletePlaylist,
} from '@/server/models/playlist';
import { getLikedVideoIds } from '@/server/models/like';

const SmartPlaylistRuleSchema = z.object({
  field: z.enum(['channel', 'title', 'minDuration', 'maxDuration', 'addedAfter', 'addedBefore']),
  operator: z.enum(['contains', 'equals', 'startsWith', 'gt', 'lt', 'gte', 'lte']),
  value: z.union([z.string(), z.number()]),
});

const SmartPlaylistRulesSchema = z.object({
  match: z.enum(['all', 'any']),
  conditions: z.array(SmartPlaylistRuleSchema).min(1),
});

const UpdatePlaylistSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  description: z.string().max(1000).optional(),
  coverImage: z.string().max(2000).optional(),
  rules: SmartPlaylistRulesSchema.nullable().optional(),
  folderId: z.string().nullable().optional(),
  isPublic: z.boolean().optional(),
});

export const GET = handleErrors(async (
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) => {
  const { session, error } = await requireAuth();
  if (error) {return error;}

  const { id } = await params;
  const playlist = await getPlaylistById(session.user.id, id);
  if (!playlist) {
    return NextResponse.json({ error: 'Playlist not found' }, { status: 404 });
  }

  if (playlist.isSystem) {
    const likedIds = await getLikedVideoIds(session.user.id);
    return NextResponse.json({ ...playlist, trackCount: likedIds.length });
  }

  return NextResponse.json(playlist);
});

export const PATCH = handleErrors(async (
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) => {
  const { session, error } = await requireAuth();
  if (error) {return error;}

  const { id } = await params;
  const { data, error: bodyError } = validateBody(UpdatePlaylistSchema, await request.json());
  if (bodyError) {return bodyError;}

  const playlist = await updatePlaylist(session.user.id, id, data);
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
  if (error) {return error;}

  const { id } = await params;
  const deleted = await deletePlaylist(session.user.id, id);
  if (!deleted) {
    return NextResponse.json({ error: 'Playlist not found or is system playlist' }, { status: 404 });
  }
  return NextResponse.json({ success: true });
});
