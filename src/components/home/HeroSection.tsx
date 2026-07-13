"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Plane } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { AnimatedFlightPath } from "@/components/motion/AnimatedFlightPath";
import { FloatingAircraftLayer } from "@/components/motion/FloatingAircraftLayer";
import { cn } from "@/lib/utils";
import { assetPath } from "@/lib/base-path";
import { ASSETS } from "@/lib/assets";
import { SITE } from "@/lib/constants";

export function HeroSection() {
  return (
    <section className="relative min-h-[85vh] overflow-hidden bg-navy">
      <div className="absolute inset-0">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${assetPath(ASSETS.heroPoster)})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-navy/95 via-navy/80 to-royal/40" />
        <FloatingAircraftLayer density="medium" />
        <AnimatedFlightPath variant="hero" className="bottom-[20%] h-32 md:h-40" />
      </div>

      <div className="container-wide relative z-10 flex min-h-[85vh] flex-col justify-center py-16 md:py-20">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="max-w-3xl"
        >
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-gold/30 bg-white/5 px-4 py-1.5 text-sm text-gold-light backdrop-blur-sm">
            <Plane className="h-4 w-4" />
            Premium Travel & Umrah Services
          </div>
          <h1 className="font-heading text-[clamp(2rem,5vw,3.5rem)] font-bold leading-[1.12] text-white">
            Travel Smart. Travel Safe.
            <span className="mt-2 block text-gradient-gold">Travel with Al Qibla.</span>
          </h1>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-white/80 md:text-lg">
            {SITE.heroSubheading}
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/available-tickets/"
              className={cn(buttonVariants({ variant: "primaryGold", size: "lg" }))}
            >
              Explore Live Flights
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
            <a
              href={SITE.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(buttonVariants({ variant: "outlineLight", size: "lg" }))}
            >
              Talk to an Agent
            </a>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="mt-9 flex items-center gap-3 text-sm text-white/75"
          >
            <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_16px_rgba(52,211,153,.8)]" />
            Live inventory · IATA verified · Support until you land
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
