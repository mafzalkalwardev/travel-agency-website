import { ASSETS } from "@/lib/assets";
import type { GalleryItem, Service } from "@/types";

export const galleryImages: GalleryItem[] = [
  { id: "g1", src: ASSETS.gallery[0], alt: "Masjid al-Haram in Makkah", category: "umrah" },
  { id: "g2", src: ASSETS.gallery[1], alt: "Jeddah, Saudi Arabia", category: "umrah" },
  { id: "g3", src: ASSETS.gallery[2], alt: "Dubai skyline", category: "tours" },
  { id: "g4", src: ASSETS.gallery[3], alt: "Istanbul, Turkey", category: "tours" },
  { id: "g5", src: ASSETS.gallery[4], alt: "Kuala Lumpur, Malaysia", category: "tours" },
  { id: "g6", src: ASSETS.gallery[5], alt: "Thailand travel destination", category: "tours" },
  { id: "g7", src: ASSETS.gallery[6], alt: "Premium Umrah accommodation", category: "umrah" },
  { id: "g8", src: ASSETS.gallery[7], alt: "Family Umrah journey", category: "umrah" },
  { id: "g9", src: ASSETS.gallery[8], alt: "Dubai holiday experience", category: "tours" },
  { id: "g10", src: ASSETS.gallery[9], alt: "Turkey tour experience", category: "tours" },
  { id: "g11", src: ASSETS.gallery[10], alt: "Malaysia tour experience", category: "tours" },
  { id: "g12", src: ASSETS.gallery[11], alt: "International air travel", category: "tickets" },
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
