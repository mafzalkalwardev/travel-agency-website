import { Suspense } from "react";
import { notFound } from "next/navigation";
import { createPageMetadata } from "@/lib/metadata";
import { GroupFlightsPageClient } from "@/components/tickets/GroupFlightsPageClient";
import { TicketsSearchBar } from "@/components/tickets/TicketsSearchBar";
import { PageHero } from "@/components/shared/PageHero";
import { SITE } from "@/lib/constants";
import { dataProvider } from "@/lib/data-provider";
import { getExploreCategory } from "@/lib/travelline/categories";

interface PageProps {
  params: Promise<{ category: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { category: slug } = await params;
  const category = getExploreCategory(slug);
  if (!category || category.kind !== "group-flights") {
    return createPageMetadata({ title: "Group Flights", path: "/group-flights/" });
  }
  return createPageMetadata({
    title: category.label,
    description: `Browse live ${category.label} from ${SITE.name} — real-time seats and agent fares synced from Travel Line.`,
    path: `/group-flights/${slug}/`,
  });
}

export default async function GroupFlightsCategoryPage({ params }: PageProps) {
  const { category: slug } = await params;
  const category = getExploreCategory(slug);
  if (!category || category.kind !== "group-flights" || !category.apiCategory) {
    notFound();
  }

  const allTickets = await dataProvider.getTickets();
  const tickets = allTickets.filter((t) => t.groupCategory === category.apiCategory);

  return (
    <>
      <PageHero
        title={category.label}
        subtitle={`Live group inventory · ${tickets.length} flights available`}
        backgroundImage="/assets/heroes/tickets.jpg"
        badge="Agent Portal · Travel Line Sync"
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
