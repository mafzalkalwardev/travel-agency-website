import Link from "next/link";
import { createPageMetadata } from "@/lib/metadata";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { PageHero } from "@/components/shared/PageHero";
import { PAGE_HEROES } from "@/lib/page-heroes";
import { dataProvider } from "@/lib/data-provider";
import { SITE, TRUST_TEXT } from "@/lib/constants";
import { CheckCircle } from "lucide-react";
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
  { name: "Thailand E-Visa", desc: "Tourist e-visa processing assistance" },
  { name: "Malaysia E-Visa", desc: "Fast Malaysia visit visa support" },
  { name: "UAE Visit Visa", desc: "UAE visit visa for tourism and business" },
  { name: "Saudi Travel Assistance", desc: "Umrah and visit-related travel support" },
  { name: "Other Countries", desc: "Contact us for additional destinations" },
];

export default async function ServicesPage() {
  const services = await dataProvider.getServices();

  return (
    <>
      <PageHero {...PAGE_HEROES.services} />

      <section className="section-padding">
        <div className="container-wide">
          <div className="mb-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {TRUST_TEXT.map((t) => (
              <div key={t} className="flex items-start gap-2 rounded-xl border border-gold/20 bg-gold/5 p-4 text-sm">
                <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-gold" /> {t}
              </div>
            ))}
          </div>
          <SectionHeading title="What We Offer" />
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => {
              const Icon = iconMap[service.icon] || Plane;
              return (
                <Link key={service.id} href={service.href} className="card-premium group p-6">
                  <Icon className="h-10 w-10 text-gold" />
                  <h3 className="mt-4 font-heading text-lg font-semibold text-navy group-hover:text-royal">{service.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{service.description}</p>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section id="visit-visa" className="section-padding bg-light-bg">
        <div className="container-wide">
          <SectionHeading title="Visit Visa Services" subtitle="E-visas and visit visa assistance for popular destinations" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {visaServices.map((v) => (
              <div key={v.name} className="card-premium p-5">
                <h3 className="font-heading font-semibold text-navy">{v.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{v.desc}</p>
                <Link href="/inquiry/" className="mt-3 inline-block text-sm font-medium text-royal hover:text-gold">Apply / Inquire →</Link>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
