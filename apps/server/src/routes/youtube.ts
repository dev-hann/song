import { Router } from 'express';
import { getInnertube } from '../services/youtube.js';
import { SearchParamsSchema } from '../schemas/api.js';
import { SearchResponseSchema, toSearchResponse } from '../models/search.js';
import { fromBasicInfo } from '../models/audio.js';
import {
  AudioInfoResponseSchema,
  DownloadResponseSchema,
} from '../schemas/api.js';

const router = Router();

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
