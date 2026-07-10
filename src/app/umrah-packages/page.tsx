import Link from "next/link";
import { createPageMetadata } from "@/lib/metadata";
import { UmrahPackageCard } from "@/components/cards/UmrahPackageCard";
import { PageHero } from "@/components/shared/PageHero";
import { PAGE_HEROES } from "@/lib/page-heroes";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { dataProvider } from "@/lib/data-provider";
import { SITE } from "@/lib/constants";

export const metadata = createPageMetadata({
  title: "Umrah Packages",
  description: `Book Umrah packages with ${SITE.name} — economy to premium, group and corporate options.`,
  path: "/umrah-packages/",
});

export default async function UmrahPackagesPage() {
  const packages = await dataProvider.getUmrahPackages();

  return (
    <>
      <PageHero
        {...PAGE_HEROES.umrah}
        badge={packages.length > 0 ? `${packages.length} packages available` : undefined}
      />

      <section className="section-padding">
        <div className="container-wide">
          {packages.length === 0 ? (
            <p className="text-center text-muted-foreground">No packages available right now. Contact us on WhatsApp.</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {packages.map((pkg) => (
                <UmrahPackageCard key={pkg.id} pkg={pkg} />
              ))}
            </div>
          )}

          <div className="mt-8 text-center">
            <Link href="/inquiry/" className={cn(buttonVariants({ variant: "outlineDark" }))}>
              Custom Umrah Inquiry
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
