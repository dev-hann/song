import { NextResponse } from 'next/server';
import { requireAuth, validateBody, handleErrors } from '@/server/lib/route-helpers';
import { useCases } from '@/server/application/wiring';
import { OnboardingSchema } from '@/server/application/schemas/request';

export const POST = handleErrors(async (request: Request) => {
  const { session, error } = await requireAuth();
  if (error) { return error; }

  const { data, error: bodyError } = validateBody(OnboardingSchema, await request.json());
  if (bodyError) { return bodyError; }

  await useCases.onboarding.complete(session.user.id, data.artistNames);

  return NextResponse.json({ success: true });
});
