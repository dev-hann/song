import { Router } from 'express';
import { getInnertube } from '../services/youtube.js';
import { SearchParamsSchema } from '../schemas/api.js';
import { SearchResponseSchema, toSearchResponse } from '../models/search.js';
import { fromBasicInfo } from '../models/audio.js';
import {
  AudioInfoResponseSchema,
  DownloadResponseSchema,
} from '../schemas/api.js';
import { getRelatedVideos } from '../services/recommendations.js';
import { RelatedVideosResponseSchema } from '../models/related.js';

const router = Router();

const streamCache = new Map<string, { url: string; expires: number }>();

router.get('/search', async (req, res) => {
  const paramsResult = SearchParamsSchema.safeParse(req.query);

  if (!paramsResult.success) {
    res.status(400).json({ error: paramsResult.error.issues[0].message });
    return;
  }

  const { q } = paramsResult.data;

  try {
    const innertube = await getInnertube();
    const search = await innertube.search(q);
    const searchResponse = toSearchResponse(search, q);
    const validatedResponse = SearchResponseSchema.parse(searchResponse);

    res.json(validatedResponse);
  } catch (error) {
    console.error('[Search] Error:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to search';
    res.status(500).json({ error: errorMessage });
  }
});

router.get('/audio/info', async (req, res) => {
  const id = req.query.id as string;

  if (!id) {
    res
      .status(400)
      .json({ error: 'Audio ID parameter "id" is required' });
    return;
  }

  try {
    const innertube = await getInnertube();
    const info = await innertube.getBasicInfo(id);
    const audioInfo = fromBasicInfo(info);
    const validatedResponse = AudioInfoResponseSchema.parse(audioInfo);

    res.json(validatedResponse);
  } catch (error) {
    console.error('[Audio Info] Error:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to get audio info';
    res.status(500).json({ error: errorMessage });
  }
});

router.get('/audio/stream', async (req, res) => {
  const id = req.query.id as string;

  if (!id) {
    res
      .status(400)
      .json({ error: 'Audio ID parameter "id" is required' });
    return;
  }

  try {
    const innertube = await getInnertube();
    const streamingData = await innertube.getStreamingData(id);

    if (!streamingData?.url) {
      res.status(404).json({ error: 'No streaming data available' });
      return;
    }

    const validatedResponse = DownloadResponseSchema.parse({
      url: streamingData.url,
    });

    res.json(validatedResponse);
  } catch (error) {
    console.error('[Audio Stream] Error:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to fetch stream URL';
    res.status(500).json({ error: errorMessage });
  }
});

export default router;

router.get('/audio/related', async (req, res) => {
  const id = req.query.id as string;

  if (!id) {
    res.status(400).json({ error: 'Video ID parameter "id" is required' });
    return;
  }

  try {
    const related = await getRelatedVideos(id);
    const validated = RelatedVideosResponseSchema.parse(related);
    res.json(validated);
  } catch (error) {
    console.error('[Related] Error:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to get related videos';
    res.status(500).json({ error: errorMessage });
  }
});

async function resolveStreamUrl(id: string): Promise<string> {
  const cached = streamCache.get(id);
  if (cached && cached.expires > Date.now()) {
    return cached.url;
  }

  const innertube = await getInnertube();
  const streamingData = await innertube.getStreamingData(id);

  if (!streamingData?.url) {
    throw new Error('No streaming data available');
  }

  const url = streamingData.url;
  streamCache.set(id, {
    url,
    expires: Date.now() + 3 * 60 * 60 * 1000,
  });

  if (streamCache.size > 50) {
    const now = Date.now();
    for (const [key, val] of streamCache) {
      if (val.expires <= now) streamCache.delete(key);
    }
  }

  return url;
}

const UPSTREAM_TIMEOUT = 30_000;
const MAX_RETRIES = 2;

router.get('/audio/play/:id', async (req, res) => {
  const { id } = req.params;

  if (!id) {
    res.status(400).json({ error: 'Audio ID is required' });
    return;
  }

  req.setTimeout(0);

  try {
    const rangeHeader = req.headers.range || undefined;

    const response = await fetchWithRetry(id, rangeHeader);

    if (!response.ok && response.status !== 206) {
      res.status(response.status).json({ error: 'Failed to fetch audio' });
      return;
    }

    for (const header of ['content-type', 'content-length', 'content-range']) {
      const value = response.headers.get(header);
      if (value) res.setHeader(header, value);
    }
    res.setHeader('Accept-Ranges', 'bytes');
    res.status(response.status);

    if (response.body) {
      streamWithRetry(id, response, req, res);
    } else {
      res.end();
    }
  } catch (error) {
    console.error('[Audio Play] Error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Failed to stream audio' });
    } else if (!res.writableEnded) {
      res.end();
    }
  }
});

async function fetchWithRetry(
  id: string,
  rangeHeader?: string,
  attempt = 0,
): Promise<Response> {
  const url = await resolveStreamUrl(id);

  const headers: Record<string, string> = {};
  if (rangeHeader) {
    headers.range = rangeHeader;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT);

  try {
    const response = await fetch(url, {
      headers,
      signal: controller.signal,
    });
    return response;
  } catch (error) {
    if (attempt < MAX_RETRIES) {
      streamCache.delete(id);
      console.warn(`[Audio Play] Retry ${attempt + 1}/${MAX_RETRIES} for ${id}`);
      return fetchWithRetry(id, rangeHeader, attempt + 1);
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

function streamWithRetry(
  id: string,
  initialResponse: Response,
  req: any,
  res: any,
) {
  let currentReader = initialResponse.body!.getReader();
  let closed = false;
  let retryCount = 0;

  const cleanup = () => {
    if (!closed) {
      closed = true;
      currentReader.cancel().catch(() => {});
    }
  };

  req.on('close', cleanup);
  res.on('close', cleanup);

  const pump = async () => {
    try {
      while (true) {
        const { done, value } = await currentReader.read();
        if (done) break;

        if (!res.write(value)) {
          await new Promise<void>((resolve) =>
            res.once('drain', resolve),
          );
        }
      }
    } catch (error) {
      if (closed) return;

      if (retryCount < MAX_RETRIES && !res.writableEnded) {
        retryCount++;
        console.warn(`[Audio Play] Stream retry ${retryCount}/${MAX_RETRIES} for ${id}`);

        try {
          const bytesWritten = parseInt(res.getHeader('content-length') as string || '0', 10);
          const initialRange = req.headers.range as string | undefined;
          let retryRange = initialRange;

          if (initialRange) {
            const match = initialRange.match(/bytes=(\d+)-/);
            if (match) {
              const startOffset = parseInt(match[1], 10) + bytesWritten;
              const endMatch = initialRange.match(/-(\d+)/);
              retryRange = endMatch
                ? `bytes=${startOffset}-${endMatch[1]}`
                : `bytes=${startOffset}-`;
            }
          } else if (bytesWritten > 0) {
            retryRange = `bytes=${bytesWritten}-`;
          }

          streamCache.delete(id);
          const newResponse = await fetchWithRetry(id, retryRange);

          if (!newResponse.ok && newResponse.status !== 206) {
            cleanup();
            if (!res.writableEnded) res.end();
            return;
          }

          currentReader = newResponse.body!.getReader();
          pump();
          return;
        } catch {
          cleanup();
          if (!res.writableEnded) res.end();
          return;
        }
      }

      cleanup();
      if (!res.writableEnded) res.end();
    } finally {
      if (!closed && retryCount >= MAX_RETRIES) {
        cleanup();
        if (!res.writableEnded) res.end();
      }
    }
  };

  pump();
}
