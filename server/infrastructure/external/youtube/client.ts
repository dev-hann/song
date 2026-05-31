import { Innertube, Platform, type Types } from 'youtubei.js';

let innertubeInstance: Innertube | null = null;

/* eslint-disable no-new-func, @typescript-eslint/no-unsafe-call */
Platform.shim.eval = async (data: Types.BuildScriptResult): Promise<unknown> => {
  return new Function(data.output)() as unknown;
};
/* eslint-enable no-new-func, @typescript-eslint/no-unsafe-call */

const ANDROID_VR_UA = 'com.google.android.apps.youtube.vr.oculus/1.65.10 (Linux; U; Android 12L; eureka-user Build/SQ3A.220605.009.A1) gzip';

export async function getInnertube(): Promise<Innertube> {
  if (innertubeInstance) {
    return innertubeInstance;
  }

  innertubeInstance = await Innertube.create({
    generate_session_locally: false,
    enable_session_cache: false,
    lang: 'ko',
    location: 'KR',
    fetch: async (input, init) => {
      if (typeof init?.body === 'string') {
        try {
          const body = JSON.parse(init.body) as { context?: { client?: { clientName?: string } } };
          if (body.context?.client?.clientName === 'ANDROID_VR') {
            const headers = new Headers(init.headers);
            headers.set('User-Agent', ANDROID_VR_UA);
            return globalThis.fetch(input, { ...init, headers });
          }
        } catch {}
      }
      return globalThis.fetch(input, init);
    },
  });

  return innertubeInstance;
}

const OPUS_OPTIONS = {
  type: 'audio' as const,
  format: 'webm' as const,
  codec: 'opus' as const,
  client: 'MWEB' as const,
};

const ANDROID_VR_OPUS_OPTIONS = {
  type: 'audio' as const,
  format: 'webm' as const,
  codec: 'opus' as const,
  client: 'ANDROID_VR' as const,
};

export type { AudioStreamResult } from '@/server/domain/ports/providers';

const mwebFailedIds = new Set<string>();
const MAX_MWEB_FAILS = 500;

export function markMwebFailed(id: string): void {
  mwebFailedIds.add(id);
  if (mwebFailedIds.size > MAX_MWEB_FAILS) {
    const first = mwebFailedIds.values().next().value;
    if (first) {mwebFailedIds.delete(first);}
  }
}

export async function getAudioStreamUrl(id: string): Promise<{ url: string; mime_type: string }> {
  const innertube = await getInnertube();
  const skipMweb = mwebFailedIds.has(id);

  if (!skipMweb) {
    try {
      const data = await innertube.getStreamingData(id, OPUS_OPTIONS);
      if (data.url) {
        return { url: data.url, mime_type: data.mime_type };
      }
    } catch {}
  }

  try {
    const data = await innertube.getStreamingData(id, ANDROID_VR_OPUS_OPTIONS);
    if (data.url) {
      return { url: data.url, mime_type: data.mime_type };
    }
  } catch {}

  try {
    const data = await innertube.getStreamingData(id, { client: 'ANDROID_VR' });
    if (data.url) {
      return { url: data.url, mime_type: data.mime_type };
    }
  } catch {}

  throw new Error('No streaming data available');
}
