import { NextResponse } from 'next/server';
import { getAudioStreamUrl, markMwebFailed } from '@/server/infrastructure/external/youtube/client';
import type { AudioStreamResult } from '@/server/domain/ports/providers';

const streamCache = new Map<string, { result: AudioStreamResult; expires: number }>();

const UPSTREAM_TIMEOUT = 30_000;
const MAX_RETRIES = 2;

async function resolveStreamUrl(id: string): Promise<AudioStreamResult> {
  const cached = streamCache.get(id);
  if (cached && cached.expires > Date.now()) {
    return cached.result;
  }

  const result = await getAudioStreamUrl(id);

  streamCache.set(id, {
    result,
    expires: Date.now() + 3 * 60 * 60 * 1000,
  });

  if (streamCache.size > 50) {
    const now = Date.now();
    for (const [key, val] of streamCache) {
      if (val.expires <= now) { streamCache.delete(key); }
    }
  }

  return result;
}

async function fetchWithRetry(
  id: string,
  rangeHeader?: string,
  attempt = 0,
): Promise<Response> {
  const { url } = await resolveStreamUrl(id);

  const headers: Record<string, string> = {};
  if (rangeHeader) {
    headers.range = rangeHeader;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => { controller.abort(); }, UPSTREAM_TIMEOUT);

  try {
    const response = await fetch(url, {
      headers,
      signal: controller.signal,
    });

    if ((response.status === 403 || response.status === 410) && attempt < MAX_RETRIES) {
      streamCache.delete(id);
      markMwebFailed(id);
      console.warn(`[Audio Stream] Got ${response.status}, retry ${attempt + 1}/${MAX_RETRIES} for ${id}`);
      return fetchWithRetry(id, rangeHeader, attempt + 1);
    }

    return response;
  } catch (error) {
    if (attempt < MAX_RETRIES) {
      streamCache.delete(id);
      console.warn(`[Audio Stream] Retry ${attempt + 1}/${MAX_RETRIES} for ${id}`);
      return fetchWithRetry(id, rangeHeader, attempt + 1);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

function createStreamingResponse(upstream: Response): Response {
  const responseHeaders = new Headers();

  for (const header of ['content-type', 'content-length', 'content-range']) {
    const value = upstream.headers.get(header);
    if (value) { responseHeaders.set(header, value); }
  }
  responseHeaders.set('Accept-Ranges', 'bytes');

  if (!upstream.body) {
    return new Response(null, { status: upstream.status, headers: responseHeaders });
  }

  return new Response(upstream.body, {
    status: upstream.status,
    headers: responseHeaders,
  });
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  if (!id) {
    return NextResponse.json({ error: 'Audio ID is required' }, { status: 400 });
  }

  try {
    const rangeHeader = request.headers.get('range') ?? undefined;
    const response = await fetchWithRetry(id, rangeHeader);

    if (!response.ok && response.status !== 206) {
      return NextResponse.json({ error: 'Failed to fetch audio' }, { status: response.status });
    }

    return createStreamingResponse(response);
  } catch (error) {
    console.error('[Audio Stream] Error:', error);
    return NextResponse.json({ error: 'Failed to stream audio' }, { status: 500 });
  }
}
