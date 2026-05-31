import { NextResponse } from 'next/server';
import { requireAuth, handleErrors } from '@/server/lib/route-helpers';
import { useCases } from '@/server/application/wiring';
import { ChannelsResponseSchema } from '@/server/application/schemas/response';

export const GET = handleErrors(async () => {
  const { session, error } = await requireAuth();
  if (error) { return error; }

  const channels = await useCases.channels.getFollowed(session.user.id);
  return NextResponse.json(ChannelsResponseSchema.parse(channels));
});
