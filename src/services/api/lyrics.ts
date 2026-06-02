import type { Lyrics } from '@/types';
import { apiFetch } from '@/lib/api-client';

interface LyricsNullResponse {
  lyrics: null;
}

export async function fetchLyrics(videoId: string): Promise<Lyrics | null> {
  const response = await apiFetch<LyricsNullResponse | Lyrics>(
    `/api/youtube/audio/lyrics?id=${encodeURIComponent(videoId)}`,
  );

  if ('lyrics' in response) {
    return null;
  }

  return response;
}
