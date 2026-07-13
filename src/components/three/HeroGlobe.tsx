"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";

const HeroGlobeScene = dynamic(() => import("./HeroGlobeScene"), { ssr: false });

/**
 * Lazy 3D globe for the hero — desktop only, skipped for reduced motion.
 * The hero poster underneath acts as the fallback everywhere else.
 */
export function HeroGlobe() {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 1024px)");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setEnabled(desktop.matches && !reduced.matches);
    update();
    desktop.addEventListener("change", update);
    reduced.addEventListener("change", update);
    return () => {
      desktop.removeEventListener("change", update);
      reduced.removeEventListener("change", update);
    };
  }, []);

  if (!enabled) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 1.2, delay: 0.4 }}
      className="pointer-events-none absolute -right-24 top-1/2 hidden h-[620px] w-[620px] -translate-y-1/2 lg:block xl:-right-10"
      aria-hidden
    >
      <HeroGlobeScene />
    </motion.div>
  );
}
