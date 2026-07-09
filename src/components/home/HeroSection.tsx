"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Plane, Shield, Award, Headphones, Globe } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { AnimatedFlightPath } from "@/components/motion/AnimatedFlightPath";
import { FloatingAircraftLayer } from "@/components/motion/FloatingAircraftLayer";
import { cn } from "@/lib/utils";
import { assetPath } from "@/lib/base-path";
import { ASSETS } from "@/lib/assets";
import { SITE, TRUST_BADGES } from "@/lib/constants";

const badgeIcons = [Award, Shield, Headphones, Globe];

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
            <a
              href={SITE.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(buttonVariants({ variant: "primaryGold", size: "lg" }))}
            >
              Book on WhatsApp
            </a>
            <Link
              href="/umrah-packages/"
              className={cn(buttonVariants({ variant: "outlineLight", size: "lg" }))}
            >
              View Umrah Packages
            </Link>
            <Link
              href="/available-tickets/"
              className={cn(buttonVariants({ variant: "outlineGold", size: "lg" }))}
            >
              Check Available Tickets
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="mt-10 flex flex-wrap gap-2"
          >
            {TRUST_BADGES.map((badge, i) => {
              const Icon = badgeIcons[i] || Shield;
              return (
                <motion.span
                  key={badge}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6 + i * 0.08, duration: 0.35 }}
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/90 backdrop-blur-sm"
                >
                  <Icon className="h-3.5 w-3.5 text-gold" />
                  {badge}
                </motion.span>
              );
            })}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
