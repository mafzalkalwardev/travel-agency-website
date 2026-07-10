import Link from "next/link";
import Image from "next/image";
import { MapPin, MessageCircle, Phone } from "lucide-react";
import { assetPath } from "@/lib/base-path";
import { LOGO_PATH, NAV_LINKS, OFFICES, SITE, SOCIAL, TRUST_TEXT } from "@/lib/constants";
import { FacebookIcon, InstagramIcon } from "@/components/shared/SocialIcons";

function TwitterIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="bg-navy text-white">
      <div className="container-wide section-padding">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="mb-4 flex items-center gap-3">
              <Image src={assetPath(LOGO_PATH)} alt={SITE.name} width={56} height={56} className="h-14 w-14 rounded-lg object-contain ring-1 ring-white/10" unoptimized />
              <div>
                <p className="font-heading text-lg font-bold">{SITE.shortName}</p>
                <p className="text-sm text-gold-light">Air Services</p>
              </div>
            </div>
            <p className="text-sm leading-relaxed text-white/70">{SITE.description}</p>
            <p className="mt-3 text-sm font-medium text-gold">{SITE.tagline}</p>
          </div>

          <div>
            <h3 className="mb-4 font-heading text-lg font-semibold text-gold">Quick Links</h3>
            <ul className="space-y-2">
              {NAV_LINKS.slice(0, 8).map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-white/70 hover:text-gold">{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="mb-4 font-heading text-lg font-semibold text-gold">Our Offices</h3>
            <div className="space-y-4 text-sm text-white/70">
              <div>
                <p className="font-medium text-white">{OFFICES.headOffice.label}</p>
                <p className="mt-1 flex items-start gap-2">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
                  {OFFICES.headOffice.address}
                </p>
                <a href={`tel:${OFFICES.headOffice.phoneTel}`} className="mt-1 flex items-center gap-2 hover:text-gold">
                  <Phone className="h-4 w-4 text-gold" /> {OFFICES.headOffice.phone}
                </a>
              </div>
              <div>
                <p className="font-medium text-white">{OFFICES.islamabad.label}</p>
                <p className="mt-1 flex items-start gap-2">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
                  {OFFICES.islamabad.address}
                </p>
              </div>
              <div>
                <p className="font-medium text-white">{OFFICES.bannu.label}</p>
                <p className="mt-1 flex items-start gap-2">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
                  {OFFICES.bannu.address}
                </p>
                <a href={`tel:${OFFICES.bannu.phoneTel}`} className="mt-1 flex items-center gap-2 hover:text-gold">
                  <Phone className="h-4 w-4 text-gold" /> {OFFICES.bannu.phone}
                </a>
                <a href={`tel:${OFFICES.bannu.phoneAltTel}`} className="mt-1 flex items-center gap-2 hover:text-gold">
                  <Phone className="h-4 w-4 text-gold" /> {OFFICES.bannu.phoneAlt}
                </a>
              </div>
              <a href={SITE.whatsapp} className="flex items-center gap-2 hover:text-gold">
                <MessageCircle className="h-4 w-4 text-gold" /> WhatsApp: {SITE.whatsappNumber}
              </a>
            </div>
          </div>

          <div>
            <h3 className="mb-4 font-heading text-lg font-semibold text-gold">Follow Us</h3>
            <div className="flex gap-3">
              {[
                { href: SOCIAL.facebook, label: "Facebook", Icon: FacebookIcon },
                { href: SOCIAL.facebookGroup, label: "Facebook Group", Icon: FacebookIcon },
                { href: SOCIAL.instagram, label: "Instagram", Icon: InstagramIcon },
                { href: SOCIAL.twitter, label: "Twitter", Icon: TwitterIcon },
                { href: SOCIAL.whatsapp, label: "WhatsApp", Icon: MessageCircle },
              ].map(({ href, label, Icon }) => (
                <a key={label} href={href} target="_blank" rel="noopener noreferrer" aria-label={label} className="flex h-10 w-10 items-center justify-center rounded-full border border-white/20 text-white/70 hover:border-gold hover:text-gold">
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
            <ul className="mt-5 space-y-1.5 text-xs text-white/50">
              {TRUST_TEXT.map((t) => (
                <li key={t}>• {t}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-white/10 pt-6 text-center text-sm text-white/50">
          <p>&copy; {year} {SITE.name}. All rights reserved.</p>
          <p className="mt-1 text-gold-light/80">{SITE.tagline}</p>
        </div>
      </div>
    </footer>
  );
}
