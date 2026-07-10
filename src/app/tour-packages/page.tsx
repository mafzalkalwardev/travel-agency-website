import { createPageMetadata } from "@/lib/metadata";
import { PackageCard } from "@/components/shared/PackageCard";
import { PageHero } from "@/components/shared/PageHero";
import { PAGE_HEROES } from "@/lib/page-heroes";
import { dataProvider } from "@/lib/data-provider";
import { SITE } from "@/lib/constants";

export const metadata = createPageMetadata({
  title: "Tour Packages",
  description: `Holiday and tour packages by ${SITE.name} — Dubai, Turkey, Malaysia and more.`,
  path: "/tour-packages/",
});

export default async function TourPackagesPage() {
  const packages = await dataProvider.getTourPackages();

  return (
    <>
      <PageHero {...PAGE_HEROES.tours} badge={packages.length ? `${packages.length} packages` : undefined} />

      <section className="section-padding">
        <div className="container-wide">
          {packages.length ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {packages.map((pkg) => (
                <PackageCard key={pkg.id} pkg={pkg} bookLabel="Book" />
              ))}
            </div>
          ) : (
            <p className="text-center text-sm text-muted-foreground">
              No tour packages right now. Contact us on WhatsApp for custom itineraries.
            </p>
          )}
        </div>
      </section>
    </>
  );
}
