import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        // Las imágenes de eventos ya migrados viven aquí ahora.
        protocol: 'https',
        hostname: 'api.mucy.mx',
        port: '',
        pathname: '/hostinger-api/uploads/**',
      },
      {
        // TODO: quitar una vez que las imágenes de los eventos existentes se
        // resuban a Hostinger — hoy siguen apuntando a Supabase Storage.
        protocol: 'https',
        hostname: '*.supabase.co',
        port: '',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
