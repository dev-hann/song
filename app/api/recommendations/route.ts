import { NextResponse } from 'next/server';
import { requireAuth, handleErrors } from '@/server/lib/route-helpers';
import { getPersonalizedRecommendations } from '@/server/services/recommendations';

export const GET = handleErrors(async () => {
  const { session, error } = await requireAuth();
  if (error) {return error;}

  const recommendations = await getPersonalizedRecommendations(session.user.id);
  return NextResponse.json(recommendations);
});
