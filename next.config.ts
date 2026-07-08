import type { NextConfig } from "next";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

const nextConfig: NextConfig = {
  ...(basePath ? { basePath, assetPrefix: `${basePath}/` } : {}),
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**.supabase.co" }],
  },
  trailingSlash: true,
};

export default nextConfig;
