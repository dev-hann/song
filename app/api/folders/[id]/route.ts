import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth, validateBody, handleErrors } from '@/server/lib/route-helpers';
import { updateFolder, deleteFolder } from '@/server/models/playlist';

const UpdateFolderSchema = z.object({
  name: z.string().min(1).max(200).optional(),
  sortOrder: z.number().int().min(0).optional(),
});

export const PATCH = handleErrors(async (
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) => {
  const { session, error } = await requireAuth();
  if (error) {return error;}

  const { id } = await params;
  const { data, error: bodyError } = validateBody(UpdateFolderSchema, await request.json());
  if (bodyError) {return bodyError;}

  const folder = await updateFolder(session.user.id, id, data);
  if (!folder) {
    return NextResponse.json({ error: 'Folder not found' }, { status: 404 });
  }
  return NextResponse.json(folder);
});

export const DELETE = handleErrors(async (
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) => {
  const { session, error } = await requireAuth();
  if (error) {return error;}

  const { id } = await params;
  const deleted = await deleteFolder(session.user.id, id);
  if (!deleted) {
    return NextResponse.json({ error: 'Folder not found' }, { status: 404 });
  }
  return NextResponse.json({ success: true });
});
