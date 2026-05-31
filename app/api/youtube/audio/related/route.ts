import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getRelatedVideos } from '@/server/services/recommendations';
import { RelatedVideosResponseSchema } from '@/server/models/related';

const VideoIdSchema = z.object({
  id: z.string().min(1, 'Video ID is required').max(20),
});

export async function GET(request: Request) {
  const sp = new URL(request.url).searchParams;
  const paramsResult = VideoIdSchema.safeParse({ id: sp.get('id') });

  if (!paramsResult.success) {
    return NextResponse.json(
      { error: paramsResult.error.issues[0].message },
      { status: 400 },
    );
  }

  const { id } = paramsResult.data;

  try {
    const related = await getRelatedVideos(id);
    const validated = RelatedVideosResponseSchema.parse(related);
    return NextResponse.json(validated);
  } catch (error) {
    console.error('[Related] Error:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to get related videos';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
