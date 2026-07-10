import { createPageMetadata } from "@/lib/metadata";
import { UmrahPackageCard } from "@/components/cards/UmrahPackageCard";
import { InquiryForm } from "@/components/forms/InquiryForm";
import { MotionStagger, MotionStaggerItem } from "@/components/motion/MotionStagger";
import { MotionSection } from "@/components/motion/MotionSection";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { PageHero } from "@/components/shared/PageHero";
import { PAGE_HEROES } from "@/lib/page-heroes";
import { dataProvider } from "@/lib/data-provider";
import { SITE } from "@/lib/constants";
import type { UmrahCategory } from "@/types";

export const metadata = createPageMetadata({
  title: "Umrah Packages",
  description: `Book Umrah packages with ${SITE.name} — economy to premium, group and corporate options.`,
  path: "/umrah-packages/",
});

const sections: { title: string; category: UmrahCategory }[] = [
  { title: "Economy Umrah Packages", category: "economy" },
  { title: "Standard Umrah Packages", category: "standard" },
  { title: "Premium Umrah Packages", category: "premium" },
  { title: "Group Umrah Packages", category: "group" },
  { title: "Family Umrah Packages", category: "family" },
  { title: "Corporate / NGO Umrah Groups", category: "corporate" },
];

export default async function UmrahPackagesPage() {
  const packages = await dataProvider.getUmrahPackages();
  const featured = packages.filter((p) => p.featured).slice(0, 6);
  const categorized = sections
    .map(({ title, category }) => ({
      title,
      category,
      items: packages.filter((p) => p.category === category),
    }))
    .filter((section) => section.items.length > 0);

  return (
    <>
      <PageHero
        {...PAGE_HEROES.umrah}
        badge={`${packages.length} Live Packages`}
      />

      {packages.length > 0 && (
        <section className="section-padding">
          <div className="container-wide">
            <MotionSection>
              <SectionHeading
                title="Live Umrah Packages"
                subtitle="Real inventory synced from our supplier — flights, hotels, and seat availability"
                align="left"
              />
            </MotionSection>
            <MotionStagger className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {(featured.length ? featured : packages.slice(0, 9)).map((pkg) => (
                <MotionStaggerItem key={pkg.id}>
                  <UmrahPackageCard pkg={pkg} />
                </MotionStaggerItem>
              ))}
            </MotionStagger>
          </div>
        </section>
      )}

      {categorized.map(({ title, category, items }) => (
        <section key={category} className="section-padding even:bg-light-bg">
          <div className="container-wide">
            <SectionHeading title={title} align="left" />
            <MotionStagger className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {items.map((pkg) => (
                <MotionStaggerItem key={pkg.id}>
                  <UmrahPackageCard pkg={pkg} />
                </MotionStaggerItem>
              ))}
            </MotionStagger>
          </div>
        </section>
      ))}

      <section className="section-padding bg-navy/5">
        <div className="container-wide max-w-2xl">
          <SectionHeading title="Umrah Inquiry Form" subtitle="Tell us your requirements and we will contact you on WhatsApp" />
          <InquiryForm />
        </div>
      </section>
    </>
  );
}
