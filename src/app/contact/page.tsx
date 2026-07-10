import { createPageMetadata } from "@/lib/metadata";
import { ContactForm } from "@/components/shared/ContactForm";
import { OFFICES, SITE, SOCIAL } from "@/lib/constants";
import { FacebookIcon, InstagramIcon } from "@/components/shared/SocialIcons";
import { MapPin, MessageCircle, Phone, Mail } from "lucide-react";

export const metadata = createPageMetadata({
  title: "Contact Us",
  description: `Contact ${SITE.name} — Peshawar head office & Islamabad branch. WhatsApp ${SITE.whatsappNumber}`,
  path: "/contact/",
});

export default function ContactPage() {
  return (
    <section className="section-padding">
      <div className="container-wide">
        <div className="mb-8">
          <h1 className="text-2xl font-semibold text-navy md:text-3xl">Contact Us</h1>
          <p className="mt-1 text-sm text-muted-foreground">Reach us by phone, WhatsApp, or the form below</p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          <div className="space-y-4">
            {[OFFICES.headOffice, OFFICES.islamabad].map((office) => (
              <div key={office.label} className="rounded-xl border border-border/60 p-4">
                <h2 className="text-sm font-semibold text-navy">{office.label}</h2>
                <p className="mt-1.5 flex items-start gap-2 text-sm text-muted-foreground">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
                  {office.address}
                </p>
                <a href={`tel:${office.phoneTel}`} className="mt-1.5 flex items-center gap-2 text-sm hover:text-gold">
                  <Phone className="h-4 w-4 text-gold" />
                  {office.phone}
                </a>
              </div>
            ))}

            <div className="rounded-xl border border-border/60 p-4 text-sm text-muted-foreground">
              <a href={`mailto:${SITE.email}`} className="flex items-center gap-2 hover:text-gold">
                <Mail className="h-4 w-4 text-gold" /> {SITE.email}
              </a>
              <a href={SITE.whatsapp} className="mt-2 flex items-center gap-2 hover:text-gold">
                <MessageCircle className="h-4 w-4 text-gold" /> WhatsApp: {SITE.whatsappNumber}
              </a>
              <div className="mt-3 flex gap-2">
                {[
                  { href: SOCIAL.facebook, Icon: FacebookIcon, label: "Facebook" },
                  { href: SOCIAL.instagram, Icon: InstagramIcon, label: "Instagram" },
                  { href: SOCIAL.whatsapp, Icon: MessageCircle, label: "WhatsApp" },
                ].map(({ href, Icon, label }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="flex h-8 w-8 items-center justify-center rounded-full border hover:border-gold hover:text-gold"
                  >
                    <Icon className="h-3.5 w-3.5" />
                  </a>
                ))}
              </div>
            </div>
          </div>

          <ContactForm />
        </div>

        <div className="mt-10">
          <iframe
            src={OFFICES.headOffice.mapEmbed}
            width="100%"
            height="320"
            style={{ border: 0, borderRadius: 12 }}
            allowFullScreen
            loading="lazy"
            referrerPolicy="strict-origin-when-cross-origin"
            title="Peshawar Office Map"
            className="w-full"
          />
        </div>
      </div>
    </section>
  );
}
