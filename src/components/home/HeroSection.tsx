"use client";

import Link from "next/link";
import Image from "next/image";
import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ArrowRight, Plane } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { AnimatedFlightPath } from "@/components/motion/AnimatedFlightPath";
import { FloatingAircraftLayer } from "@/components/motion/FloatingAircraftLayer";
import { HeroPosterCarousel } from "@/components/home/HeroPosterCarousel";
import { cn } from "@/lib/utils";
import { ASSETS } from "@/lib/assets";
import { SITE } from "@/lib/constants";

gsap.registerPlugin(useGSAP);

export function HeroSection({ posters }: { posters: string[] }) {
  const sectionRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        const tl = gsap.timeline({ defaults: { ease: "power2.out" } });
        tl.from(".hero-badge", { opacity: 0, y: 20, duration: 0.55 })
          .from(".hero-title", { opacity: 0, y: 28, duration: 0.7 }, "-=0.25")
          .from(".hero-sub", { opacity: 0, y: 20, duration: 0.55 }, "-=0.35")
          .from(".hero-cta", { opacity: 0, y: 16, duration: 0.5, stagger: 0.08 }, "-=0.2")
          .from(".hero-trust", { opacity: 0, y: 12, duration: 0.45 }, "-=0.15");
      });
      mm.add("(prefers-reduced-motion: reduce)", () => {
        gsap.set([".hero-badge", ".hero-title", ".hero-sub", ".hero-cta", ".hero-trust"], {
          opacity: 1,
          y: 0,
        });
      });

      return () => mm.revert();
    },
    { scope: sectionRef }
  );

  return (
    <section ref={sectionRef} className="relative min-h-[85vh] overflow-hidden bg-navy">
      <div className="absolute inset-0">
        <Image
          src={ASSETS.heroPoster}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-navy/95 via-navy/80 to-royal/40" />
        <FloatingAircraftLayer density="medium" />
        <AnimatedFlightPath variant="hero" speed={6} className="bottom-[20%] h-32 md:h-40" />
      </div>

      <div className="container-wide relative z-10 flex min-h-[85vh] flex-col justify-center gap-10 py-16 md:py-20 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-3xl">
          <div className="hero-badge mb-5 inline-flex items-center gap-2 rounded-full border border-gold/30 bg-white/5 px-4 py-1.5 text-sm text-gold-light backdrop-blur-sm">
            <Plane className="h-4 w-4" />
            Premium Travel & Umrah Services
          </div>
          <h1 className="hero-title font-heading text-[clamp(2rem,5vw,3.5rem)] font-bold leading-[1.12] text-white">
            Travel Smart. Travel Safe.
            <span className="mt-2 block text-gradient-gold">Travel with Al Qibla.</span>
          </h1>
          <p className="hero-sub mt-5 max-w-2xl text-base leading-relaxed text-white/80 md:text-lg">
            {SITE.heroSubheading}
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/available-tickets/"
              className={cn(buttonVariants({ variant: "primaryGold", size: "lg" }), "hero-cta")}
            >
              Explore Live Flights
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
            <a
              href={SITE.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(buttonVariants({ variant: "outlineLight", size: "lg" }), "hero-cta")}
            >
              Talk to an Agent
            </a>
          </div>

          <div className="hero-trust mt-9 flex items-center gap-3 text-sm text-white/75">
            <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_16px_rgba(52,211,153,.8)]" />
            Live inventory · IATA verified · Support until you land
          </div>
        </div>

        <div className="hero-cta relative hidden h-[440px] w-[300px] shrink-0 lg:block">
          <HeroPosterCarousel posters={posters} />
        </div>
      </div>
    </section>
  );
}
