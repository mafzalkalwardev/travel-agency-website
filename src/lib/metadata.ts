import type { Metadata } from "next";
import { SITE } from "./constants";
import { SEO_DEFAULT_DESCRIPTION, SEO_KEYWORDS } from "./seo";

type OpenGraphType = NonNullable<Metadata["openGraph"]> extends { type?: infer T } ? T : "website";

export function createPageMetadata({
  title,
  description,
  path = "",
  keywords,
  noIndex = false,
}: {
  title: string;
  description?: string;
  path?: string;
  keywords?: readonly string[] | string[];
  noIndex?: boolean;
}): Metadata {
  const isHome = !path || path === "/";
  const fullTitle =
    title === SITE.name || title === SITE.shortName
      ? `${SITE.name} | Ticket Booking, Umrah & Group Flights`
      : title.includes(SITE.name)
        ? title
        : `${title} | ${SITE.name}`;
  const desc = description ?? SEO_DEFAULT_DESCRIPTION ?? SITE.description;
  const url = `${SITE.url}${path || "/"}`;
  const keywordList = [...(keywords?.length ? keywords : SEO_KEYWORDS)];

  return {
    metadataBase: new URL(SITE.url),
    title: fullTitle,
    description: desc,
    keywords: keywordList,
    authors: [{ name: SITE.name, url: SITE.url }],
    creator: SITE.name,
    publisher: SITE.name,
    category: "Travel",
    classification: "Travel Agency, Air Ticketing, Umrah Packages, Group Flights",
    applicationName: SITE.name,
    // Explicit icons help Google Search (multiples of 48px, stable URLs).
    icons: {
      icon: [
        { url: "/favicon-48.png", sizes: "48x48", type: "image/png" },
        { url: "/favicon.png", sizes: "48x48", type: "image/png" },
        { url: "/favicon-96.png", sizes: "96x96", type: "image/png" },
        { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
        { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
        { url: "/favicon.ico", sizes: "any" },
      ],
      apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
      shortcut: "/favicon-48.png",
    },
    manifest: "/site.webmanifest",
    alternates: {
      canonical: url,
      languages: {
        "en-PK": url,
        "x-default": url,
      },
    },
    robots: noIndex
      ? { index: false, follow: false }
      : {
          index: true,
          follow: true,
          googleBot: {
            index: true,
            follow: true,
            "max-image-preview": "large",
            "max-snippet": -1,
            "max-video-preview": -1,
          },
        },
    openGraph: {
      title: fullTitle,
      description: desc,
      url,
      siteName: SITE.name,
      locale: "en_PK",
      type: (isHome ? "website" : "website") as OpenGraphType,
      images: [
        {
          url: `${SITE.url}/google-site-logo.png`,
          width: 512,
          height: 512,
          alt: `${SITE.name} — ticket booking, Umrah packages and group flights`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description: desc,
      images: [`${SITE.url}/google-site-logo.png`],
    },
    other: {
      "geo.region": "PK",
      "geo.placename": "Peshawar, Islamabad, Bannu",
      "business:contact_data:country_name": "Pakistan",
    },
  };
}
