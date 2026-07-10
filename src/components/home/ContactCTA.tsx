"use client";

import Link from "next/link";
import { MapPin, MessageCircle, Phone } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { buttonVariants } from "@/components/ui/button";
import { MotionSection } from "@/components/motion/MotionSection";
import { MotionStagger, MotionStaggerItem } from "@/components/motion/MotionStagger";
import { cn } from "@/lib/utils";
import { OFFICES, SITE } from "@/lib/constants";

export function ContactCTA() {
  const reduced = useReducedMotion();

  return (
    <section className="section-padding bg-gradient-to-br from-navy via-navy-light to-royal/30">
      <div className="container-wide">
        <MotionSection className="text-center">
          <h2 className="font-heading text-3xl font-bold text-white md:text-4xl">Ready to Start Your Journey?</h2>
          <p className="mx-auto mt-4 max-w-xl text-white/75">Contact us at Peshawar head office or Islamabad branch. 24/7 WhatsApp support.</p>
        </MotionSection>
        <MotionStagger className="mt-8 grid gap-4 md:grid-cols-2">
          {[OFFICES.headOffice, OFFICES.islamabad].map((office) => (
            <MotionStaggerItem key={office.label}>
              <motion.div
                whileHover={reduced ? undefined : { y: -4 }}
                transition={{ duration: 0.2 }}
                className="rounded-2xl border border-white/10 bg-white/5 p-5 text-white backdrop-blur-sm transition-colors hover:border-gold/30 hover:bg-white/10"
              >
                <h3 className="font-heading font-semibold text-gold">{office.label}</h3>
                <p className="mt-2 flex items-start gap-2 text-sm text-white/75">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0" /> {office.address}
                </p>
                {"phone" in office && (
                  <a href={`tel:${office.phoneTel}`} className="mt-2 flex items-center gap-2 text-sm hover:text-gold">
                    <Phone className="h-4 w-4" /> {office.phone}
                  </a>
                )}
              </motion.div>
            </MotionStaggerItem>
          ))}
        </MotionStagger>
        <MotionSection delay={0.2} className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <a href={SITE.whatsapp} target="_blank" rel="noopener noreferrer" className={cn(buttonVariants({ variant: "whatsapp", size: "lg" }))}>
            <MessageCircle className="mr-2 h-5 w-5" /> Chat on WhatsApp
          </a>
          <Link href="/contact/" className={cn(buttonVariants({ variant: "outlineGold", size: "lg" }))}>
            <MapPin className="mr-2 h-5 w-5" /> Contact & Maps
          </Link>
          <Link href="/inquiry/" className={cn(buttonVariants({ variant: "outlineLight", size: "lg" }))}>
            Book / Inquiry Form
          </Link>
        </MotionSection>
      </div>
    </section>
  );
}
