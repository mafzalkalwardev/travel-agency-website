import { OFFICES, SITE, SOCIAL } from "./constants";

/** FAQ JSON-LD for the Peshawar local landing page. */
export function getPeshawarLandingFaqJsonLd() {
  const faqs = [
    {
      question: "Where is AL QIBLA AIR SERVICES located in Peshawar?",
      answer:
        "Our head office is at Office #4, Block-B, Cantonment Plaza, Saddar Road, Peshawar Cantonment, Peshawar 25000.",
    },
    {
      question: "Is AL QIBLA AIR SERVICES a travel agency in Peshawar?",
      answer:
        "Yes. AL QIBLA AIR SERVICES is a registered travel agency based in Peshawar Cantt offering air ticketing, Umrah packages, group flights, visit visas, hotels and corporate travel.",
    },
    {
      question: "How do I book tickets or Umrah from Peshawar?",
      answer:
        "Book online at flywithalqibla.com, visit our Cantonment Plaza office, or WhatsApp us on +923315576169 for a quote.",
    },
    {
      question: "What services does this Peshawar travel agency offer?",
      answer:
        "Air ticket booking, Umrah packages, group flights to UAE/KSA/Oman/Bahrain, visit visas, hotel reservations, tours and corporate travel management.",
    },
  ];

  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

/** Optional standalone TravelAgency node (kept for reuse / tooling). */
export function getTravelAgencyJsonLd() {
  const peshawar = OFFICES.headOffice;

  return {
    "@context": "https://schema.org",
    "@type": "TravelAgency",
    "@id": `${SITE.url}/#organization`,
    name: SITE.name,
    alternateName: ["AL QIBLA AIR SERVICES", "Al Qibla Air Services Peshawar", "Fly With Al Qibla"],
    description: SITE.description,
    url: SITE.url,
    image: `${SITE.url}/google-site-logo.png`,
    logo: `${SITE.url}/google-site-logo.png`,
    telephone: peshawar.phoneTel,
    email: SITE.email,
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
    sameAs: [SITE.url, SOCIAL.facebook, SOCIAL.instagram, SOCIAL.twitter, SOCIAL.facebookGroup],
  };
}
