import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'api.mucy.mx',
        port: '',
        pathname: '/hostinger-api/uploads/**',
      },
    ],
  },
};

export default nextConfig;
