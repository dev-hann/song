import { NextResponse } from 'next/server';
import { requireAuth, handleErrors } from '@/server/lib/route-helpers';
import { useCases } from '@/server/application/wiring';

export const GET = handleErrors(async () => {
  const { error } = await requireAuth();
  if (error) { return error; }

  const genres = await useCases.onboarding.getGenres();
  return NextResponse.json({ genres });
});
