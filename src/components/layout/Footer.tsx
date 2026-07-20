import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUp,
  ArrowUpRight,
  BadgeCheck,
  Clock,
  Globe,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  ShieldCheck,
} from "lucide-react";
import { FacebookIcon, InstagramIcon } from "@/components/shared/SocialIcons";
import { GsapReveal } from "@/components/motion/GsapReveal";
import { GsapStagger, GsapStaggerItem } from "@/components/motion/GsapStagger";
import { assetPath } from "@/lib/base-path";
import { LOGO_PATH, OFFICE_DISPLAY_ORDER, OFFICES, SITE, SOCIAL, TRUST_BADGES } from "@/lib/constants";

const exploreLinks = [
  ["Available Tickets", "/available-tickets/"],
  ["Umrah Packages", "/umrah-packages/"],
  ["Tour Packages", "/tour-packages/"],
  ["Corporate Travel", "/corporate-travel/"],
  ["Destinations", "/destinations/"],
] as const;

const companyLinks = [
  ["About Al Qibla", "/about/"],
  ["Our Services", "/services/"],
  ["Gallery", "/gallery/"],
  ["Contact Us", "/contact/"],
] as const;

const socialLinks = [
  { href: SOCIAL.facebook, label: "Facebook", Icon: FacebookIcon },
  { href: SOCIAL.instagram, label: "Instagram", Icon: InstagramIcon },
  { href: SOCIAL.whatsapp, label: "WhatsApp", Icon: MessageCircle },
] as const;

const trustIcons = [BadgeCheck, ShieldCheck, Clock, Globe] as const;

