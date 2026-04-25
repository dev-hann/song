import { Innertube, Platform, Types } from 'youtubei.js';

let innertubeInstance: Innertube | null = null;

Platform.shim.eval = async (data: Types.BuildScriptResult) => {
  return new Function(data.output)();
};

export async function getInnertube(): Promise<Innertube> {
  if (innertubeInstance) {
    return innertubeInstance;
  }

  innertubeInstance = await Innertube.create({
    generate_session_locally: true,
    enable_session_cache: false,
    lang: 'ko',
    location: 'KR',
  });

  return innertubeInstance;
}
