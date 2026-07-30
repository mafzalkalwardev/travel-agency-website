import { Suspense } from "react";
import { notFound } from "next/navigation";
import { createPageMetadata } from "@/lib/metadata";
import { PAGE_SEO } from "@/lib/seo";
import { GroupFlightsPageClient } from "@/components/tickets/GroupFlightsPageClient";
import { TicketsSearchBar } from "@/components/tickets/TicketsSearchBar";
import { PageHero } from "@/components/shared/PageHero";
import { SITE } from "@/lib/constants";
import { dataProvider } from "@/lib/data-provider";
import { getExploreCategory } from "@/lib/travelline/categories";
import { toTicketListItems } from "@/lib/ticket-list";

export const revalidate = 60;

interface PageProps {
  params: Promise<{ category: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { category: slug } = await params;
  const category = getExploreCategory(slug);
  if (!category || category.kind !== "group-flights") {
    return createPageMetadata({
      title: PAGE_SEO.groupFlights.title,
      description: PAGE_SEO.groupFlights.description,
      path: PAGE_SEO.groupFlights.path,
      keywords: PAGE_SEO.groupFlights.keywords,
    });
  }

  const intentTitle = `${category.label} | Group Ticket Booking`;
  const intentDescription = `Book ${category.label} online with ${SITE.name}. Live group flight ticket booking, seats and fares for ${category.country} group travels — agent and traveler ticketing from Pakistan.`;

  return createPageMetadata({
    title: intentTitle,
    description: intentDescription,
    path: `/group-flights/${slug}/`,
    keywords: [
      ...PAGE_SEO.groupFlights.keywords,
      category.label,
      `${category.country} group tickets`,
      `${category.country} ticket booking`,
      "group travels",
      "ticket booking",
    ],
  });
}

export default async function GroupFlightsCategoryPage({ params }: PageProps) {
  const { category: slug } = await params;
  const category = getExploreCategory(slug);
  if (!category || category.kind !== "group-flights" || !category.apiCategory) {
    notFound();
  }

  const tickets = toTicketListItems(
    await dataProvider.getTickets({ groupCategory: category.apiCategory })
  );

  return (
    <>
      <PageHero
        title={category.label}
        subtitle={`Live group inventory · ${tickets.length} flights available`}
        backgroundImage="/assets/heroes/tickets.jpg"
        badge="Agent Portal · Live Inventory"
        lite
      />

      <section className="relative z-20 -mt-14 pb-4">
        <div className="container-wide">
          <Suspense fallback={null}>
            <TicketsSearchBar basePath={`/group-flights/${slug}/`} />
          </Suspense>
        </div>
      </section>

      <section className="section-padding pt-6">
        <div className="container-wide">
          <Suspense fallback={<div className="text-center text-muted-foreground">Loading flights...</div>}>
            <GroupFlightsPageClient tickets={tickets} categorySlug={slug} />
          </Suspense>
        </div>
      </section>
    </>
  );
}
