import { Innertube, Platform, Types } from 'youtubei.js';

// Cache innertube instance to avoid re-initializing on each request
let innertubeInstance: Innertube | null = null;

// Custom eval shim required by YouTube.js for browser compatibility
Platform.shim.eval = async (data: Types.BuildScriptResult, env: Record<string, Types.VMPrimative>) => {
  const properties = [];

  if (env.n) {
    properties.push(`n: exportedVars.nFunction("${env.n}")`);
  }

  if (env.sig) {
    properties.push(`sig: exportedVars.sigFunction("${env.sig}")`);
  }

  const code = `${data.output}\nreturn { ${properties.join(', ')} }`;

  return new Function(code)();
};

/**
 * Gets or creates the Innertube instance.
 * Uses cached instance if available for better performance.
 *
 * @returns Promise that resolves to Innertube instance
 */
async function getInnertube(): Promise<Innertube> {
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

export { getInnertube };
