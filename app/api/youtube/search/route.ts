import { NextResponse } from 'next/server';
import { useCases } from '@/server/application/wiring';
import { SearchParamsSchema } from '@/server/application/schemas/request';
import { SearchResponseValidationSchema } from '@/server/application/schemas/response';

export async function GET(request: Request) {
  const sp = new URL(request.url).searchParams;
  const paramsResult = SearchParamsSchema.safeParse({
    q: sp.get('q'),
    filter: sp.get('filter') ?? undefined,
  });

  if (!paramsResult.success) {
    return NextResponse.json(
      { error: paramsResult.error.issues[0].message },
      { status: 400 },
    );
  }

  const { q } = paramsResult.data;

  try {
    const searchResponse = await useCases.audio.search(q);
    const validatedResponse = SearchResponseValidationSchema.parse(searchResponse);
    return NextResponse.json(validatedResponse);
  } catch (error) {
    console.error('[Search] Error:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to search';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
