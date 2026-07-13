/** Travel imagery — local assets in public/assets */

export const ASSETS = {
  logo: "/assets/logo/logo.png",
  heroVideo: "/assets/videos/hero-flight.mp4",
  heroPoster: "/assets/heroes/hero-poster.jpg",

  flyers: {
    umrah: "/assets/flyers/flyer-1.jpeg",
    tickets: "/assets/flyers/flyer-2.jpeg",
    corporate: "/assets/flyers/flyer-3.jpeg",
    tours: "/assets/flyers/flyer-4.jpeg",
    visa: "/assets/flyers/flyer-5.jpeg",
    airfares: "/assets/flyers/flyer-6.jpeg",
  },

  destinations: {
    umrah: "/assets/destinations/umrah-makkah.jpg",
    umrahGroups: "/assets/destinations/umrah-makkah.jpg",
    ksa: "/assets/destinations/ksa-jeddah.jpg",
    uae: "/assets/destinations/uae-dubai.jpg",
    oman: "/assets/destinations/uae-dubai.jpg",
    afghanistan: "/assets/destinations/afghanistan.jpg",
    dubaiTours: "/assets/destinations/dubai-tours.jpg",
    malaysia: "/assets/destinations/malaysia-kl.jpg",
    thailand: "/assets/destinations/thailand.jpg",
    turkey: "/assets/destinations/turkey-istanbul.jpg",
    corporate: "/assets/destinations/corporate-travel.jpg",
  },

  heroes: {
    about: "/assets/heroes/about.jpg",
    services: "/assets/heroes/services.jpg",
    umrah: "/assets/heroes/umrah.jpg",
    tours: "/assets/heroes/tours.jpg",
    tickets: "/assets/heroes/tickets.jpg",
    destinations: "/assets/heroes/destinations.jpg",
    corporate: "/assets/heroes/corporate.jpg",
    gallery: "/assets/heroes/gallery.jpg",
    blog: "/assets/heroes/blog.jpg",
    contact: "/assets/heroes/contact.jpg",
    inquiry: "/assets/heroes/inquiry.jpg",
    poster: "/assets/heroes/hero-poster.jpg",
  },

  umrahPackages: [
    "/assets/packages/umrah-economy.jpg",
    "/assets/packages/umrah-standard.jpg",
    "/assets/packages/umrah-premium.jpg",
    "/assets/packages/umrah-group.jpg",
    "/assets/packages/umrah-family.jpg",
    "/assets/packages/umrah-corporate.jpg",
  ],

  tourPackages: [
    "/assets/packages/tours/dubai.jpg",
    "/assets/packages/tours/turkey.jpg",
    "/assets/packages/tours/malaysia.jpg",
    "/assets/packages/tours/thailand.jpg",
    "/assets/packages/tours/azerbaijan.jpg",
    "/assets/packages/tours/northern-pakistan.jpg",
  ],

  blog: [
    "/assets/blog/umrah-guide.jpg",
    "/assets/blog/ticketing-tips.jpg",
    "/assets/blog/corporate-travel.jpg",
  ],

  gallery: [
    "/assets/destinations/umrah-makkah.jpg",
    "/assets/destinations/ksa-jeddah.jpg",
    "/assets/destinations/uae-dubai.jpg",
    "/assets/destinations/turkey-istanbul.jpg",
    "/assets/destinations/malaysia-kl.jpg",
    "/assets/destinations/thailand.jpg",
    "/assets/packages/umrah-premium.jpg",
    "/assets/packages/umrah-family.jpg",
    "/assets/packages/tours/dubai.jpg",
    "/assets/packages/tours/turkey.jpg",
    "/assets/packages/tours/malaysia.jpg",
    "/assets/heroes/hero-poster.jpg",
  ],
} as const;

export const HERO_VIDEO = ASSETS.heroVideo;
