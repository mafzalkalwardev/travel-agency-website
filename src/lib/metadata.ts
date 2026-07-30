import type { Metadata } from "next";
import { SITE } from "./constants";

export function createPageMetadata({
  title,
  description,
  path = "",
}: {
  title: string;
  description?: string;
  path?: string;
}): Metadata {
  const fullTitle = title === SITE.name ? title : `${title} | ${SITE.name}`;
  const url = `${SITE.url}${path}`;

  return {
    metadataBase: new URL(SITE.url),
    title: fullTitle,
    description: description ?? SITE.description,
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
    },
    openGraph: {
      title: fullTitle,
      description: description ?? SITE.description,
      url,
      siteName: SITE.name,
      locale: "en_PK",
      type: "website",
      images: [
        {
          url: `${SITE.url}/google-site-logo.png`,
          width: 512,
          height: 512,
          alt: SITE.name,
        },
      ],
    },
    twitter: {
      card: "summary",
      title: fullTitle,
      description: description ?? SITE.description,
      images: [`${SITE.url}/google-site-logo.png`],
    },
  };
}
