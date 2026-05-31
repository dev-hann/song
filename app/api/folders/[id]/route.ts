import { NextResponse } from 'next/server';
import { requireAuth, validateBody, validateParams, handleErrors } from '@/server/lib/route-helpers';
import { useCases } from '@/server/application/wiring';
import { PathIdSchema, UpdateFolderSchema } from '@/server/application/schemas/request';

export const PATCH = handleErrors(async (
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) => {
  const { session, error } = await requireAuth();
  if (error) { return error; }

  const { id } = await params;
  const { data: pathData, error: paramError } = validateParams(PathIdSchema, { id });
  if (paramError) { return paramError; }

  const { data, error: bodyError } = validateBody(UpdateFolderSchema, await request.json());
  if (bodyError) { return bodyError; }

  const folder = await useCases.folders.update(session.user.id, pathData.id, data);
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
  if (error) { return error; }

  const { id } = await params;
  const { data: pathData, error: paramError } = validateParams(PathIdSchema, { id });
  if (paramError) { return paramError; }

  const deleted = await useCases.folders.delete(session.user.id, pathData.id);
  if (!deleted) {
    return NextResponse.json({ error: 'Folder not found' }, { status: 404 });
  }
  return NextResponse.json({ success: true });
});
