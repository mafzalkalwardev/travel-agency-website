import type { NextConfig } from "next";

const basePath = process.env.NEXT_PUBLIC_BASE_PATH || "";

const nextConfig: NextConfig = {
  ...(basePath ? { basePath, assetPrefix: `${basePath}/` } : {}),
  images: {
    remotePatterns: [{ protocol: "https", hostname: "**.supabase.co" }],
  },
  trailingSlash: true,
  async redirects() {
    return [
      // Prefer the www host Google already indexes (helps favicon + canonical consistency).
      {
        source: "/:path*",
        has: [{ type: "host", value: "flywithalqibla.com" }],
        destination: "https://www.flywithalqibla.com/:path*",
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path(favicon.ico|favicon.png|favicon-48.png|favicon-96.png|icon-192.png|icon-512.png|apple-touch-icon.png|google-site-logo.png|site.webmanifest)",
        headers: [
          { key: "Cache-Control", value: "public, max-age=86400, stale-while-revalidate=604800" },
        ],
      },
      {
        source: "/admin/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "no-referrer" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
          {
            key: "Cache-Control",
            value: "no-store, no-cache, must-revalidate, private",
          },
        ],
      },
      {
        source: "/api/admin/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "no-referrer" },
          { key: "Cache-Control", value: "no-store" },
        ],
      },
    ];
  },
};

export default nextConfig;
