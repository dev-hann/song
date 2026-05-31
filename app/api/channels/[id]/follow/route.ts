import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth, validateBody, handleErrors } from '@/server/lib/route-helpers';
import { followChannel, unfollowChannel } from '@/server/models/channel';

const FollowChannelSchema = z.object({
  channelName: z.string().min(1).max(200),
  channelThumbnail: z.string().url().max(1000).optional(),
  subscriberCount: z.string().max(50).optional(),
});

export const POST = handleErrors(async (
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) => {
  const { session, error } = await requireAuth();
  if (error) {return error;}

  const { id } = await params;
  const { data, error: bodyError } = validateBody(FollowChannelSchema, await request.json());
  if (bodyError) {return bodyError;}

  const channel = await followChannel(session.user.id, {
    channelId: id,
    channelName: data.channelName,
    channelThumbnail: data.channelThumbnail ?? '',
    subscriberCount: data.subscriberCount,
  });
  return NextResponse.json(channel, { status: 201 });
});

export const DELETE = handleErrors(async (
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) => {
  const { session, error } = await requireAuth();
  if (error) {return error;}

  const { id } = await params;
  const removed = await unfollowChannel(session.user.id, id);
  if (!removed) {
    return NextResponse.json({ error: 'Not following this channel' }, { status: 404 });
  }
  return NextResponse.json({ success: true });
});
