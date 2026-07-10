import { createPageMetadata } from "@/lib/metadata";
import { PageHero } from "@/components/shared/PageHero";
import { PAGE_HEROES } from "@/lib/page-heroes";
import { OFFICES, SITE } from "@/lib/constants";
import { Heart, Shield, Globe } from "lucide-react";

export const metadata = createPageMetadata({
  title: "About Us",
  description: `Learn about ${SITE.name} — your trusted travel partner for Umrah, group tickets and corporate travel.`,
  path: "/about/",
});

const values = [
  { icon: Heart, title: "Customer First", desc: "Your comfort and safety come first." },
  { icon: Shield, title: "Trust & Integrity", desc: "Transparent pricing on every booking." },
  { icon: Globe, title: "Global Reach", desc: "Pakistan, UAE, Saudi Arabia and worldwide." },
];

export default function AboutPage() {
  return (
    <>
      <PageHero {...PAGE_HEROES.about} />

      <section className="section-padding">
        <div className="container-wide max-w-3xl">
          <p className="text-base leading-relaxed text-muted-foreground">
            {SITE.name} is a travel agency with offices in Peshawar and Islamabad. We specialize in
            Umrah packages, group air ticketing, and corporate travel for NGOs, companies, and families
            across Pakistan and the Gulf region.
          </p>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            With partnerships across 30+ airlines, we offer competitive group fares and complete travel
            solutions under one roof.
          </p>

          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {values.map((v) => (
              <div key={v.title} className="rounded-xl border border-border/60 p-4">
                <v.icon className="h-6 w-6 text-gold" />
                <h3 className="mt-2 text-sm font-semibold text-navy">{v.title}</h3>
                <p className="mt-1 text-xs text-muted-foreground">{v.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 rounded-xl border border-border/60 p-5">
            <h2 className="text-sm font-semibold text-navy">Our Offices</h2>
            <ul className="mt-3 space-y-3 text-sm text-muted-foreground">
              <li>
                <span className="font-medium text-navy">{OFFICES.headOffice.label}</span>
                <br />{OFFICES.headOffice.address}
              </li>
              <li>
                <span className="font-medium text-navy">{OFFICES.islamabad.label}</span>
                <br />{OFFICES.islamabad.address}
              </li>
            </ul>
          </div>
        </div>
      </section>
    </>
  );
}
