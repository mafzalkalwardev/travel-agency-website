import { Suspense } from "react";
import { createPageMetadata } from "@/lib/metadata";
import { TicketsPageClient } from "@/components/tickets/TicketsPageClient";
import { PageHero } from "@/components/shared/PageHero";
import { PAGE_HEROES } from "@/lib/page-heroes";
import { SITE } from "@/lib/constants";
import { dataProvider } from "@/lib/data-provider";

export const metadata = createPageMetadata({
  title: "Available Tickets",
  description: `Browse group flight tickets and fares from ${SITE.name} — PIA, Saudia, Emirates, Airblue and more.`,
  path: "/available-tickets/",
});

export default async function AvailableTicketsPage() {
  const tickets = await dataProvider.getTickets();

  return (
    <>
      <PageHero {...PAGE_HEROES.tickets} badge="Group Flights & Umrah Routes" />

      <section className="section-padding">
        <div className="container-wide">
          <Suspense fallback={<div className="text-center text-muted-foreground">Loading tickets...</div>}>
            <TicketsPageClient tickets={tickets} />
          </Suspense>
        </div>
      </section>
    </>
  );
}
