import { createPageMetadata } from "@/lib/metadata";
import { ContactForm } from "@/components/shared/ContactForm";
import { PageHero } from "@/components/shared/PageHero";
import { PAGE_HEROES } from "@/lib/page-heroes";
import { SITE } from "@/lib/constants";
import { Users, FileCheck, Headphones } from "lucide-react";

export const metadata = createPageMetadata({
  title: "Corporate Travel",
  description: `Corporate travel management for NGOs and companies by ${SITE.name}.`,
  path: "/corporate-travel/",
});

const features = [
  { icon: Users, title: "Dedicated Manager", desc: "One contact for all group travel." },
  { icon: FileCheck, title: "Group Rates", desc: "Negotiated fares for organizations." },
  { icon: Headphones, title: "24/7 WhatsApp", desc: "Urgent changes handled promptly." },
];

export default function CorporateTravelPage() {
  return (
    <>
      <PageHero {...PAGE_HEROES.corporate} />

      <section className="section-padding">
        <div className="container-wide">
          <div className="grid gap-8 lg:grid-cols-2">
            <div>
              <p className="mb-6 text-sm text-muted-foreground">
                Group ticketing, visa coordination, and dedicated support for NGOs, companies,
                schools, and delegations.
              </p>
              <div className="space-y-3">
                {features.map((f) => (
                  <div key={f.title} className="flex gap-3 rounded-lg border border-border/60 p-3">
                    <f.icon className="h-5 w-5 shrink-0 text-gold" />
                    <div>
                      <h3 className="text-sm font-semibold text-navy">{f.title}</h3>
                      <p className="text-xs text-muted-foreground">{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <ContactForm />
          </div>
        </div>
      </section>
    </>
  );
}
