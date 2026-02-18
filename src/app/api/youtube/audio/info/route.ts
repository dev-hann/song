import { NextRequest, NextResponse } from 'next/server';
import { getInnertube, clearInnertubeCache } from '@/lib/youtube';
import { fromBasicInfo } from '@/models/audio';
import { AudioInfoResponseSchema } from '@/schemas/api';
import type { ExtendedAudio } from '@/types';

/**
 * GET handler for YouTube audio info API.
 * Fetches basic information for a given video ID.
 *
 * @param request - Next.js request object with id parameter
 * @returns Extended audio info or error response
 */
export async function GET(request: NextRequest): Promise<NextResponse<ExtendedAudio | { error: string }>> {
  const searchParams = request.nextUrl.searchParams;
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json(
      { error: 'Audio ID parameter "id" is required' },
      { status: 400 },
    );
  }

  try {
    let innertube = await getInnertube();
    let info;
    
    // Retry with fresh instance if first attempt fails
    try {
      info = await innertube.getInfo(id);
    } catch (error) {
      // Clear cache and retry once
      clearInnertubeCache();
      innertube = await getInnertube();
      info = await innertube.getInfo(id);
    }

    const audioInfo = fromBasicInfo(info);
    const validatedResponse = AudioInfoResponseSchema.parse(audioInfo);

    return NextResponse.json(validatedResponse);
  } catch (error) {
    console.error('Audio info error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to get audio info';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 },
    );
  }
}
