/**
 * Central SEO copy for Al Qibla Air Services.
 * Titles stay readable; keywords cover ticket-booking search intents.
 */

export const SEO_KEYWORDS = [
  // Core ticket booking
  "ticket booking",
  "ticket bookings",
  "book tickets online",
  "air ticket booking",
  "flight ticket booking",
  "airline ticket booking",
  "cheap air tickets",
  "domestic ticket booking",
  "international ticket booking",
  "online ticket booking Pakistan",
  "flight booking Pakistan",
  "air tickets Pakistan",
  "book flight tickets",
  "plane ticket booking",
  // Umrah
  "umrah tickets",
  "umrah ticket booking",
  "umrah packages",
  "umrah packages Pakistan",
  "umrah groups",
  "cheap umrah packages",
  "umrah from Pakistan",
  "umrah from Peshawar",
  "umrah from Islamabad",
  "makkah madinah packages",
  // Group travel
  "group travel",
  "group travels",
  "group flights",
  "group ticket booking",
  "group air tickets",
  "group fares",
  "group travel packages",
  "UAE group tickets",
  "Oman group tickets",
  "KSA group tickets",
  "Bahrain group tickets",
  "Jeddah tickets",
  "Dubai tickets",
  "Muscat tickets",
  // Agent / B2B
  "become travel agent",
  "become ticket booking agent",
  "travel agent Pakistan",
  "sub agent ticket booking",
  "B2B ticket booking",
  "travel agency portal",
  "agent air ticketing",
  "wholesale group tickets",
  // Brand + geo
  "Al Qibla Air Services",
  "Al Qibla tickets",
  "travel agency Peshawar",
  "travel agency Islamabad",
  "travel agency Bannu",
  "IATA travel agent Pakistan",
  // Adjacent services
  "visit visa",
  "Saudi visit visa",
  "hotel booking",
  "corporate travel",
  "tour packages",
  "travel insurance",
] as const;

export const SEO_HOME_TITLE =
  "Ticket Booking, Umrah Packages & Group Flights Pakistan";

export const SEO_HOME_DESCRIPTION =
  "Book air tickets, Umrah tickets, group flights and tour packages online with Al Qibla Air Services. Domestic & international ticket booking, Umrah packages from Pakistan, group travels to UAE, Oman, KSA & Bahrain. Become a ticket booking agent — offices in Peshawar, Islamabad & Bannu.";

export const SEO_DEFAULT_DESCRIPTION = SEO_HOME_DESCRIPTION;

