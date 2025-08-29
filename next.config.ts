import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  sassOptions: {
    includePaths: ['./styles'],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
