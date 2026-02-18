import { NextRequest, NextResponse } from 'next/server';
import { getInnertube } from '@/lib/youtube';
import { SearchParamsSchema } from '@/schemas/api';
import { SearchResponseSchema, toSearchResponse } from '@/models/search';

/**
 * GET handler for YouTube music search API.
 * Searches for videos matching the query parameter.
 *
 * @param request - Next.js request object with query parameters
 * @returns Search response with results or error
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const searchParams = request.nextUrl.searchParams;
  const queryParams = Object.fromEntries(searchParams);

  const paramsResult = SearchParamsSchema.safeParse(queryParams);

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
    console.error('[Music Search] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to search';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 },
    );
  }
}
