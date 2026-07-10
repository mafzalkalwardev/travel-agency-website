import { Suspense } from "react";
import { createPageMetadata } from "@/lib/metadata";
import { TicketsPageClient } from "@/components/tickets/TicketsPageClient";
import { TicketsSearchBar } from "@/components/tickets/TicketsSearchBar";
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
    <section className="section-padding">
      <div className="container-wide">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-navy md:text-3xl">Group Flight Tickets</h1>
          <p className="mt-1 text-sm text-muted-foreground">Search live inventory and book on WhatsApp</p>
        </div>

        <Suspense fallback={null}>
          <TicketsSearchBar className="mb-6" />
        </Suspense>

        <Suspense fallback={<div className="text-sm text-muted-foreground">Loading tickets...</div>}>
          <TicketsPageClient tickets={tickets} />
        </Suspense>
      </div>
    </section>
  );
}
