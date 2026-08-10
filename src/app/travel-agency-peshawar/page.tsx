import Link from "next/link";
import { MapPin, MessageCircle, Phone, Plane, ShieldCheck, Users } from "lucide-react";
import { PageHero } from "@/components/shared/PageHero";
import { buttonVariants } from "@/components/ui/button";
import { ASSETS } from "@/lib/assets";
import { OFFICES, SITE } from "@/lib/constants";
import { getPeshawarLandingFaqJsonLd } from "@/lib/local-business-schema";
import { createPageMetadata } from "@/lib/metadata";
import { PAGE_SEO } from "@/lib/seo";
import { cn } from "@/lib/utils";

export const metadata = createPageMetadata({
  title: PAGE_SEO.travelAgencyPeshawar.title,
  description: PAGE_SEO.travelAgencyPeshawar.description,
  path: PAGE_SEO.travelAgencyPeshawar.path,
  keywords: PAGE_SEO.travelAgencyPeshawar.keywords,
});

const services = [
  {
    title: "Air ticket booking in Peshawar",
    text: "Domestic and international ticketing with live group inventory and fare support from our Peshawar Cantt office.",
    href: "/available-tickets/",
  },
  {
    title: "Umrah packages from Peshawar",
    text: "Economy to premium Umrah packages with flight and hotel options for families, groups and first-time pilgrims.",
    href: "/umrah-packages/",
  },
  {
    title: "Group flights & visit visas",
    text: "UAE, KSA, Oman and Bahrain group seats plus visit visa assistance handled by our travel team.",
    href: "/destinations/",
  },
  {
    title: "Corporate & family travel",
    text: "End-to-end planning for companies, NGOs, schools and family groups across Pakistan and worldwide.",
    href: "/corporate-travel/",
  },
];

const faqs = [
  {
    q: "Where is your travel agency office in Peshawar?",
    a: OFFICES.headOffice.address,
  },
  {
    q: "Why choose AL QIBLA AIR SERVICES?",
    a: "We are an IATA-verified, DTS-registered travel agency with offices in Peshawar, Islamabad and Bannu, live booking inventory on flywithalqibla.com, and WhatsApp support until you travel.",
  },
  {
    q: "How can I contact this Peshawar travel agency?",
    a: `Call ${OFFICES.headOffice.phone}, WhatsApp ${SITE.whatsappNumber}, email ${SITE.email}, or visit Cantonment Plaza, Saddar Road during ${SITE.businessHours}.`,
  },
  {
    q: "Do you book Umrah and tickets online?",
    a: "Yes. Browse live packages and group tickets on flywithalqibla.com, then confirm with our Peshawar team by office visit or WhatsApp.",
  },
];

