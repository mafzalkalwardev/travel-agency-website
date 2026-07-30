import type { MetadataRoute } from "next";
import { SITE } from "@/lib/constants";

export const dynamic = "force-static";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/", "/api/admin/", "/tl-mirror/", "/account/bookings/"],
      },
      {
        userAgent: "Googlebot",
        allow: "/",
        disallow: ["/admin/", "/api/admin/", "/tl-mirror/"],
      },
    ],
    host: SITE.url,
    sitemap: `${SITE.url}/sitemap.xml`,
  };
}
