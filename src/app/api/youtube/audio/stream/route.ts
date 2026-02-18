import { NextRequest, NextResponse } from 'next/server';
import { getInnertube } from '@/lib/youtube';
import { DownloadResponseSchema } from '@/schemas/api';
import type { StreamUrlResponse } from '@/types';

/**
 * GET handler for YouTube audio stream URL API.
 * Fetches the streaming URL for a given video ID.
 *
 * @param request - Next.js request object with id parameter
 * @returns Stream URL or error response
 */
export async function GET(request: NextRequest): Promise<NextResponse<StreamUrlResponse | { error: string }>> {
  const searchParams = request.nextUrl.searchParams;
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json(
      { error: 'Audio ID parameter "id" is required' },
      { status: 400 },
    );
  }

  try {
    const innertube = await getInnertube();
    const streamingData = await innertube.getStreamingData(id);

    if (!streamingData || !streamingData.url) {
      return NextResponse.json(
        { error: 'No streaming data available' },
        { status: 404 },
      );
    }

    const url = streamingData.url;

    const validatedResponse = DownloadResponseSchema.parse({ url });

    return NextResponse.json(validatedResponse);
  } catch (error) {
    console.error('Audio stream error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch stream URL';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 },
    );
  }
}
