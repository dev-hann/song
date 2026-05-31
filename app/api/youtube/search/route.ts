import { NextResponse } from 'next/server';
import { getInnertube } from '@/server/services/youtube';
import { SearchParamsSchema } from '@/server/schemas/api';
import { SearchResponseSchema, toSearchResponse } from '@/server/models/search';

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
    const innertube = await getInnertube();
    const search = await innertube.search(q);
    const searchResponse = toSearchResponse(search, q);
    const validatedResponse = SearchResponseSchema.parse(searchResponse);
    return NextResponse.json(validatedResponse);
  } catch (error) {
    console.error('[Search] Error:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to search';
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
