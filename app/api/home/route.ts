import { NextResponse } from 'next/server';
import { requireAuth, handleErrors } from '@/server/lib/route-helpers';
import { useCases } from '@/server/application/wiring';

export const GET = handleErrors(async () => {
  const { session, error } = await requireAuth();
  if (error) { return error; }

  const data = await useCases.home.get(session.user.id);
  return NextResponse.json(data);
});
