import { NextResponse } from 'next/server';
import { handleErrors, validateParams } from '@/server/lib/route-helpers';
import { useCases } from '@/server/application/wiring';
import { PathShareIdSchema } from '@/server/application/schemas/request';

export const GET = handleErrors(async (
  _request: Request,
  { params }: { params: Promise<{ shareId: string }> },
) => {
  const { shareId } = await params;
  const { data, error: paramError } = validateParams(PathShareIdSchema, { shareId });
  if (paramError) { return paramError; }

  const playlist = await useCases.playlists.getShared(data.shareId);
  if (!playlist) {
    return NextResponse.json({ error: 'Playlist not found' }, { status: 404 });
  }

  return NextResponse.json({
    id: playlist.id,
    name: playlist.name,
    description: playlist.description,
    coverImage: playlist.coverImage,
    trackCount: playlist.trackCount,
    tracks: playlist.tracks,
    createdAt: playlist.createdAt,
  });
});
