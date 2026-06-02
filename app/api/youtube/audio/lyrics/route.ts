import { NextResponse } from 'next/server';
import { useCases } from '@/server/application/wiring';
import { VideoIdSchema } from '@/server/application/schemas/request';

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
    const lyrics = await useCases.lyrics.get(id);
    return NextResponse.json(lyrics ?? { lyrics: null });
  } catch (error) {
    console.error('[Lyrics] Error:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to get lyrics';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
