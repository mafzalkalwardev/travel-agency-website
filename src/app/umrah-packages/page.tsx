import { Suspense } from "react";
import { createPageMetadata } from "@/lib/metadata";
import { UmrahPackagesPageClient } from "@/components/packages/UmrahPackagesPageClient";
import { InquiryForm } from "@/components/forms/InquiryForm";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { PageHero } from "@/components/shared/PageHero";
import { PAGE_HEROES } from "@/lib/page-heroes";
import { dataProvider } from "@/lib/data-provider";
import { SITE } from "@/lib/constants";

// Live Travel Line inventory — must not be frozen at build time.
export const dynamic = "force-dynamic";

export const metadata = createPageMetadata({
  title: "Umrah Packages",
  description: `Book Umrah packages with ${SITE.name} — live flights, hotels, and seat availability synced from Travel Line.`,
  path: "/umrah-packages/",
});

export default async function UmrahPackagesPage() {
  const packages = await dataProvider.getUmrahPackages();
  const active = packages.filter((p) => p.status === "active");

  return (
    <>
      <PageHero
        {...PAGE_HEROES.umrah}
        badge={`${active.length} Live Packages`}
        subtitle="All-inclusive flight & hotel packages — real inventory synced from our supplier"
      />

      <section className="section-padding">
        <div className="container-wide">
          <Suspense fallback={<div className="text-center text-muted-foreground">Loading packages...</div>}>
            <UmrahPackagesPageClient packages={active} />
          </Suspense>
        </div>
      </section>

      <section className="section-padding bg-navy/5">
        <div className="container-wide max-w-2xl">
          <SectionHeading title="Umrah Inquiry Form" subtitle="Tell us your requirements and we will contact you on WhatsApp" />
          <InquiryForm />
        </div>
      </section>
    </>
  );
}
