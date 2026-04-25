import type { ExtendedAudio, StreamUrlResponse } from '@/types';
import { apiFetch } from '@/lib/api-client';

export async function fetchAudioInfo(
  audioId: string,
): Promise<ExtendedAudio> {
  const response = await apiFetch(
    `/api/youtube/audio/info?id=${encodeURIComponent(audioId)}`,
  );

  if (!response.ok) {
    throw new Error(
      `Failed to fetch audio info: ${response.statusText}`,
    );
  }

  const data = await response.json();

  if (data.error) {
    throw new Error(data.error);
  }

  return data;
}

export async function fetchAudioStream(
  audioId: string,
): Promise<StreamUrlResponse> {
  const response = await apiFetch(
    `/api/youtube/audio/stream?id=${encodeURIComponent(audioId)}`,
  );

  if (!response.ok) {
    throw new Error(
      `Failed to fetch audio stream: ${response.statusText}`,
    );
  }

  const data = await response.json();

  if (data.error) {
    throw new Error(data.error);
  }

  return data;
}
