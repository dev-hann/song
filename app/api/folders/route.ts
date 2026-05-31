import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth, validateBody, handleErrors } from '@/server/lib/route-helpers';
import { getAllFolders, createFolder } from '@/server/models/playlist';

const CreateFolderSchema = z.object({
  name: z.string().min(1).max(200),
});

export const GET = handleErrors(async () => {
  const { session, error } = await requireAuth();
  if (error) {return error;}

  const folders = await getAllFolders(session.user.id);
  return NextResponse.json(folders);
});

export const POST = handleErrors(async (request: Request) => {
  const { session, error } = await requireAuth();
  if (error) {return error;}

  const { data, error: bodyError } = validateBody(CreateFolderSchema, await request.json());
  if (bodyError) {return bodyError;}

  const folder = await createFolder(session.user.id, data.name);
  return NextResponse.json(folder, { status: 201 });
});