export default function TravelAgencyPeshawarPage() {
  const faqJsonLd = getPeshawarLandingFaqJsonLd();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <PageHero
        title="Travel Agency in Peshawar"
        subtitle="AL QIBLA AIR SERVICES — trusted air ticketing, Umrah, group flights and visas from Cantonment Plaza, Saddar Road, Peshawar Cantt."
        backgroundImage={ASSETS.heroes.contact}
        badge="Peshawar Head Office"
        cta={{ label: "WhatsApp Now", href: SITE.whatsapp }}
      />

      <section className="section-padding bg-white">
        <div className="container-wide mx-auto max-w-4xl">
          <h2 className="font-heading text-3xl font-bold text-navy md:text-4xl">
            Your local travel agency in Peshawar Cantt
          </h2>
          <p className="mt-5 text-base leading-8 text-muted-foreground md:text-lg">
            When people search for a <strong>travel agency in Peshawar</strong>, they need a real office,
            clear pricing and reliable booking support — not just a phone number.{" "}
            <strong>AL QIBLA AIR SERVICES</strong> operates from{" "}
            <strong>Office #4, Block-B, Cantonment Plaza, Saddar Road, Peshawar Cantonment</strong>, with
            online booking at{" "}
            <Link href="/" className="font-semibold text-royal underline-offset-2 hover:underline">
              flywithalqibla.com
            </Link>
            .
          </p>
          <p className="mt-4 text-base leading-8 text-muted-foreground md:text-lg">
            From daily air ticket requests to Umrah packages and group flights, our Peshawar team helps
            families, agents and corporate clients book with confidence. We also support travellers from
            across Khyber Pakhtunkhwa through our Islamabad and Bannu branches.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <a href={SITE.whatsapp} target="_blank" rel="noreferrer" className={cn(buttonVariants(), "gap-2")}>
              <MessageCircle className="h-4 w-4" /> WhatsApp booking
            </a>
            <a href={`tel:${OFFICES.headOffice.phoneTel}`} className={cn(buttonVariants({ variant: "outline" }), "gap-2")}>
              <Phone className="h-4 w-4" /> {OFFICES.headOffice.phone}
            </a>
            <Link href="/inquiry/" className={cn(buttonVariants({ variant: "outline" }), "gap-2")}>
              <Plane className="h-4 w-4" /> Send inquiry
            </Link>
          </div>
        </div>
      </section>

      <section className="section-padding bg-light-bg">
        <div className="container-wide">
          <h2 className="text-center font-heading text-3xl font-bold text-navy md:text-4xl">
            Services from our Peshawar travel office
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-muted-foreground">
            Complete travel solutions under one roof at Saddar / Cantonment Plaza.
          </p>
          <div className="mt-10 grid gap-5 md:grid-cols-2">
            {services.map((service) => (
              <Link
                key={service.title}
                href={service.href}
                className="rounded-2xl border border-border/70 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-gold/40 hover:shadow-lg"
              >
                <h3 className="font-heading text-xl font-semibold text-navy">{service.title}</h3>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">{service.text}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section-padding bg-white">
        <div className="container-wide grid gap-8 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-gold">Visit us</p>
            <h2 className="mt-3 font-heading text-3xl font-bold text-navy">Head office — Peshawar</h2>
            <ul className="mt-6 space-y-4 text-sm text-muted-foreground">
              <li className="flex gap-3">
                <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-gold" />
                <span>{OFFICES.headOffice.address}</span>
              </li>
              <li className="flex gap-3">
                <Phone className="mt-0.5 h-5 w-5 shrink-0 text-gold" />
                <a href={`tel:${OFFICES.headOffice.phoneTel}`} className="hover:text-royal">
                  {OFFICES.headOffice.phone}
                </a>
              </li>
              <li className="flex gap-3">
                <MessageCircle className="mt-0.5 h-5 w-5 shrink-0 text-gold" />
                <a href={SITE.whatsapp} className="hover:text-royal">
                  WhatsApp {SITE.whatsappNumber}
                </a>
              </li>
              <li className="flex gap-3">
                <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-gold" />
                <span>IATA verified · DTS registered · {SITE.businessHours}</span>
              </li>
              <li className="flex gap-3">
                <Users className="mt-0.5 h-5 w-5 shrink-0 text-gold" />
                <span>Also serving clients via Islamabad and Bannu branch offices</span>
              </li>
            </ul>
          </div>
          <div className="overflow-hidden rounded-3xl border border-border shadow-lg">
            <iframe
              src={OFFICES.headOffice.mapEmbed}
              className="h-80 w-full border-0 md:h-[26rem]"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="AL QIBLA AIR SERVICES travel agency in Peshawar map"
            />
          </div>
        </div>
      </section>

      <section className="section-padding bg-light-bg">
        <div className="container-wide mx-auto max-w-3xl">
          <h2 className="text-center font-heading text-3xl font-bold text-navy">
            Travel agency in Peshawar — FAQs
          </h2>
          <div className="mt-10 space-y-4">
            {faqs.map((item) => (
              <details
                key={item.q}
                className="group rounded-2xl border border-border/70 bg-white p-5 open:shadow-md"
              >
                <summary className="cursor-pointer list-none font-semibold text-navy marker:content-none">
                  {item.q}
                </summary>
                <p className="mt-3 text-sm leading-7 text-muted-foreground">{item.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
