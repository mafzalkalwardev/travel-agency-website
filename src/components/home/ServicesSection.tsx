import Link from "next/link";
import { ArrowRight, Building2, Car, FileText, Globe, Hotel, Palmtree, Plane, Shield, Sparkles, Users, type LucideIcon } from "lucide-react";
import { SectionHeading } from "@/components/shared/SectionHeading";
import type { Service } from "@/types";

const iconMap: Record<string, LucideIcon> = {
  Plane, Mosque: Sparkles, FileText, Hotel, Shield, Car, Building2, Palmtree, Users, Globe,
};

interface ServicesSectionProps {
  services: Service[];
}

export function ServicesSection({ services }: ServicesSectionProps) {
  return (
    <section className="section-padding">
      <div className="container-wide">
        <SectionHeading title="Our Services" subtitle="Everything you need for your journey" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => {
            const Icon = iconMap[service.icon] || Plane;
            return (
              <Link
                key={service.id}
                href={service.href}
                className="card-premium group flex items-start gap-3 p-4"
              >
                <Icon className="mt-0.5 h-5 w-5 shrink-0 text-gold" />
                <div>
                  <h3 className="text-sm font-semibold text-navy group-hover:text-royal">{service.title}</h3>
                  <p className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">{service.description}</p>
                </div>
              </Link>
            );
          })}
        </div>
        <div className="mt-6 text-center">
          <Link href="/services/" className="inline-flex items-center text-sm font-medium text-royal hover:text-gold">
            View all services <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
