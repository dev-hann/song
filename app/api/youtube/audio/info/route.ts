import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getInnertube } from '@/server/services/youtube';
import { fromBasicInfo } from '@/server/models/audio';
import { AudioInfoResponseSchema } from '@/server/schemas/api';

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
    const innertube = await getInnertube();
    const info = await innertube.getBasicInfo(id);
    const audioInfo = fromBasicInfo(info);
    const validatedResponse = AudioInfoResponseSchema.parse(audioInfo);
    return NextResponse.json(validatedResponse);
  } catch (error) {
    console.error('[Audio Info] Error:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to get audio info';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
