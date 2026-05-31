import type { ExtendedAudio } from '@/types';
import { apiFetch } from '@/lib/api-client';

export async function fetchAudioInfo(audioId: string): Promise<ExtendedAudio> {
  return apiFetch<ExtendedAudio>(`/api/youtube/audio/info?id=${encodeURIComponent(audioId)}`);
}
