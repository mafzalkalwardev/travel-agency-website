import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import { Toaster } from "sonner";
import { ConditionalSiteChrome } from "@/components/layout/ConditionalSiteChrome";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { WhatsAppFloat } from "@/components/layout/WhatsAppFloat";
import { OFFICES, SITE } from "@/lib/constants";
import { createPageMetadata } from "@/lib/metadata";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const playfair = Playfair_Display({ variable: "--font-playfair", subsets: ["latin"] });

export const metadata: Metadata = createPageMetadata({ title: SITE.name, description: SITE.description });

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "TravelAgency",
  name: SITE.name,
  description: SITE.description,
  url: SITE.url,
  telephone: SITE.whatsappNumber,
  address: [
    { "@type": "PostalAddress", streetAddress: OFFICES.headOffice.address, addressLocality: "Peshawar", addressCountry: "PK" },
    { "@type": "PostalAddress", streetAddress: OFFICES.islamabad.address, addressLocality: "Islamabad", addressCountry: "PK" },
  ],
  areaServed: SITE.regions,
  sameAs: [SITE.url],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable} h-full`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="flex min-h-full flex-col font-sans antialiased">
        <ConditionalSiteChrome
          header={<Header />}
          footer={<Footer />}
          whatsapp={<WhatsAppFloat />}
        >
          {children}
        </ConditionalSiteChrome>
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}
