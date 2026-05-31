import { NextResponse } from 'next/server';
import { requireAuth, handleErrors } from '@/server/lib/route-helpers';
import { getFollowedChannels } from '@/server/models/channel';

export const GET = handleErrors(async () => {
  const { session, error } = await requireAuth();
  if (error) {return error;}

  const channels = await getFollowedChannels(session.user.id);
  return NextResponse.json(channels);
});
