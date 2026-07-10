"use client";

import Link from "next/link";
import { ArrowRight, Plane } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { assetPath } from "@/lib/base-path";
import { ASSETS } from "@/lib/assets";
import { SITE } from "@/lib/constants";

export function HeroSection() {
  return (
    <section className="relative overflow-hidden bg-navy">
      <div className="absolute inset-0">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${assetPath(ASSETS.heroPoster)})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-navy/95 via-navy/85 to-navy/70" />
      </div>

      <div className="container-wide relative z-10 py-20 md:py-24">
        <div className="max-w-2xl animate-hero-reveal">
          <p className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-gold-light">
            <Plane className="h-4 w-4" />
            Umrah · Group Tickets · Corporate Travel
          </p>
          <h1 className="text-[clamp(2rem,4.5vw,3rem)] font-bold leading-tight tracking-tight text-white">
            Travel Smart. Travel Safe.
          </h1>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-white/75 md:text-lg">
            Your trusted partner for Umrah packages, group air tickets, and worldwide travel — Peshawar & Islamabad.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href={SITE.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(buttonVariants({ variant: "primaryGold", size: "lg" }), "h-11 px-6")}
            >
              Book on WhatsApp
            </a>
            <Link
              href="/available-tickets/"
              className={cn(buttonVariants({ variant: "outlineLight", size: "lg" }), "h-11 px-6")}
            >
              Browse Tickets
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
