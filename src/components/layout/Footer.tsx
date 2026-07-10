import Link from "next/link";
import Image from "next/image";
import { MapPin, MessageCircle, Phone } from "lucide-react";
import { assetPath } from "@/lib/base-path";
import { LOGO_PATH, OFFICES, SITE, SOCIAL } from "@/lib/constants";
import { FacebookIcon, InstagramIcon } from "@/components/shared/SocialIcons";

const FOOTER_LINKS = [
  { href: "/available-tickets/", label: "Group Tickets" },
  { href: "/umrah-packages/", label: "Umrah Packages" },
  { href: "/flight-booking/", label: "Book Flights" },
  { href: "/corporate-travel/", label: "Corporate Travel" },
  { href: "/services/", label: "All Services" },
  { href: "/contact/", label: "Contact" },
] as const;

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-white/10 bg-navy text-white">
      <div className="container-wide py-12 md:py-14">
        <div className="grid gap-10 md:grid-cols-3">
          <div>
            <div className="mb-3 flex items-center gap-2.5">
              <Image
                src={assetPath(LOGO_PATH)}
                alt={SITE.name}
                width={40}
                height={40}
                className="h-10 w-10 rounded-lg object-contain"
                unoptimized
              />
              <p className="font-semibold">{SITE.shortName} Air Services</p>
            </div>
            <p className="text-sm leading-relaxed text-white/60">
              Umrah packages, group tickets, and corporate travel across Pakistan and worldwide.
            </p>
            <a
              href={SITE.whatsapp}
              className="mt-4 inline-flex items-center gap-2 text-sm text-gold hover:text-gold-light"
            >
              <MessageCircle className="h-4 w-4" />
              {SITE.whatsappNumber}
            </a>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold text-gold">Quick Links</h3>
            <ul className="grid grid-cols-2 gap-x-4 gap-y-2">
              {FOOTER_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-white/60 hover:text-white">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-3 text-sm font-semibold text-gold">Offices</h3>
            <div className="space-y-3 text-sm text-white/60">
              <div>
                <p className="font-medium text-white/90">{OFFICES.headOffice.label}</p>
                <p className="mt-0.5 flex items-start gap-1.5">
                  <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold" />
                  <span>{OFFICES.headOffice.address}</span>
                </p>
                <a href={`tel:${OFFICES.headOffice.phoneTel}`} className="mt-1 flex items-center gap-1.5 hover:text-gold">
                  <Phone className="h-3.5 w-3.5 text-gold" />
                  {OFFICES.headOffice.phone}
                </a>
              </div>
              <div>
                <p className="font-medium text-white/90">{OFFICES.islamabad.label}</p>
                <p className="mt-0.5 flex items-start gap-1.5">
                  <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gold" />
                  <span>{OFFICES.islamabad.address}</span>
                </p>
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              {[
                { href: SOCIAL.facebook, label: "Facebook", Icon: FacebookIcon },
                { href: SOCIAL.instagram, label: "Instagram", Icon: InstagramIcon },
                { href: SOCIAL.whatsapp, label: "WhatsApp", Icon: MessageCircle },
              ].map(({ href, label, Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-white/15 text-white/60 hover:border-gold hover:text-gold"
                >
                  <Icon className="h-3.5 w-3.5" />
                </a>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-white/10 pt-6 text-center text-xs text-white/40">
          <p>&copy; {year} {SITE.name}. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
