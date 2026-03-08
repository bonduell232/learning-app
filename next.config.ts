import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '22mb', // Max. 20MB Uploads + Overhead
    },
  },
  serverExternalPackages: ['@google/genai'],
};

export default nextConfig;
