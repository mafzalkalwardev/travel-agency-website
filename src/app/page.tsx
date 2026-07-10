import { AirlinePartners } from "@/components/home/AirlinePartners";
import { AnnouncementTicker } from "@/components/home/AnnouncementTicker";
import { BlogPreview } from "@/components/home/BlogPreview";
import { ContactCTA } from "@/components/home/ContactCTA";
import { CorporateTravelCTA } from "@/components/home/CorporateTravelCTA";
import { DestinationGrid } from "@/components/home/DestinationGrid";
import { FeaturedUmrahPackages } from "@/components/home/FeaturedUmrahPackages";
import { FlyersCarousel } from "@/components/home/FlyersCarousel";
import { GalleryPreview } from "@/components/home/GalleryPreview";
import { GroupFlightSearch } from "@/components/home/GroupFlightSearch";
import { HeroSection } from "@/components/home/HeroSection";
import { ServicesSection } from "@/components/home/ServicesSection";
import { ReviewsSection } from "@/components/reviews/ReviewsSection";
import { TicketsPreview } from "@/components/home/TicketsPreview";
import { dataProvider } from "@/lib/data-provider";

export default async function HomePage() {
  const [announcements, flyers, destinations, umrahPackages, tickets, airlines, galleryImages, services, blogPosts] =
    await Promise.all([
      dataProvider.getAnnouncements(),
      dataProvider.getFlyers(),
      dataProvider.getDestinations(),
      dataProvider.getFeaturedUmrahPackages(),
      dataProvider.getTickets(),
      dataProvider.getAirlines(),
      dataProvider.getGalleryImages(),
      dataProvider.getServices(),
      dataProvider.getBlogPosts(),
    ]);

  return (
    <>
      <HeroSection />
      <AnnouncementTicker announcements={announcements} />
      <FlyersCarousel flyers={flyers} />
      <GroupFlightSearch />
      <DestinationGrid destinations={destinations} />
      <FeaturedUmrahPackages packages={umrahPackages} />
      <TicketsPreview tickets={tickets.filter((t) => t.status !== "sold_out").slice(0, 6)} />
      <CorporateTravelCTA />
      <ServicesSection services={services} />
      <AirlinePartners airlines={airlines} />
      <ReviewsSection />
      <GalleryPreview images={galleryImages} />
      <BlogPreview posts={blogPosts} />
      <ContactCTA />
    </>
  );
}
