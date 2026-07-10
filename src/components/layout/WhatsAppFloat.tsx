"use client";

import { motion, useReducedMotion } from "framer-motion";
import { MessageCircle } from "lucide-react";
import { SITE } from "@/lib/constants";

export function WhatsAppFloat() {
  const reduced = useReducedMotion();

  return (
    <motion.a
      href={SITE.whatsapp}
      target="_blank"
      rel="noopener noreferrer"
      initial={{ opacity: 0, scale: 0.8, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ delay: 1, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      whileHover={reduced ? undefined : { scale: 1.1 }}
      whileTap={reduced ? undefined : { scale: 0.95 }}
      className="group fixed bottom-5 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg shadow-[#25D366]/30 sm:bottom-6 sm:right-6"
      style={{ marginBottom: "env(safe-area-inset-bottom, 0px)" }}
      aria-label="Chat on WhatsApp"
    >
      <span className="absolute inset-0 rounded-full bg-[#25D366] animate-pulse-ring" />
      <MessageCircle className="relative h-7 w-7" />
    </motion.a>
  );
}
