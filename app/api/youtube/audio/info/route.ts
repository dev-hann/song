import { NextResponse } from 'next/server';
import { useCases } from '@/server/application/wiring';
import { VideoIdSchema } from '@/server/application/schemas/request';
import { AudioInfoResponseSchema } from '@/server/application/schemas/response';

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
    const audioInfo = await useCases.audio.getInfo(id);
    const validatedResponse = AudioInfoResponseSchema.parse(audioInfo);
    return NextResponse.json(validatedResponse);
  } catch (error) {
    console.error('[Audio Info] Error:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to get audio info';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