/** Page-level SEO presets used across routes. */
export const PAGE_SEO = {
  home: {
    title: SEO_HOME_TITLE,
    description: SEO_HOME_DESCRIPTION,
    path: "/",
    keywords: [...SEO_KEYWORDS],
  },
  availableTickets: {
    title: "Book Air Tickets Online | Live Group Flight Ticket Booking",
    description:
      "Book air tickets online — domestic & international flight ticket booking with live seats and group fares. PIA, Saudia, Emirates, Airblue and more. Cheap ticket bookings for Jeddah, Dubai, Muscat, Bahrain and worldwide.",
    path: "/available-tickets/",
    keywords: [
      "ticket booking",
      "book air tickets online",
      "flight ticket booking",
      "group flight tickets",
      "cheap air tickets Pakistan",
      "available tickets",
      "airline ticket booking",
      "domestic ticket booking",
      "international ticket booking",
    ],
  },
  umrahPackages: {
    title: "Umrah Packages & Umrah Ticket Booking from Pakistan",
    description:
      "Book Umrah packages and Umrah tickets from Pakistan with hotels, flights and seat availability. Affordable Umrah ticket booking, Umrah groups and Makkah–Madinah packages from Peshawar, Islamabad and Bannu.",
    path: "/umrah-packages/",
    keywords: [
      "umrah packages",
      "umrah tickets",
      "umrah ticket booking",
      "umrah from Pakistan",
      "cheap umrah packages",
      "umrah groups",
      "makkah madinah packages",
    ],
  },
  groupFlights: {
    title: "Group Flights & Group Travel Ticket Booking",
    description:
      "Book group flights and group travel tickets to UAE, Oman, KSA, Bahrain and Umrah groups. Live group fares, seat inventory and wholesale ticket booking for agents and travelers.",
    path: "/group-flights/",
    keywords: [
      "group flights",
      "group travel",
      "group travels",
      "group ticket booking",
      "group air tickets",
      "group fares",
    ],
  },
  destinations: {
    title: "Explore Destinations | Umrah, Group Tickets & Tours",
    description:
      "Explore Umrah packages, group ticket bookings and tours by destination — Saudi Arabia, UAE, Oman, Bahrain and more with Al Qibla Air Services.",
    path: "/destinations/",
    keywords: ["umrah destinations", "group tickets by destination", "explore flights Pakistan"],
  },
  tours: {
    title: "Tour Packages & Holiday Ticket Booking",
    description:
      "Book tour packages and holiday travel with flight ticket booking — Dubai, Turkey, Malaysia and domestic tours from Al Qibla Air Services.",
    path: "/tours/",
    keywords: ["tour packages", "holiday packages Pakistan", "tour ticket booking"],
  },
  tourPackages: {
    title: "Holiday & Tour Packages | Book Travel Online",
    description:
      "Browse holiday and tour packages with ticket booking support — Dubai, Turkey, Malaysia and domestic destinations.",
    path: "/tour-packages/",
    keywords: ["tour packages", "holiday packages", "book tours Pakistan"],
  },
  services: {
    title: "Travel Services | Ticket Booking, Umrah, Visas & Hotels",
    description:
      "Full travel services: air ticket booking, Umrah packages, group travels, visit visas, hotels, travel insurance and corporate travel management across Pakistan and worldwide.",
    path: "/services/",
    keywords: [
      "travel services Pakistan",
      "ticket booking services",
      "umrah services",
      "visa services",
      "corporate travel",
    ],
  },
  portal: {
    title: "Become a Ticket Booking Agent | Travel Agent Portal",
    description:
      "Become a ticket booking agent with Al Qibla Air Services. Access live group inventory, wholesale fares and B2B air ticketing through our sub-agent travel portal.",
    path: "/portal/",
    keywords: [
      "become travel agent",
      "become ticket booking agent",
      "travel agent portal",
      "sub agent ticket booking",
      "B2B air ticketing",
    ],
  },
  accountSignup: {
    title: "Register as Travel Agent | Sub-Agent Ticket Booking Access",
    description:
      "Create your sub-agent account for approved B2B ticket booking access — book group flights, Umrah tickets and wholesale air fares online.",
    path: "/account/signup/",
    keywords: [
      "become ticket booking agent",
      "travel agency registration Pakistan",
      "sub agent signup",
      "B2B ticket booking",
    ],
  },
  account: {
    title: "Agent Portal | Live Ticket Booking Dashboard",
    description:
      "Sign in to the Al Qibla agent portal for live ticket booking, group flights, Umrah inventory and booking management.",
    path: "/account/",
    keywords: ["travel agent portal", "ticket booking dashboard", "agent air ticketing"],
  },
  about: {
    title: "About Al Qibla Air Services | Trusted Ticket Booking Agency",
    description:
      "About Al Qibla Air Services — trusted ticket booking, Umrah packages and group travel agency with offices in Peshawar, Islamabad and Bannu. IATA-verified agents and verified client reviews.",
    path: "/about/",
    keywords: [
      "Al Qibla Air Services",
      "travel agency Peshawar",
      "travel agency Islamabad",
      "IATA travel agent",
    ],
  },
  contact: {
    title: "Contact for Ticket Booking | WhatsApp & Offices",
    description:
      "Contact Al Qibla for ticket booking, Umrah packages and group travels. WhatsApp support plus offices in Peshawar, Islamabad and Bannu.",
    path: "/contact/",
    keywords: ["contact travel agency", "ticket booking WhatsApp", "travel agency Peshawar contact"],
  },
  inquiry: {
    title: "Book Tickets / Travel Inquiry | Instant WhatsApp Booking",
    description:
      "Submit a ticket booking or travel inquiry — air tickets, Umrah tickets, group travels, visas and hotels. Fast WhatsApp confirmation with Al Qibla Air Services.",
    path: "/inquiry/",
    keywords: ["book tickets inquiry", "travel inquiry Pakistan", "WhatsApp ticket booking"],
  },
  corporate: {
    title: "Corporate Travel & Group Ticket Booking for Companies",
    description:
      "Corporate travel management and group ticket booking for companies and NGOs — dedicated support, consolidated billing and priority air ticketing.",
    path: "/corporate-travel/",
    keywords: ["corporate travel Pakistan", "NGO travel", "corporate ticket booking"],
  },
  flightBooking: {
    title: "Flight Booking | Search & Book Group Air Tickets",
    description:
      "Search and book group air tickets online. Flight ticket booking with live inventory for Umrah, UAE, Oman, KSA and Bahrain routes.",
    path: "/flight-booking/",
    keywords: ["flight booking", "book group flights", "search air tickets"],
  },
  gallery: {
    title: "Travel Gallery | Umrah & Group Travel Moments",
    description:
      "Photo gallery from Al Qibla Air Services — Umrah journeys, group travels and destinations.",
    path: "/gallery/",
    keywords: ["umrah gallery", "travel gallery Pakistan"],
  },
} as const;
