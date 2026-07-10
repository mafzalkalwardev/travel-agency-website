import { createPageMetadata } from "@/lib/metadata";
import { ContactForm } from "@/components/shared/ContactForm";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { PageHero } from "@/components/shared/PageHero";
import { PAGE_HEROES } from "@/lib/page-heroes";
import { SITE } from "@/lib/constants";
import { Building2, Clock, FileCheck, Headphones, Users } from "lucide-react";

export const metadata = createPageMetadata({
  title: "Corporate Travel",
  description: `Corporate travel management for NGOs and companies by ${SITE.name} — group tickets, billing and 24/7 support.`,
  path: "/corporate-travel/",
});

const features = [
  { icon: Users, title: "Dedicated Account Manager", desc: "A single point of contact for all your organization's travel needs." },
  { icon: FileCheck, title: "Consolidated Invoicing", desc: "Simplified billing with flexible payment terms for registered organizations." },
  { icon: Building2, title: "NGO & Corporate Rates", desc: "Access to exclusive group fares and negotiated corporate rates." },
  { icon: Headphones, title: "24/7 WhatsApp Support", desc: "Urgent travel changes handled promptly, any time of day." },
  { icon: Clock, title: "Mission Travel Expertise", desc: "Experience with humanitarian, diplomatic and business travel requirements." },
];

export default function CorporateTravelPage() {
  return (
    <>
      <PageHero {...PAGE_HEROES.corporate} />

      <section className="section-padding">
        <div className="container-wide">
          <div className="grid gap-12 lg:grid-cols-2">
            <div>
              <SectionHeading title="Why Choose Us?" align="left" />
              <p className="mb-8 text-muted-foreground">
                Al Qibla Air Services understands the unique travel needs of NGOs, humanitarian organizations,
                and corporate clients. We provide reliable group ticketing, visa coordination, and dedicated
                support to keep your team moving efficiently.
              </p>
              <div className="space-y-4">
                {features.map((f) => (
                  <div key={f.title} className="flex gap-4 rounded-lg border border-border/60 p-4">
                    <f.icon className="h-8 w-8 shrink-0 text-gold" />
                    <div>
                      <h3 className="font-semibold text-navy">{f.title}</h3>
                      <p className="text-sm text-muted-foreground">{f.desc}</p>
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
