import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '27mb', // Max. 25MB Uploads + Overhead
    },
  },
  serverExternalPackages: ['@google/genai'],
};

export default nextConfig;
