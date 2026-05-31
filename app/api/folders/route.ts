import { NextResponse } from 'next/server';
import { requireAuth, validateBody, handleErrors } from '@/server/lib/route-helpers';
import { useCases } from '@/server/application/wiring';
import { CreateFolderSchema } from '@/server/application/schemas/request';

export const GET = handleErrors(async () => {
  const { session, error } = await requireAuth();
  if (error) { return error; }

  const folders = await useCases.folders.getAll(session.user.id);
  return NextResponse.json(folders);
});

export const POST = handleErrors(async (request: Request) => {
  const { session, error } = await requireAuth();
  if (error) { return error; }

  const { data, error: bodyError } = validateBody(CreateFolderSchema, await request.json());
  if (bodyError) { return bodyError; }

  const folder = await useCases.folders.create(session.user.id, data.name);
  return NextResponse.json(folder, { status: 201 });
});
