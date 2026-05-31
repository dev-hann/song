import { NextResponse } from 'next/server';
import { requireAuth, validateBody, validateParams, handleErrors } from '@/server/lib/route-helpers';
import { useCases } from '@/server/application/wiring';
import { PathIdSchema, FollowChannelSchema } from '@/server/application/schemas/request';

export const POST = handleErrors(async (
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) => {
  const { session, error } = await requireAuth();
  if (error) { return error; }

  const { id } = await params;
  const { data: pathData, error: paramError } = validateParams(PathIdSchema, { id });
  if (paramError) { return paramError; }

  const { data, error: bodyError } = validateBody(FollowChannelSchema, await request.json());
  if (bodyError) { return bodyError; }

  const channel = await useCases.channels.follow(session.user.id, {
    channelId: pathData.id,
    channelName: data.channelName,
    channelThumbnail: data.channelThumbnail,
    subscriberCount: data.subscriberCount,
  });
  return NextResponse.json(channel, { status: 201 });
});

export const DELETE = handleErrors(async (
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) => {
  const { session, error } = await requireAuth();
  if (error) { return error; }

  const { id } = await params;
  const { data, error: paramError } = validateParams(PathIdSchema, { id });
  if (paramError) { return paramError; }

  const removed = await useCases.channels.unfollow(session.user.id, data.id);
  if (!removed) {
    return NextResponse.json({ error: 'Not following this channel' }, { status: 404 });
  }
  return NextResponse.json({ success: true });
});
