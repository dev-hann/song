import { NextResponse } from 'next/server';
import { useCases } from '@/server/application/wiring';

import { VideoIdSchema } from '@/server/application/schemas/request';
import { RelatedVideosResponseValidationSchema } from '@/server/application/schemas/response';

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
    const related = await useCases.recommendations.getRelated(id);
    const validated = RelatedVideosResponseValidationSchema.parse(related);
    return NextResponse.json(validated);
  } catch (error) {
    console.error('[Related] Error:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to get related videos';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
