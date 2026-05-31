import { createSerwistRoute } from '@serwist/turbopack';

export const { GET, dynamic, dynamicParams, revalidate, generateStaticParams } =
  createSerwistRoute({
    swSrc: 'app/sw.ts',
    useNativeEsbuild: true,
  });
