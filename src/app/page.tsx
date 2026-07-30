import { AnnouncementTicker } from "@/components/home/AnnouncementTicker";
import { DeferredFlightPathStory } from "@/components/home/DeferredFlightPathStory";
import { DestinationGrid } from "@/components/home/DestinationGrid";
import { HeroSection } from "@/components/home/HeroSection";
import { SubAgentCTA } from "@/components/home/SubAgentCTA";
import { TicketsPreview } from "@/components/home/TicketsPreview";
import { WhyChooseUs } from "@/components/home/WhyChooseUs";
import { buildExploreDestinations } from "@/lib/explore-destinations";
import { dataProvider } from "@/lib/data-provider";
import { resolveHeroPosters } from "@/lib/hero-posters";
import { toTicketListItems } from "@/lib/ticket-list";

// Home embeds live ticket inventory — cache the page and refresh every 60s
// (ISR) so it stays fast while sync updates still surface within a minute.
export const revalidate = 60;

export default async function HomePage() {
  // One ticket fetch shared by destinations + preview (avoids double inventory round-trip).
  const [announcements, tickets, umrahPackages, flyers] = await Promise.all([
    dataProvider.getAnnouncements(),
    dataProvider.getTickets(),
    dataProvider.getUmrahPackages(),
    dataProvider.getFlyers(),
  ]);
  const destinations = buildExploreDestinations(tickets, umrahPackages);
  const previewTickets = toTicketListItems(
    tickets.filter((t) => t.status !== "sold_out").slice(0, 4)
  );
  const heroPosters = resolveHeroPosters(flyers.map((f) => f.image));

  return (
    <>
      <HeroSection posters={heroPosters} />
      <AnnouncementTicker announcements={announcements} />
      <DestinationGrid destinations={destinations} />
      <TicketsPreview tickets={previewTickets} />
      <WhyChooseUs />
      <DeferredFlightPathStory />
      <SubAgentCTA />
    </>
  );
}
