import { NextResponse } from 'next/server';
import { handleErrors, requireAuth } from '@/server/lib/route-helpers';
import { getInnertube } from '@/server/services/youtube';
import { isFollowing } from '@/server/models/channel';

export const GET = handleErrors(async (
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) => {
  const { id } = await params;
  const { session } = await requireAuth();

  const innertube = await getInnertube();
  const channel = await innertube.getChannel(id);

  const videos: Array<{
    id: string;
    title: string;
    thumbnail: string;
    duration: number;
    channel: { name: string; thumbnail?: string };
  }> = [];

  const channelVideos = (channel as unknown as Record<string, unknown>).videos as Array<Record<string, unknown>> | undefined;
  if (channelVideos) {
    for (const video of channelVideos) {
      const v = video;
      const rawId = v.id as string | { videoId: string } | undefined;
      const videoId = (typeof rawId === 'string' ? rawId : rawId?.videoId) ?? '';
      const rawTitle = v.title as string | { text: string } | undefined;
      const title =
        typeof rawTitle === 'string' ? rawTitle : rawTitle?.text ?? '';
      const rawThumbs = v.thumbnails as Array<{ url: string }> | undefined;
      const thumbnail = rawThumbs?.[0]?.url ?? '';
      const rawDuration = v.duration as { seconds: number } | undefined;
      const duration = rawDuration?.seconds ?? 0;

      if (videoId) {
        videos.push({
          id: videoId,
          title,
          thumbnail,
          duration,
          channel: {
            name: (v.author as { name: string } | undefined)?.name ?? '',
            thumbnail: (v.author as { thumbnails: Array<{ url: string }> } | undefined)?.thumbnails[0]?.url,
          },
        });
      }
    }
  }

  const meta = ((channel as unknown as Record<string, unknown>).metadata ?? {}) as Record<string, unknown>;
  const following = session?.user.id
    ? await isFollowing(session.user.id, id)
    : false;

  return NextResponse.json({
    id,
    name: meta.title as string,
    thumbnail: (meta.avatar as Array<{ url: string }> | undefined)?.[0]?.url ?? '',
    subscriberCount: (meta.subscriberCount as string | undefined) ?? '',
    following,
    videos,
  });
});
