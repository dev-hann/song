import type { NextConfig } from 'next';
import { readFileSync } from 'fs';
import { withSerwist } from '@serwist/turbopack';

const { version } = JSON.parse(readFileSync('package.json', 'utf-8'));

const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
];

const nextConfig: NextConfig = withSerwist({
  output: 'standalone',
  poweredByHeader: false,
  allowedDevOrigins: ['100.102.147.53', 'song.dev-hann.com'],
  env: {
    NEXT_PUBLIC_APP_VERSION: version,
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.ggpht.com' },
      { protocol: 'https', hostname: '**.googleusercontent.com' },
      { protocol: 'https', hostname: '**.ytimg.com' },
      { protocol: 'https', hostname: 'cdnimg.melon.co.kr' },
    ],
  },
  async headers() {
    return [{ source: '/(.*)', headers: securityHeaders }];
  },
});

export default nextConfig;
