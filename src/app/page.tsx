import { AnnouncementTicker } from "@/components/home/AnnouncementTicker";
import { DeferredFlightPathStory } from "@/components/home/DeferredFlightPathStory";
import { DestinationGrid } from "@/components/home/DestinationGrid";
import { HeroSection } from "@/components/home/HeroSection";
import { PeshawarLocalStrip } from "@/components/home/PeshawarLocalStrip";
import { SubAgentCTA } from "@/components/home/SubAgentCTA";
import { TicketsPreview } from "@/components/home/TicketsPreview";
import { WhyChooseUs } from "@/components/home/WhyChooseUs";
import { buildExploreDestinations } from "@/lib/explore-destinations";
import {
  getCachedAnnouncements,
  getCachedFlyers,
  getCachedTickets,
  getCachedUmrahPackages,
} from "@/lib/inventory-public-cache";
import { resolveHeroPosters } from "@/lib/hero-posters";
import { toTicketListItems } from "@/lib/ticket-list";

// Public inventory is cached + revalidated after each sync.
export const revalidate = 600;

export default async function HomePage() {
  const [announcements, tickets, umrahPackages, flyers] = await Promise.all([
    getCachedAnnouncements(),
    getCachedTickets(),
    getCachedUmrahPackages(),
    getCachedFlyers(),
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
      <PeshawarLocalStrip />
      <DestinationGrid destinations={destinations} />
      <TicketsPreview tickets={previewTickets} />
      <WhyChooseUs />
      <DeferredFlightPathStory />
      <SubAgentCTA />
    </>
  );
}
