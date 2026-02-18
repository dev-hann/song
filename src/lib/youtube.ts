import { Innertube, Platform, Types } from 'youtubei.js';

// Cache innertube instance to avoid re-initializing on each request
let innertubeInstance: Innertube | null = null;
let platformInitialized = false;

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

  // Force Node.js platform to load on server side
  if (!platformInitialized && typeof process !== 'undefined' && process.versions?.node) {
    await import('youtubei.js', { with: { 'node': 'import' } });
    platformInitialized = true;
  }

  innertubeInstance = await Innertube.create({
    generate_session_locally: false,
    enable_session_cache: true,
    lang: 'ko',
    location: 'KR',
  });

  return innertubeInstance;
}

export { getInnertube };
