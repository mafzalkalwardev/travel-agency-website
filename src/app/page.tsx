import { AnnouncementTicker } from "@/components/home/AnnouncementTicker";
import { ContactCTA } from "@/components/home/ContactCTA";
import { FeaturedUmrahPackages } from "@/components/home/FeaturedUmrahPackages";
import { GroupFlightSearch } from "@/components/home/GroupFlightSearch";
import { HeroSection } from "@/components/home/HeroSection";
import { ServicesSection } from "@/components/home/ServicesSection";
import { ReviewsSection } from "@/components/reviews/ReviewsSection";
import { TicketsPreview } from "@/components/home/TicketsPreview";
import { dataProvider } from "@/lib/data-provider";

export default async function HomePage() {
  const [announcements, umrahPackages, tickets, services] = await Promise.all([
    dataProvider.getAnnouncements(),
    dataProvider.getFeaturedUmrahPackages(),
    dataProvider.getTickets(),
    dataProvider.getServices(),
  ]);

  const liveTickets = tickets.filter((t) => t.status !== "sold_out").slice(0, 3);

  return (
    <>
      <HeroSection />
      {announcements.length > 0 && <AnnouncementTicker announcements={announcements} />}
      <GroupFlightSearch />
      <TicketsPreview tickets={liveTickets} />
      <FeaturedUmrahPackages packages={umrahPackages.slice(0, 3)} />
      <ServicesSection services={services.slice(0, 6)} />
      <ReviewsSection limit={3} />
      <ContactCTA />
    </>
  );
}
