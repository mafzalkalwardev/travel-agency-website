import type { Metadata } from "next";
import { Playfair_Display } from "next/font/google";
import { Toaster } from "sonner";
import { ConditionalSiteChrome } from "@/components/layout/ConditionalSiteChrome";
import { DeferredSiteExtras } from "@/components/layout/DeferredSiteExtras";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { OFFICES, OFFICE_DISPLAY_ORDER, SITE, SOCIAL } from "@/lib/constants";
import { createPageMetadata } from "@/lib/metadata";
import { PAGE_SEO, SEO_KEYWORDS } from "@/lib/seo";
import "./globals.css";

const playfair = Playfair_Display({ variable: "--font-playfair", subsets: ["latin"] });

export const metadata: Metadata = createPageMetadata({
  title: PAGE_SEO.home.title,
  description: PAGE_SEO.home.description,
  path: PAGE_SEO.home.path,
  keywords: PAGE_SEO.home.keywords,
});

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${SITE.url}/#organization`,
      name: SITE.name,
      alternateName: ["Al Qibla", "AL QIBLA AIR SERVICES", "Al-Qibla Air Services", "Fly with Al Qibla"],
      url: SITE.url,
      logo: {
        "@type": "ImageObject",
        url: `${SITE.url}/google-site-logo.png`,
        width: 512,
        height: 512,
      },
      image: `${SITE.url}/google-site-logo.png`,
      email: SITE.email,
      telephone: SITE.whatsappNumber,
      sameAs: [SITE.url, SOCIAL.facebook, SOCIAL.instagram, SOCIAL.twitter, SOCIAL.facebookGroup],
      contactPoint: [
        {
          "@type": "ContactPoint",
          telephone: SITE.whatsappNumber,
          contactType: "customer service",
          areaServed: ["PK", "AE", "SA", "OM", "BH", "AF"],
          availableLanguage: ["English", "Urdu", "Pashto"],
        },
      ],
    },
    {
      "@type": "WebSite",
      "@id": `${SITE.url}/#website`,
      url: SITE.url,
      name: SITE.name,
      description: SITE.description,
      publisher: { "@id": `${SITE.url}/#organization` },
      inLanguage: ["en-PK", "en"],
      keywords: SEO_KEYWORDS.join(", "),
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `${SITE.url}/available-tickets/?fromCity={from}&toCity={to}`,
        },
        "query-input": "required name=from required name=to",
      },
    },
    {
      "@type": "TravelAgency",
      "@id": `${SITE.url}/#travelagency`,
      name: SITE.name,
      description: SITE.description,
      url: SITE.url,
      logo: `${SITE.url}/google-site-logo.png`,
      image: `${SITE.url}/google-site-logo.png`,
      telephone: OFFICES.headOffice.phoneTel,
      email: SITE.email,
      priceRange: "$$",
      currenciesAccepted: "PKR",
      paymentAccepted: "Bank Transfer, JazzCash, Easypaisa, Cash",
      openingHours: "Mo-Sa 09:00-20:00, Su 10:00-18:00",
      parentOrganization: { "@id": `${SITE.url}/#organization` },
      address: {
        "@type": "PostalAddress",
        streetAddress: "Office #4, Block-B, Cantonment Plaza, Saddar Road, Peshawar Cantonment",
        addressLocality: "Peshawar",
        addressRegion: "Khyber Pakhtunkhwa",
        postalCode: "25000",
        addressCountry: "PK",
      },
      geo: {
        "@type": "GeoCoordinates",
        latitude: SITE.geo.latitude,
        longitude: SITE.geo.longitude,
      },
      hasMap: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent("AL QIBLA AIR SERVICES Cantonment Plaza Saddar Road Peshawar")}`,
      areaServed: SITE.regions.map((name) => ({ "@type": "Place", name })),
      knowsAbout: [
        "Travel agency in Peshawar",
        "Ticket booking",
        "Air ticket booking",
        "Umrah ticket booking",
        "Umrah packages",
        "Group flights",
        "Group travel",
        "Travel agent services",
        "Visit visas",
        "Corporate travel",
      ],
      department: OFFICE_DISPLAY_ORDER.filter((o) => o.label !== OFFICES.headOffice.label).map((office) => ({
        "@type": "TravelAgency",
        name: `${SITE.name} — ${office.label}`,
        telephone: office.phoneTel,
        address: {
          "@type": "PostalAddress",
          streetAddress: office.address,
          addressCountry: "PK",
        },
      })),
      hasOfferCatalog: {
        "@type": "OfferCatalog",
        name: "Al Qibla Travel Services",
        itemListElement: [
          {
            "@type": "OfferCatalog",
            name: "Air Ticket Booking",
            itemListElement: [
              { "@type": "Offer", itemOffered: { "@type": "Service", name: "Domestic ticket booking", url: `${SITE.url}/available-tickets/` } },
              { "@type": "Offer", itemOffered: { "@type": "Service", name: "International ticket booking", url: `${SITE.url}/available-tickets/` } },
              { "@type": "Offer", itemOffered: { "@type": "Service", name: "Group flight ticket booking", url: `${SITE.url}/available-tickets/` } },
            ],
          },
          {
            "@type": "OfferCatalog",
            name: "Umrah",
            itemListElement: [
              { "@type": "Offer", itemOffered: { "@type": "Service", name: "Umrah packages", url: `${SITE.url}/umrah-packages/` } },
              { "@type": "Offer", itemOffered: { "@type": "Service", name: "Umrah tickets", url: `${SITE.url}/group-flights/umrah-groups/` } },
            ],
          },
          {
            "@type": "OfferCatalog",
            name: "Group Travels",
            itemListElement: [
              { "@type": "Offer", itemOffered: { "@type": "Service", name: "UAE group tickets", url: `${SITE.url}/group-flights/uae-oneway/` } },
              { "@type": "Offer", itemOffered: { "@type": "Service", name: "Oman group tickets", url: `${SITE.url}/group-flights/oman-oneway/` } },
              { "@type": "Offer", itemOffered: { "@type": "Service", name: "KSA group tickets", url: `${SITE.url}/group-flights/ksa-oneway/` } },
              { "@type": "Offer", itemOffered: { "@type": "Service", name: "Bahrain group tickets", url: `${SITE.url}/group-flights/bahrain-oneway/` } },
            ],
          },
          {
            "@type": "OfferCatalog",
            name: "Agent Portal",
            itemListElement: [
              { "@type": "Offer", itemOffered: { "@type": "Service", name: "Become a ticket booking agent", url: `${SITE.url}/portal/` } },
              { "@type": "Offer", itemOffered: { "@type": "Service", name: "Sub-agent registration", url: `${SITE.url}/account/signup/` } },
            ],
          },
        ],
      },
      sameAs: [SOCIAL.facebook, SOCIAL.instagram, SOCIAL.twitter],
    },
    {
      "@type": "ItemList",
      "@id": `${SITE.url}/#top-services`,
      name: "Popular ticket booking services",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Air ticket booking", url: `${SITE.url}/available-tickets/` },
        { "@type": "ListItem", position: 2, name: "Umrah packages & Umrah tickets", url: `${SITE.url}/umrah-packages/` },
        { "@type": "ListItem", position: 3, name: "Group travels & group flights", url: `${SITE.url}/destinations/` },
        { "@type": "ListItem", position: 4, name: "Become a ticket booking agent", url: `${SITE.url}/portal/` },
        { "@type": "ListItem", position: 5, name: "Tour packages", url: `${SITE.url}/tours/` },
        { "@type": "ListItem", position: 6, name: "Travel agency in Peshawar", url: `${SITE.url}/travel-agency-peshawar/` },
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
    <html lang="en-PK" className={`${playfair.variable} h-full`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="flex min-h-full flex-col font-sans antialiased">
        <DeferredSiteExtras />
        <ConditionalSiteChrome
          header={<Header />}
          footer={<Footer />}
          whatsapp={null}
        >
          {children}
        </ConditionalSiteChrome>
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
