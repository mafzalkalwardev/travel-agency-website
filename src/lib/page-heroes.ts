import { ASSETS } from "./assets";

export const PAGE_HEROES = {
  about: {
    title: "About Al Qibla Air Services",
    subtitle: "Your trusted travel partner for Umrah, ticketing, visas and corporate travel across Pakistan and worldwide.",
    backgroundImage: ASSETS.heroes.about,
  },
  services: {
    title: "Our Services",
    subtitle: "Domestic & international ticketing, Umrah packages, visas, hotels, insurance, transfers and 24/7 support.",
    backgroundImage: ASSETS.heroes.services,
  },
  umrah: {
    title: "Umrah Packages",
    subtitle: "Economy, standard, premium and Ramadan packages with verified hotels and complete travel support.",
    backgroundImage: ASSETS.heroes.umrah,
  },
  tours: {
    title: "Tour Packages",
    subtitle: "Dubai, Turkey, Malaysia, Thailand, Azerbaijan and worldwide holiday packages.",
    backgroundImage: ASSETS.heroes.tours,
  },
  tickets: {
    title: "Group Flight Tickets",
    subtitle: "Live inventory from our supplier network — search, filter, and request a booking.",
    backgroundImage: ASSETS.heroes.tickets,
  },
  destinations: {
    title: "Explore Destinations",
    subtitle: "Umrah, KSA/UAE groups, visas, tours and corporate travel worldwide.",
    backgroundImage: ASSETS.heroes.destinations,
  },
  corporate: {
    title: "Corporate Travel",
    subtitle: "Group travel management for NGOs, companies, schools and delegations.",
    backgroundImage: ASSETS.heroes.corporate,
  },
  gallery: {
    title: "Travel Gallery",
    subtitle: "Umrah journeys, trusted destinations and travel experiences offered by Al Qibla.",
    backgroundImage: ASSETS.heroes.poster,
  },
  blog: {
    title: "Blog & Travel News",
    subtitle: "Umrah guides, ticketing tips, visa updates and company news.",
    backgroundImage: ASSETS.heroes.blog,
  },
  contact: {
    title: "Contact Us",
    subtitle: "Peshawar, Islamabad and Bannu offices — phone, WhatsApp and in-person support.",
    backgroundImage: ASSETS.heroes.contact,
  },
  inquiry: {
    title: "Book / Inquiry",
    subtitle: "Send your travel request — we respond quickly on WhatsApp.",
    backgroundImage: ASSETS.heroes.inquiry,
  },
} as const;
