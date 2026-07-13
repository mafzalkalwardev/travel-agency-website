export const SITE = {
  name: "Al Qibla Air Services",
  shortName: "Al Qibla",
  tagline: "Travel Smart. Travel Safe. Travel with Al Qibla.",
  heroSubheading:
    "Your trusted travel partner for Umrah packages, worldwide air ticketing, visit visas, hotels, tours and corporate travel.",
  description:
    "Premium travel agency offering domestic and international air ticketing, Umrah packages, visit visas, hotel reservations, travel insurance, and corporate travel management across Pakistan, UAE, Saudi Arabia, Afghanistan and worldwide.",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://al-qibla-air-services.vercel.app",
  whatsapp: "https://wa.me/923315576169",
  whatsappNumber: "+923315576169",
  email: "info@alqiblaairservices.com",
  businessHours: "Mon – Sat: 9:00 AM – 8:00 PM | Sun: 10:00 AM – 6:00 PM",
  regions: ["Pakistan", "UAE", "Afghanistan", "Saudi Arabia", "Worldwide"],
} as const;

export const PAYMENT = {
  bankName: "Bank Alfalah",
  accountTitle: "Al Qibla Air Services",
  accountNumber: "Contact office for account details",
  iban: "",
  instructions:
    "Send payment via bank transfer or Easypaisa/JazzCash, then share your payment screenshot on WhatsApp to confirm your booking.",
} as const;

export const OFFICES = {
  headOffice: {
    label: "Head Office — Peshawar",
    address:
      "OFFICE#4 BLOCK-B, CANTONMENT PLAZA, Saddar Rd, Peshawar Cantonment, Peshawar, 25000",
    phone: "0345 9112552",
    phoneTel: "+923459112552",
    mapEmbed:
      "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d13230.865035055374!2d71.51575875607608!3d33.99982117082442!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x38d9173580ae2a23%3A0xd6fdd98e31e23b5!2sAL%20QIBLA%20AIR%20SERVICES!5e0!3m2!1sen!2s!4v1782313327836!5m2!1sen!2s",
  },
  islamabad: {
    label: "Islamabad Branch",
    address: "Office No.11, Askan Center, E-11/3 Markaz, Islamabad",
    phone: SITE.whatsappNumber,
    phoneTel: "+923315576169",
    mapEmbed:
      "https://www.google.com/maps?q=Office%20No.11%2C%20Askan%20Center%2C%20E-11%2F3%20Markaz%2C%20Islamabad&output=embed",
  },
  bannu: {
    label: "Bannu Branch",
    address: "Office Number 31, Regal Cinema Market, Bannu",
    phone: "0335 9945722",
    phoneTel: "+923359945722",
    phoneAlt: "0334 9174009",
    phoneAltTel: "+923349174009",
    mapEmbed:
      "https://www.google.com/maps?q=Office%20Number%2031%2C%20Regal%20Cinema%20Market%2C%20Bannu&output=embed",
  },
} as const;

// Public-facing office order: Bannu left, Peshawar head office center, Islamabad right.
export const OFFICE_DISPLAY_ORDER = [OFFICES.bannu, OFFICES.headOffice, OFFICES.islamabad] as const;

export const SOCIAL = {
  facebook: "https://www.facebook.com/Alqiblaairservices/",
  facebookGroup: "https://www.facebook.com/groups/201739273367417/",
  instagram: "https://www.instagram.com/alqiblaairservices/",
  twitter: "https://x.com/alqiblair",
  whatsapp: SITE.whatsapp,
} as const;

export const TRUST_BADGES = [
  "IATA Verified",
  "DTS Registered",
  "24/7 Support",
  "Worldwide Ticketing",
] as const;

export const TRUST_TEXT = [
  "Registered with Department of Tourist Services",
  "IATA verified & certified agents",
  "Worldwide ticketing facilities",
  "24/7 customer support",
  "Serving Pakistan, UAE, Afghanistan, Saudi Arabia and worldwide clients",
] as const;

export const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/about/", label: "About Us" },
  { href: "/umrah-packages/", label: "Umrah Packages" },
  { href: "/tour-packages/", label: "Tour Packages" },
  { href: "/available-tickets/", label: "Available Tickets" },
  { href: "/destinations/", label: "Destinations" },
  { href: "/gallery/", label: "Gallery" },
  { href: "/contact/", label: "Contact" },
  { href: "/inquiry/", label: "Book / Inquiry" },
] as const;

export const LOGO_PATH = "/assets/logo/logo.png";
export const LOGO_ALT_PATH = "/assets/logo/logo-alt.png";

// Legacy alias
export const MAP_EMBED_URL = OFFICES.islamabad.mapEmbed;
