import { Suspense } from "react";
import { createPageMetadata } from "@/lib/metadata";
import { PAGE_SEO } from "@/lib/seo";
import { UmrahPackagesPageClient } from "@/components/packages/UmrahPackagesPageClient";
import { InquiryForm } from "@/components/forms/InquiryForm";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { PageHero } from "@/components/shared/PageHero";
import { PAGE_HEROES } from "@/lib/page-heroes";
import { getCachedUmrahPackages } from "@/lib/inventory-public-cache";

export const revalidate = 600;

export const metadata = createPageMetadata({
  title: PAGE_SEO.umrahPackages.title,
  description: PAGE_SEO.umrahPackages.description,
  path: PAGE_SEO.umrahPackages.path,
  keywords: PAGE_SEO.umrahPackages.keywords,
});

export default async function UmrahPackagesPage() {
  const packages = await getCachedUmrahPackages();
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
