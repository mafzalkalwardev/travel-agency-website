import type { Metadata } from "next";
import { Playfair_Display } from "next/font/google";
import { Toaster } from "sonner";
import { ConditionalSiteChrome } from "@/components/layout/ConditionalSiteChrome";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { SupportChatWidget } from "@/components/chat/SupportChatWidget";
import { SiteArrivalIntro } from "@/components/motion/SiteArrivalIntro";
import { OFFICE_DISPLAY_ORDER, SITE } from "@/lib/constants";
import { createPageMetadata } from "@/lib/metadata";
import "./globals.css";

const playfair = Playfair_Display({ variable: "--font-playfair", subsets: ["latin"] });

export const metadata: Metadata = createPageMetadata({ title: SITE.name, description: SITE.description });

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE.url}/#organization`,
      name: SITE.name,
      url: SITE.url,
      logo: {
        "@type": "ImageObject",
        url: `${SITE.url}/google-site-logo.png`,
        width: 512,
        height: 512,
      },
      image: `${SITE.url}/google-site-logo.png`,
      sameAs: [
        SITE.url,
        "https://www.facebook.com/Alqiblaairservices/",
        "https://www.instagram.com/alqiblaairservices/",
      ],
    },
    {
      "@type": "WebSite",
      "@id": `${SITE.url}/#website`,
      url: SITE.url,
      name: SITE.name,
      description: SITE.description,
      publisher: { "@id": `${SITE.url}/#organization` },
      inLanguage: "en-PK",
    },
    {
      "@type": "TravelAgency",
      "@id": `${SITE.url}/#travelagency`,
      name: SITE.name,
      description: SITE.description,
      url: SITE.url,
      logo: `${SITE.url}/google-site-logo.png`,
      image: `${SITE.url}/google-site-logo.png`,
      telephone: SITE.whatsappNumber,
      email: SITE.email,
      parentOrganization: { "@id": `${SITE.url}/#organization` },
      address: OFFICE_DISPLAY_ORDER.map((office) => ({
        "@type": "PostalAddress",
        streetAddress: office.address,
        addressCountry: "PK",
      })),
      areaServed: SITE.regions,
      sameAs: [
        "https://www.facebook.com/Alqiblaairservices/",
        "https://www.instagram.com/alqiblaairservices/",
      ],
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${playfair.variable} h-full`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="flex min-h-full flex-col font-sans antialiased">
        <SiteArrivalIntro />
        <ConditionalSiteChrome
          header={<Header />}
          footer={<Footer />}
          whatsapp={<SupportChatWidget />}
        >
          {children}
        </ConditionalSiteChrome>
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
