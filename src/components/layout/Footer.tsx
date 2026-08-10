import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  Clock,
  Globe,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
} from "lucide-react";
import { FacebookIcon, InstagramIcon, WhatsAppIcon } from "@/components/shared/SocialIcons";
import { GsapReveal } from "@/components/motion/GsapReveal";
import { GsapStagger, GsapStaggerItem } from "@/components/motion/GsapStagger";
import { assetPath } from "@/lib/base-path";
import { LOGO_PATH, OFFICES, SITE, SOCIAL, TRUST_BADGES } from "@/lib/constants";

const exploreLinks = [
  ["Available Tickets", "/available-tickets/"],
  ["Umrah Packages", "/umrah-packages/"],
  ["Group Travels", "/destinations/"],
  ["Tours", "/tours/"],
  ["Tour Packages", "/tour-packages/"],
  ["Corporate Travel", "/corporate-travel/"],
] as const;

const companyLinks = [
  ["Travel Agency in Peshawar", "/travel-agency-peshawar/"],
  ["About Al Qibla", "/about/"],
  ["Our Services", "/services/"],
  ["Contact Us", "/contact/"],
] as const;

const socialLinks = [
  { href: SOCIAL.facebook, label: "Facebook", Icon: FacebookIcon },
  { href: SOCIAL.instagram, label: "Instagram", Icon: InstagramIcon },
  { href: SOCIAL.whatsapp, label: "WhatsApp", Icon: WhatsAppIcon },
] as const;

const trustIcons = [BadgeCheck, ShieldCheck, Clock, Globe] as const;

export function Footer() {
  const regions = `${SITE.regions.slice(0, -1).join(", ")} and ${SITE.regions[SITE.regions.length - 1]}`;

  return (
    <footer className="relative bg-navy text-white">
      <div aria-hidden className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/70 to-transparent" />

      <div className="relative overflow-hidden border-b border-white/10 bg-navy-light">
        <div aria-hidden className="pointer-events-none absolute -right-24 -top-32 h-72 w-72 rounded-full bg-royal/20 blur-3xl" />
        <GsapReveal
          y={16}
          className="container-wide relative flex flex-col gap-5 py-7 lg:flex-row lg:items-center lg:justify-between lg:py-8"
        >
          <div className="max-w-xl">
            <p className="text-xs font-bold uppercase tracking-[0.28em] text-gold">Your journey starts here</p>
            <h2 className="mt-2 font-heading text-2xl font-bold tracking-tight sm:text-3xl">
              Travel with a team that stays with you.
            </h2>
            <p className="mt-2 text-sm leading-6 text-white/60">
              Flights, Umrah, visas, hotels and group travel — handled by one accountable travel partner.
            </p>
          </div>
          <div className="flex shrink-0 flex-col gap-3 sm:flex-row">
            <a
              href={SITE.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#25D366] px-6 font-semibold text-white transition hover:-translate-y-0.5 hover:brightness-110"
            >
              <WhatsAppIcon className="h-4 w-4" /> WhatsApp us
            </a>
            <Link
              href="/inquiry/"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/5 px-6 font-semibold transition hover:-translate-y-0.5 hover:border-gold/40 hover:bg-white/10"
            >
              Plan a journey <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </GsapReveal>
      </div>

      <div className="container-wide py-10 lg:py-12">
        <GsapStagger className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_0.75fr_0.75fr_1.1fr] lg:gap-10">
          <GsapStaggerItem>
            <Link href="/" className="inline-flex items-center gap-3">
              <Image
                src={assetPath(LOGO_PATH)}
                alt={SITE.name}
                width={64}
                height={64}
                className="h-12 w-12 object-contain drop-shadow-[0_4px_12px_rgba(0,0,0,.35)]"
                unoptimized
              />
              <div>
                <p className="font-brand text-xl font-bold leading-tight">Al Qibla Air Services</p>
                <p className="mt-0.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-gold-light">
                  Travel Smart. Travel Safe.
                </p>
              </div>
            </Link>

            <p className="mt-5 max-w-sm text-sm leading-6 text-white/55">
              Travel agency in Peshawar for pilgrims, families, groups, agents and organizations —
              air tickets, Umrah, visas and corporate travel across {regions}.
            </p>
            <p className="mt-3 flex items-start gap-2 text-sm leading-6 text-white/45">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
              {OFFICES.headOffice.address}
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
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

            <div className="mt-5 flex gap-2.5">
              {socialLinks.map(({ href, label, Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className={
                    label === "WhatsApp"
                      ? "flex h-10 w-10 items-center justify-center rounded-xl border border-[#25D366]/35 bg-[#25D366]/15 text-[#25D366] transition hover:-translate-y-0.5 hover:bg-[#25D366]/25"
                      : "flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/60 transition hover:-translate-y-0.5 hover:border-gold/50 hover:bg-gold/10 hover:text-gold"
                  }
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
            <div className="mt-5 space-y-3.5 text-sm">
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
                  <WhatsAppIcon className="h-4 w-4" />
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
              className="group mt-5 inline-flex items-center gap-2 rounded-xl border border-gold/30 bg-gold/[0.06] px-4 py-2.5 text-sm font-semibold text-gold-light transition hover:-translate-y-0.5 hover:border-gold/50 hover:bg-gold/10 hover:text-gold"
            >
              Customer &amp; agent portal
              <ArrowUpRight className="h-4 w-4 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </Link>
          </GsapStaggerItem>
        </GsapStagger>
      </div>

      <div className="border-t border-white/10">
        <div className="container-wide flex flex-col gap-4 py-5 text-xs text-white/55 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {SITE.name}. All rights reserved.
          </p>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
            <Link href="/privacy-policy/" className="transition hover:text-white/90">
              Privacy Policy
            </Link>
            <span className="hidden h-3 w-px bg-white/15 sm:inline-block" aria-hidden />
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-gold" /> Department of Tourist Services registered
            </span>
            <span className="hidden h-3 w-px bg-white/15 sm:inline-block" aria-hidden />
            <a
              href="https://www.induswebagency.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-2 rounded-full border border-gold/40 bg-gold/10 px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-gold-light shadow-[0_0_20px_rgba(228,173,61,0.12)] transition hover:-translate-y-0.5 hover:border-gold/70 hover:bg-gold/20 hover:text-gold hover:shadow-[0_0_24px_rgba(228,173,61,0.22)]"
            >
              <span className="font-medium normal-case tracking-normal text-white/70 group-hover:text-white/90">
                Made by
              </span>
              <span className="font-bold tracking-[0.12em]">INDUS WEB AGENCY</span>
              <ArrowUpRight className="h-3.5 w-3.5 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}

function IconBubble({ children }: { children: ReactNode }) {
  return (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/5 text-gold">
      {children}
    </span>
  );
}

function FooterLinks({ title, links }: { title: string; links: ReadonlyArray<readonly [string, string]> }) {
  return (
    <div>
      <h3 className="text-xs font-bold uppercase tracking-[0.22em] text-gold">{title}</h3>
      <ul className="mt-5 space-y-3">
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
