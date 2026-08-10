import type { MetadataRoute } from "next";
import { SITE } from "@/lib/constants";
import { EXPLORE_CATEGORIES } from "@/lib/travelline/categories";

export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = SITE.url;
  const now = new Date();

  const staticPages: Array<{ path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] }> = [
    { path: "/", priority: 1, changeFrequency: "daily" },
    { path: "/travel-agency-peshawar/", priority: 1, changeFrequency: "weekly" },
    { path: "/available-tickets/", priority: 1, changeFrequency: "hourly" },
    { path: "/umrah-packages/", priority: 0.95, changeFrequency: "daily" },
    { path: "/destinations/", priority: 0.9, changeFrequency: "daily" },
    { path: "/flight-booking/", priority: 0.9, changeFrequency: "daily" },
    { path: "/portal/", priority: 0.9, changeFrequency: "weekly" },
    { path: "/account/signup/", priority: 0.85, changeFrequency: "weekly" },
    { path: "/services/", priority: 0.85, changeFrequency: "weekly" },
    { path: "/tours/", priority: 0.8, changeFrequency: "weekly" },
    { path: "/tour-packages/", priority: 0.8, changeFrequency: "weekly" },
    { path: "/corporate-travel/", priority: 0.75, changeFrequency: "weekly" },
    { path: "/inquiry/", priority: 0.8, changeFrequency: "weekly" },
    { path: "/about/", priority: 0.7, changeFrequency: "monthly" },
    { path: "/contact/", priority: 0.7, changeFrequency: "monthly" },
    { path: "/gallery/", priority: 0.5, changeFrequency: "monthly" },
    { path: "/account/login/", priority: 0.6, changeFrequency: "monthly" },
    { path: "/privacy-policy/", priority: 0.3, changeFrequency: "yearly" },
  ];

  const groupFlightPages = EXPLORE_CATEGORIES.filter((c) => c.kind === "group-flights").map((c) => ({
    path: `/group-flights/${c.slug}/`,
    priority: 0.9,
    changeFrequency: "hourly" as const,
  }));

  return [...staticPages, ...groupFlightPages].map((page) => ({
    url: `${base}${page.path}`,
    lastModified: now,
    changeFrequency: page.changeFrequency,
    priority: page.priority,
  }));
}
