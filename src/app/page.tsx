import { AnnouncementTicker } from "@/components/home/AnnouncementTicker";
import { DestinationGrid } from "@/components/home/DestinationGrid";
import { HeroSection } from "@/components/home/HeroSection";
import { SubAgentCTA } from "@/components/home/SubAgentCTA";
import { TicketsPreview } from "@/components/home/TicketsPreview";
import { WhyChooseUs } from "@/components/home/WhyChooseUs";
import { FlightPathStory } from "@/components/motion/FlightPathStory";
import { dataProvider } from "@/lib/data-provider";

export default async function HomePage() {
  const [announcements, destinations, tickets] = await Promise.all([
    dataProvider.getAnnouncements(),
    dataProvider.getDestinations(),
    dataProvider.getTickets(),
  ]);

  return (
    <>
      <HeroSection />
      <AnnouncementTicker announcements={announcements} />
      <DestinationGrid destinations={destinations} />
      <TicketsPreview tickets={tickets.filter((t) => t.status !== "sold_out")} />
      <WhyChooseUs />
      <FlightPathStory />
      <SubAgentCTA />
    </>
  );
}
