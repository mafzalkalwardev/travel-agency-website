import { notFound } from "next/navigation";
import { EXPLORE_CATEGORIES } from "@/lib/travelline/categories";
import { loadMirrorSnapshot } from "@/lib/travelline-mirror/load";
import { getCategoryFlights } from "@/lib/travelline-mirror/views";
import { MirrorGroupsClient } from "@/components/travelline-mirror/MirrorGroupsClient";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function MirrorGroupsPage({ params }: PageProps) {
  const { slug } = await params;
  const category = EXPLORE_CATEGORIES.find((c) => c.slug === slug && c.kind === "group-flights");
  if (!category?.apiCategory) notFound();

  const snapshot = loadMirrorSnapshot();
  if (!snapshot) {
    return (
      <div className="px-4 py-20 text-center text-white/60">
        Run <code className="text-white">npm run scrape-mirror</code> first
      </div>
    );
  }

  const flights = getCategoryFlights(snapshot, category.apiCategory);

  return (
    <MirrorGroupsClient
      categoryLabel={category.label}
      categorySlug={slug}
      apiCategory={category.apiCategory}
      flights={flights}
      scrapedAt={snapshot.scrapedAt}
    />
  );
}
