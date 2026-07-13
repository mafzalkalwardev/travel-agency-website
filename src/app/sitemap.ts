import type { MetadataRoute } from "next";
import { SITE } from "@/lib/constants";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = SITE.url;

  const staticPages = [
    "",
    "/about/",
    "/flight-booking/dashboard/",
    "/umrah-packages/",
    "/tour-packages/",
    "/available-tickets/",
    "/corporate-travel/",
    "/gallery/",
    "/destinations/",
    "/inquiry/",
    "/contact/",
    "/privacy-policy/",
  ];

  return staticPages.map((path) => ({
      url: `${base}${path}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: path === "" ? 1 : 0.8,
    }));
}
