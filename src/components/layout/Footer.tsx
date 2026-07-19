import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Mail, MapPin, MessageCircle, Phone, ShieldCheck } from "lucide-react";
import { FacebookIcon, InstagramIcon } from "@/components/shared/SocialIcons";
import { assetPath } from "@/lib/base-path";
import { LOGO_PATH, OFFICE_DISPLAY_ORDER, OFFICES, SITE, SOCIAL } from "@/lib/constants";

const travelLinks = [
  ["Available Tickets", "/available-tickets/"],
  ["Umrah Packages", "/umrah-packages/"],
  ["Tour Packages", "/tour-packages/"],
  ["Corporate Travel", "/corporate-travel/"],
] as const;

const companyLinks = [
  ["About Al Qibla", "/about/"],
  ["Destinations", "/destinations/"],
  ["Gallery", "/gallery/"],
  ["Contact Us", "/contact/"],
  ["Privacy Policy", "/privacy-policy/"],
] as const;

export function Footer() {
  return (
    <footer className="relative overflow-hidden bg-[#031328] text-white">
      <div className="pointer-events-none absolute -left-40 top-20 h-96 w-96 rounded-full bg-royal/15 blur-3xl" />
      <div className="pointer-events-none absolute -right-36 bottom-0 h-80 w-80 rounded-full bg-gold/10 blur-3xl" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/80 to-transparent" />

      <div className="container-wide relative py-12 lg:py-16">
        <div className="grid gap-8 rounded-[2rem] border border-white/10 bg-gradient-to-br from-white/[0.09] to-white/[0.025] p-7 shadow-2xl shadow-black/25 backdrop-blur-md sm:p-10 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="max-w-2xl">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-gold">Your journey starts here</p>
            <h2 className="mt-3 font-heading text-3xl font-bold tracking-tight sm:text-4xl">
              Travel with a team that stays with you.
            </h2>
            <p className="mt-3 text-sm leading-6 text-white/60 sm:text-base">
              Flights, Umrah, visas, hotels and group travel handled by one accountable travel partner.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <a
              href={SITE.whatsapp}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-gold px-6 font-semibold text-navy transition hover:-translate-y-0.5 hover:bg-gold-light"
            >
              <MessageCircle className="h-4 w-4" /> WhatsApp us
            </a>
            <Link
              href="/inquiry/"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-6 font-semibold transition hover:-translate-y-0.5 hover:border-gold/40 hover:bg-white/10"
            >
              Plan a journey <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <div className="mt-14 grid gap-12 md:grid-cols-2 lg:grid-cols-[1.45fr_0.7fr_0.7fr_1.15fr]">
          <div>
            <Link href="/" className="inline-flex items-center gap-4">
              <Image
                src={assetPath(LOGO_PATH)}
                alt={SITE.name}
                width={64}
                height={64}
                className="h-16 w-16 rounded-2xl bg-white/5 object-contain ring-1 ring-white/10"
                unoptimized
              />
              <div>
                <p className="font-brand text-xl font-bold">Al Qibla Air Services</p>
                <p className="mt-1 text-xs font-semibold uppercase tracking-[0.18em] text-gold-light">Travel Smart. Travel Safe.</p>
              </div>
            </Link>
            <p className="mt-6 max-w-sm text-sm leading-7 text-white/55">
              Professional travel services for pilgrims, families, groups, agents and organizations across Pakistan and worldwide.
            </p>
            <div className="mt-6 flex gap-2">
              {[
                { href: SOCIAL.facebook, label: "Facebook", Icon: FacebookIcon },
                { href: SOCIAL.instagram, label: "Instagram", Icon: InstagramIcon },
                { href: SOCIAL.whatsapp, label: "WhatsApp", Icon: MessageCircle },
              ].map(({ href, label, Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={label}
                  className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/60 transition hover:-translate-y-0.5 hover:border-gold/50 hover:bg-gold/10 hover:text-gold"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          <FooterLinks title="Travel" links={travelLinks} />
          <FooterLinks title="Company" links={companyLinks} />

          <div>
            <h3 className="text-xs font-bold uppercase tracking-[0.22em] text-gold">Contact</h3>
            <div className="mt-6 space-y-4 text-sm">
              <a href={`tel:${OFFICES.headOffice.phoneTel}`} className="flex items-center gap-3 text-white/65 transition hover:text-white">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/5 text-gold"><Phone className="h-4 w-4" /></span>
                {OFFICES.headOffice.phone}
              </a>
              <a href={`mailto:${SITE.email}`} className="flex items-center gap-3 text-white/65 transition hover:text-white">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/5 text-gold"><Mail className="h-4 w-4" /></span>
                <span className="break-all">{SITE.email}</span>
              </a>
              <Link href="/portal/" className="group inline-flex items-center gap-2 font-semibold text-gold-light transition hover:text-gold">
                Customer & agent portal <ArrowUpRight className="h-4 w-4 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-14 grid overflow-hidden rounded-2xl border border-white/10 bg-white/[0.035] md:grid-cols-3">
          {OFFICE_DISPLAY_ORDER.map((office, index) => (
            <div key={office.label} className={`p-5 sm:p-6 ${index ? "border-t border-white/10 md:border-l md:border-t-0" : ""}`}>
              <p className="flex items-center gap-2 text-sm font-semibold text-white"><MapPin className="h-4 w-4 text-gold" />{office.label}</p>
              <p className="mt-2 text-xs leading-5 text-white/45">{office.address}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 flex flex-col gap-4 border-t border-white/10 pt-7 text-xs text-white/40 sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} {SITE.name}. All rights reserved.</p>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <span className="inline-flex items-center gap-1.5"><ShieldCheck className="h-3.5 w-3.5 text-gold" /> Trusted travel support</span>
            <span>Department of Tourist Services registered</span>
          </div>
        </div>

        <div className="mt-5 flex justify-center border-t border-white/5 pt-5 text-xs text-white/35 sm:justify-end">
          <a
            href="https://www.induswebagency.com/"
            target="_blank"
            rel="noreferrer"
            className="group inline-flex items-center gap-1.5 transition hover:text-gold-light"
          >
            Made by <span className="font-semibold text-white/55 group-hover:text-gold-light">INDUS WEB AGENCY</span>
            <ArrowUpRight className="h-3 w-3 opacity-0 transition group-hover:opacity-100" />
          </a>
        </div>
      </div>
    </footer>
  );
}

function FooterLinks({ title, links }: { title: string; links: ReadonlyArray<readonly [string, string]> }) {
  return (
    <div>
      <h3 className="text-xs font-bold uppercase tracking-[0.22em] text-gold">{title}</h3>
      <ul className="mt-6 space-y-3.5">
        {links.map(([label, href]) => (
          <li key={href}>
            <Link href={href} className="group inline-flex items-center gap-1.5 text-sm text-white/55 transition hover:translate-x-0.5 hover:text-white">
              {label}<ArrowUpRight className="h-3 w-3 opacity-0 transition group-hover:opacity-100" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
