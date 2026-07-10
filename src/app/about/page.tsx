import { createPageMetadata } from "@/lib/metadata";
import { SectionHeading } from "@/components/shared/SectionHeading";
import { PageHero } from "@/components/shared/PageHero";
import { PAGE_HEROES } from "@/lib/page-heroes";
import { OFFICES, SITE, TRUST_TEXT } from "@/lib/constants";
import { CheckCircle, Globe, Heart, Shield } from "lucide-react";

export const metadata = createPageMetadata({
  title: "About Us",
  description: `Learn about ${SITE.name} — your trusted travel partner for Umrah, group tickets and corporate travel in Islamabad and worldwide.`,
  path: "/about/",
});

const values = [
  { icon: Heart, title: "Customer First", desc: "We prioritize your comfort, safety and spiritual journey above all." },
  { icon: Shield, title: "Trust & Integrity", desc: "Transparent pricing and honest advice on every booking." },
  { icon: Globe, title: "Global Reach", desc: "Serving clients across Pakistan, UAE, Saudi Arabia, Afghanistan and worldwide." },
  { icon: CheckCircle, title: "Excellence", desc: "Premium service with attention to every detail of your travel." },
];

export default function AboutPage() {
  return (
    <>
      <PageHero {...PAGE_HEROES.about} />

      <section className="section-padding">
        <div className="container-wide">
          <div className="grid gap-12 lg:grid-cols-2">
            <div>
              <SectionHeading title="Our Story" align="left" />
              <div className="space-y-4 text-muted-foreground">
                <p>
                  {SITE.name} is a premier travel agency with offices in Peshawar and Islamabad. We specialize in
                  Umrah packages, group air ticketing, and corporate travel management for NGOs,
                  companies, and families across Pakistan and the Gulf region.
                </p>
                <p>
                  With partnerships across 30+ airlines including PIA, Saudia, Emirates, Qatar Airways,
                  and many more, we offer competitive group fares and complete travel solutions under one roof.
                </p>
                <p>
                  Whether you are planning a spiritual journey to the Holy Lands, organizing corporate travel
                  for your organization, or booking a family holiday, our experienced team is here to serve you
                  with dedication and professionalism.
                </p>
              </div>
            </div>
            <div className="rounded-2xl bg-gradient-to-br from-navy to-navy-light p-8 text-white">
              <h3 className="font-heading text-2xl font-semibold text-gold">Our Offices</h3>
              <ul className="mt-6 space-y-4 text-sm">
                <li>
                  <p className="font-medium text-white">{OFFICES.headOffice.label}</p>
                  <p className="text-white/70">{OFFICES.headOffice.address}</p>
                </li>
                <li>
                  <p className="font-medium text-white">{OFFICES.islamabad.label}</p>
                  <p className="text-white/70">{OFFICES.islamabad.address}</p>
                </li>
              </ul>
              <ul className="mt-6 space-y-2 border-t border-white/10 pt-4 text-xs text-white/60">
                {TRUST_TEXT.map((t) => (
                  <li key={t}>• {t}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="section-padding bg-secondary/50">
        <div className="container-wide">
          <SectionHeading title="Our Values" subtitle="The principles that guide everything we do" />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((v) => (
              <div key={v.title} className="rounded-xl border border-border/60 bg-white p-6 text-center">
                <v.icon className="mx-auto h-10 w-10 text-gold" />
                <h3 className="mt-4 font-heading font-semibold text-navy">{v.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
