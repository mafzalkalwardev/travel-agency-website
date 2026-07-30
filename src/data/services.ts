import { ASSETS } from "@/lib/assets";
import type { GalleryItem, Service } from "@/types";

export const galleryImages: GalleryItem[] = [
  { id: "g1", src: ASSETS.gallery[0], alt: "Travel journey with Al Qibla", category: "tickets" },
  { id: "g2", src: ASSETS.gallery[1], alt: "Airport and flight experience", category: "tickets" },
  { id: "g3", src: ASSETS.gallery[2], alt: "Family travel moments", category: "tours" },
  { id: "g4", src: ASSETS.gallery[3], alt: "Group travel coordination", category: "tickets" },
  { id: "g5", src: ASSETS.gallery[4], alt: "Holiday destination views", category: "tours" },
  { id: "g6", src: ASSETS.gallery[5], alt: "International air travel", category: "tickets" },
  { id: "g7", src: ASSETS.gallery[6], alt: "Masjid al-Haram in Makkah", category: "umrah" },
  { id: "g8", src: ASSETS.gallery[7], alt: "Jeddah, Saudi Arabia", category: "umrah" },
  { id: "g9", src: ASSETS.gallery[8], alt: "Dubai skyline", category: "tours" },
  { id: "g10", src: ASSETS.gallery[9], alt: "Muscat, Oman", category: "tours" },
  { id: "g11", src: ASSETS.gallery[10], alt: "Bahrain destination", category: "tickets" },
  { id: "g12", src: ASSETS.gallery[11], alt: "Istanbul, Turkey", category: "tours" },
  { id: "g13", src: ASSETS.gallery[12], alt: "Premium Umrah accommodation", category: "umrah" },
  { id: "g14", src: ASSETS.gallery[13], alt: "Family Umrah journey", category: "umrah" },
  { id: "g15", src: ASSETS.gallery[14], alt: "Dubai holiday experience", category: "tours" },
  { id: "g16", src: ASSETS.gallery[15], alt: "Al Qibla travel brand", category: "tickets" },
];

export const services: Service[] = [
  { id: "s1", title: "Domestic & International Air Ticketing", description: "Competitive fares on all major airlines for individual and group travel worldwide.", icon: "Plane", href: "/available-tickets/" },
  { id: "s2", title: "Umrah Packages", description: "Complete Umrah solutions with flights, hotels, visa, transport, and ziyarat tours.", icon: "Mosque", href: "/umrah-packages/" },
  { id: "s3", title: "Visit Visa Services", description: "Thailand, Malaysia, UAE visit visas and assistance for other destinations.", icon: "FileText", href: "/services/#visit-visa" },
  { id: "s4", title: "Hotel Reservations", description: "Hotels in Makkah, Madinah, Dubai, and worldwide at negotiated rates.", icon: "Hotel", href: "/inquiry/" },
  { id: "s5", title: "Travel Insurance", description: "Comprehensive travel insurance for peace of mind on every journey.", icon: "Shield", href: "/inquiry/" },
  { id: "s6", title: "Airport Transfers", description: "Reliable pickup and drop-off in Islamabad, Peshawar and destination cities.", icon: "Car", href: "/inquiry/" },
  { id: "s7", title: "Corporate Travel Management", description: "Dedicated solutions for NGOs, companies, schools and delegations.", icon: "Building2", href: "/corporate-travel/" },
  { id: "s8", title: "Holiday & Tour Packages", description: "Dubai, Turkey, Malaysia, Thailand, Azerbaijan and custom worldwide tours.", icon: "Palmtree", href: "/tour-packages/" },
  { id: "s9", title: "Group Travel for NGOs & Companies", description: "Special group fares and coordination for organizations.", icon: "Users", href: "/corporate-travel/" },
  { id: "s10", title: "Worldwide Ticketing Facilities", description: "Tickets to all major destinations through our airline partnerships.", icon: "Globe", href: "/available-tickets/" },
];
