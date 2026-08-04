import { Suspense } from "react";
import { createPageMetadata } from "@/lib/metadata";
import { PAGE_SEO } from "@/lib/seo";
import { TicketsPageClient } from "@/components/tickets/TicketsPageClient";
import { TicketsSearchBar } from "@/components/tickets/TicketsSearchBar";
import { PageHero } from "@/components/shared/PageHero";
import { PAGE_HEROES } from "@/lib/page-heroes";
import { toTicketListItems } from "@/lib/ticket-list";
import { getCachedTickets } from "@/lib/inventory-public-cache";

// ISR + tagged cache; sync calls /api/cron/revalidate-inventory after scrape.
export const revalidate = 600;

export const metadata = createPageMetadata({
  title: PAGE_SEO.availableTickets.title,
  description: PAGE_SEO.availableTickets.description,
  path: PAGE_SEO.availableTickets.path,
  keywords: PAGE_SEO.availableTickets.keywords,
});

export default async function AvailableTicketsPage() {
  const tickets = toTicketListItems(await getCachedTickets());

  return (
    <>
      <PageHero {...PAGE_HEROES.tickets} badge="Agent Portal · Live Inventory" lite />

      <section className="relative z-20 -mt-14 pb-4">
        <div className="container-wide">
          <Suspense fallback={null}>
            <TicketsSearchBar />
          </Suspense>
        </div>
      </section>

      <section className="section-padding pt-6">
        <div className="container-wide">
          <Suspense fallback={<div className="text-center text-muted-foreground">Loading tickets...</div>}>
            <TicketsPageClient tickets={tickets} />
          </Suspense>
        </div>
      </section>
    </>
  );
}
