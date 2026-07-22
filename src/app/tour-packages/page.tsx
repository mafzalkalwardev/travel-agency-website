import { createPageMetadata } from "@/lib/metadata";
import { PackageCard } from "@/components/shared/PackageCard";
import { MotionStagger, MotionStaggerItem } from "@/components/motion/MotionStagger";
import { MotionSection } from "@/components/motion/MotionSection";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { PageHero } from "@/components/shared/PageHero";
import { PAGE_HEROES } from "@/lib/page-heroes";
import { dataProvider } from "@/lib/data-provider";
import { SITE } from "@/lib/constants";

export const dynamic = "force-dynamic";

export const metadata = createPageMetadata({
  title: "Tour Packages",
  description: `Holiday and tour packages by ${SITE.name} — Dubai, Turkey, Malaysia and domestic destinations.`,
  path: "/tour-packages/",
});

export default async function TourPackagesPage() {
  const packages = await dataProvider.getTourPackages();

  return (
    <>
      <PageHero {...PAGE_HEROES.tours} badge={packages.length ? `${packages.length} Packages` : undefined} />

      <section className="section-padding">
        <div className="container-wide">
          <MotionSection>
            <SectionHeading
              title="Holiday Packages"
              subtitle="Flights, hotels and tours — request a booking when you're ready"
            />
          </MotionSection>
          {packages.length ? (
            <MotionStagger className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {packages.map((pkg) => (
                <MotionStaggerItem key={pkg.id}>
                  <PackageCard pkg={pkg} bookLabel="Book Tour" />
                </MotionStaggerItem>
              ))}
            </MotionStagger>
          ) : (
            <p className="text-center text-muted-foreground">No tour packages available right now. Contact us on WhatsApp for custom itineraries.</p>
          )}
        </div>
      </section>
    </>
  );
}
