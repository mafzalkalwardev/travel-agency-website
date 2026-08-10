import Link from "next/link";
import { MapPin, MessageCircle } from "lucide-react";
import { GsapReveal } from "@/components/motion/GsapReveal";
import { buttonVariants } from "@/components/ui/button";
import { OFFICES, SITE } from "@/lib/constants";
import { cn } from "@/lib/utils";

/** Homepage local SEO block targeting “travel agency in Peshawar”. */
export function PeshawarLocalStrip() {
  return (
    <section className="relative overflow-hidden border-y border-border/60 bg-navy text-white">
      <div className="pointer-events-none absolute -right-20 top-0 h-64 w-64 rounded-full bg-gold/15 blur-3xl" />
      <div className="container-wide relative py-12 md:py-16">
        <GsapReveal className="mx-auto max-w-4xl text-center">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-gold">Peshawar head office</p>
          <h2 className="mt-4 font-heading text-3xl font-bold tracking-tight md:text-4xl">
            Trusted travel agency in Peshawar
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-white/70 md:text-base">
            AL QIBLA AIR SERVICES serves ticket booking, Umrah packages, group flights and visas from Cantonment Plaza,
            Saddar Road, Peshawar Cantt — book online on flywithalqibla.com or visit our office.
          </p>
          <p className="mt-4 inline-flex items-start justify-center gap-2 text-sm text-white/55">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold" />
            <span>{OFFICES.headOffice.address}</span>
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/travel-agency-peshawar/"
              className={cn(buttonVariants({ variant: "primaryGold", size: "lg" }), "px-5")}
            >
              Peshawar office details
            </Link>
            <a
              href={SITE.whatsapp}
              target="_blank"
              rel="noreferrer"
              className={cn(buttonVariants({ variant: "whatsapp", size: "lg" }), "gap-2 px-5")}
            >
              <MessageCircle className="h-4 w-4" /> WhatsApp
            </a>
          </div>
        </GsapReveal>
      </div>
    </section>
  );
}
