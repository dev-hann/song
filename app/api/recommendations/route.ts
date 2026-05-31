import { NextResponse } from 'next/server';
import { requireAuth, handleErrors } from '@/server/lib/route-helpers';
import { useCases } from '@/server/application/wiring';

export const GET = handleErrors(async () => {
  const { session, error } = await requireAuth();
  if (error) { return error; }

  const recommendations = await useCases.recommendations.getPersonalized(session.user.id);
  return NextResponse.json(recommendations);
});
