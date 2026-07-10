import Link from "next/link";
import { createPageMetadata } from "@/lib/metadata";
import { PageHero } from "@/components/shared/PageHero";
import { PAGE_HEROES } from "@/lib/page-heroes";
import { dataProvider } from "@/lib/data-provider";
import { SITE } from "@/lib/constants";
import { Plane, Sparkles, FileText, Hotel, Shield, Car, Building2, Palmtree, Users, Globe, type LucideIcon } from "lucide-react";

export const metadata = createPageMetadata({
  title: "Services",
  description: `Travel services by ${SITE.name} — ticketing, Umrah, visas, hotels, insurance and corporate travel.`,
  path: "/services/",
});

const iconMap: Record<string, LucideIcon> = {
  Plane, Mosque: Sparkles, FileText, Hotel, Shield, Car, Building2, Palmtree, Users, Globe,
};

const visaServices = [
  { name: "Thailand E-Visa", href: "/inquiry/" },
  { name: "Malaysia E-Visa", href: "/inquiry/" },
  { name: "UAE Visit Visa", href: "/inquiry/" },
  { name: "Saudi Travel", href: "/inquiry/" },
];

export default async function ServicesPage() {
  const services = await dataProvider.getServices();

  return (
    <>
      <PageHero {...PAGE_HEROES.services} />

      <section className="section-padding">
        <div className="container-wide">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => {
              const Icon = iconMap[service.icon] || Plane;
              return (
                <Link key={service.id} href={service.href} className="card-premium flex items-start gap-3 p-4">
                  <Icon className="mt-0.5 h-5 w-5 shrink-0 text-gold" />
                  <div>
                    <h3 className="text-sm font-semibold text-navy">{service.title}</h3>
                    <p className="mt-0.5 text-xs text-muted-foreground">{service.description}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section id="visit-visa" className="section-padding bg-light-bg">
        <div className="container-wide">
          <h2 className="mb-4 text-lg font-semibold text-navy">Visit Visas</h2>
          <div className="flex flex-wrap gap-2">
            {visaServices.map((v) => (
              <Link
                key={v.name}
                href={v.href}
                className="rounded-full border border-border/60 bg-white px-4 py-2 text-sm text-navy hover:border-gold"
              >
                {v.name}
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
