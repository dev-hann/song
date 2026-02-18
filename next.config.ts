import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ['youtubei.js'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
  },
};

export default nextConfig;
