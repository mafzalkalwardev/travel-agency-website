import { createPageMetadata } from "@/lib/metadata";
import { PAGE_SEO } from "@/lib/seo";
import { PackageCard } from "@/components/shared/PackageCard";
import { MotionStagger, MotionStaggerItem } from "@/components/motion/MotionStagger";
import { MotionSection } from "@/components/motion/MotionSection";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { PageHero } from "@/components/shared/PageHero";
import { PAGE_HEROES } from "@/lib/page-heroes";
import { getCachedTourPackages } from "@/lib/inventory-public-cache";

export const revalidate = 600;

export const metadata = createPageMetadata({
  title: PAGE_SEO.tourPackages.title,
  description: PAGE_SEO.tourPackages.description,
  path: PAGE_SEO.tourPackages.path,
  keywords: PAGE_SEO.tourPackages.keywords,
});

export default async function TourPackagesPage() {
  const packages = await getCachedTourPackages();

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
