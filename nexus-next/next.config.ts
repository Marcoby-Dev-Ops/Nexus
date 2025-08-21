import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    appDir: true,
  },
  images: {
    domains: ['localhost', 'nexus.marcoby.net'],
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': require('path').resolve(__dirname, 'src'),
      '@/components': require('path').resolve(__dirname, 'src/components'),
      '@/lib': require('path').resolve(__dirname, 'src/lib'),
      '@/shared': require('path').resolve(__dirname, 'src/shared'),
      '@/hooks': require('path').resolve(__dirname, 'src/hooks'),
      '@/services': require('path').resolve(__dirname, 'src/services'),
      '@/types': require('path').resolve(__dirname, 'src/types'),
      '@/utils': require('path').resolve(__dirname, 'src/utils'),
      '@/core': require('path').resolve(__dirname, 'src/core'),
      '@/ai': require('path').resolve(__dirname, 'src/ai'),
    };
    return config;
  },
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
};

export default nextConfig;