export function Footer() {
  const regions = `${SITE.regions.slice(0, -1).join(", ")} and ${SITE.regions[SITE.regions.length - 1]}`;

  return (
    <footer className="relative bg-navy text-white">
      <div aria-hidden className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/70 to-transparent" />

      {/* CTA band */}
      <div className="relative overflow-hidden border-b border-white/10 bg-navy-light">
        <div aria-hidden className="pointer-events-none absolute -right-24 -top-32 h-72 w-72 rounded-full bg-royal/20 blur-3xl" />
        <GsapReveal
          y={16}
          className="container-wide relative flex flex-col gap-6 py-10 lg:flex-row lg:items-center lg:justify-between lg:py-12"
        >
          <div className="max-w-xl">
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-gold">Your journey starts here</p>
            <h2 className="mt-3 font-heading text-2xl font-bold tracking-tight sm:text-3xl">
              Travel with a team that stays with you.
            </h2>
            <p className="mt-3 text-sm leading-6 text-white/60">
              Flights, Umrah, visas, hotels and group travel — handled by one accountable travel partner.
            </p>
          </div>
          <div className="flex shrink-0 flex-col gap-3 sm:flex-row">
            <a
              href={SITE.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
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
        </GsapReveal>
      </div>

      {/* Main content */}
      <div className="container-wide py-14 lg:py-16">
        <GsapStagger className="grid gap-12 sm:grid-cols-2 lg:grid-cols-[1.4fr_0.75fr_0.75fr_1.1fr] lg:gap-10">
          <GsapStaggerItem>
            <Link href="/" className="inline-flex items-center gap-4">
              <Image
                src={assetPath(LOGO_PATH)}
                alt={SITE.name}
                width={60}
                height={60}
                className="h-14 w-14 rounded-2xl bg-white/5 object-contain ring-1 ring-white/10"
                unoptimized
              />
              <div>
                <p className="font-brand text-xl font-bold leading-tight">Al Qibla Air Services</p>
                <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-gold-light">
                  Travel Smart. Travel Safe.
                </p>
              </div>
            </Link>

            <p className="mt-6 max-w-sm text-sm leading-7 text-white/55">
              Professional travel services for pilgrims, families, groups, agents and organizations —
              across {regions}.
            </p>

            <div className="mt-6 flex flex-wrap gap-2">
              {TRUST_BADGES.map((badge, index) => {
                const Icon = trustIcons[index] ?? ShieldCheck;
                return (
                  <span
                    key={badge}
                    className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 text-[11px] font-medium text-white/60"
                  >
                    <Icon className="h-3 w-3 text-gold" /> {badge}
                  </span>
                );
              })}
            </div>

            <div className="mt-7 flex gap-2.5">
              {socialLinks.map(({ href, label, Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/60 transition hover:-translate-y-0.5 hover:border-gold/50 hover:bg-gold/10 hover:text-gold"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </GsapStaggerItem>

          <GsapStaggerItem>
            <FooterLinks title="Explore" links={exploreLinks} />
          </GsapStaggerItem>

          <GsapStaggerItem>
            <FooterLinks title="Company" links={companyLinks} />
          </GsapStaggerItem>

          <GsapStaggerItem>
            <h3 className="text-xs font-bold uppercase tracking-[0.22em] text-gold">Get in touch</h3>
            <div className="mt-6 space-y-4 text-sm">
              <a
                href={`tel:${OFFICES.headOffice.phoneTel}`}
                className="flex items-center gap-3 text-white/65 transition hover:text-white"
              >
                <IconBubble>
                  <Phone className="h-4 w-4" />
                </IconBubble>
                {OFFICES.headOffice.phone}
              </a>
              <a
                href={SITE.whatsapp}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-white/65 transition hover:text-white"
              >
                <IconBubble>
                  <MessageCircle className="h-4 w-4" />
                </IconBubble>
                WhatsApp chat
              </a>
              <a
                href={`mailto:${SITE.email}`}
                className="flex items-center gap-3 text-white/65 transition hover:text-white"
              >
                <IconBubble>
                  <Mail className="h-4 w-4" />
                </IconBubble>
                <span className="break-all">{SITE.email}</span>
              </a>
              <p className="flex items-start gap-3 text-white/45">
                <IconBubble>
                  <Clock className="h-4 w-4" />
                </IconBubble>
                <span className="text-xs leading-5">{SITE.businessHours}</span>
              </p>
            </div>

            <Link
              href="/portal/"
              className="group mt-6 inline-flex items-center gap-2 rounded-xl border border-gold/30 bg-gold/[0.06] px-4 py-2.5 text-sm font-semibold text-gold-light transition hover:-translate-y-0.5 hover:border-gold/50 hover:bg-gold/10 hover:text-gold"
            >
              Customer &amp; agent portal
              <ArrowUpRight className="h-4 w-4 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </Link>
          </GsapStaggerItem>
        </GsapStagger>

        {/* Offices */}
        <GsapReveal y={20} delay={0.05} className="mt-14">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-gold">Our Offices</p>
          <div className="mt-5 grid gap-px overflow-hidden rounded-2xl bg-white/10 sm:grid-cols-3">
            {OFFICE_DISPLAY_ORDER.map((office) => (
              <div key={office.label} className="group bg-navy p-6 transition hover:bg-navy-light sm:p-7">
                <p className="flex items-center gap-2 text-sm font-semibold text-white">
                  <MapPin className="h-4 w-4 shrink-0 text-gold" /> {office.label}
                </p>
                <p className="mt-3 text-xs leading-5 text-white/45">{office.address}</p>
                <a
                  href={`tel:${office.phoneTel}`}
                  className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-gold-light transition group-hover:text-gold"
                >
                  <Phone className="h-3.5 w-3.5" /> {office.phone}
                </a>
              </div>
            ))}
          </div>
        </GsapReveal>
      </div>

      {/* Legal bar */}
      <div className="border-t border-white/10">
        <div className="container-wide flex flex-col gap-4 py-6 text-xs text-white/45 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {SITE.name}. All rights reserved.
          </p>
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <Link href="/privacy-policy/" className="transition hover:text-white/80">
              Privacy Policy
            </Link>
            <span className="hidden h-3 w-px bg-white/15 sm:inline-block" aria-hidden />
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-gold" /> Department of Tourist Services registered
            </span>
            <span className="hidden h-3 w-px bg-white/15 sm:inline-block" aria-hidden />
            <a href="#" className="inline-flex items-center gap-1 transition hover:text-white/80">
              Back to top <ArrowUp className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>
      </div>

      {/* Site credit */}
      <div className="border-t border-white/5">
        <div className="container-wide flex justify-center py-4 text-[11px] text-white/35 sm:justify-end">
          <a
            href="https://www.induswebagency.com/"
            target="_blank"
            rel="noopener noreferrer"
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

function IconBubble({ children }: { children: ReactNode }) {
  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/5 text-gold">
      {children}
    </span>
  );
}

function FooterLinks({ title, links }: { title: string; links: ReadonlyArray<readonly [string, string]> }) {
  return (
    <div>
      <h3 className="text-xs font-bold uppercase tracking-[0.22em] text-gold">{title}</h3>
      <ul className="mt-6 space-y-3.5">
        {links.map(([label, href]) => (
          <li key={href}>
            <Link
              href={href}
              className="group inline-flex items-center gap-1.5 text-sm text-white/55 transition hover:translate-x-0.5 hover:text-white"
            >
              {label}
              <ArrowUpRight className="h-3 w-3 opacity-0 transition group-hover:opacity-100" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
