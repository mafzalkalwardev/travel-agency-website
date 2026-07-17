"use client";

import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { assetPath } from "@/lib/base-path";
import { LOGO_PATH, SITE } from "@/lib/constants";
import { INTRO_DONE_EVENT } from "@/lib/intro";

const INTRO_DURATION_MS = 3600;
const AIRCRAFT_SRC = "/assets/aircraft/arrival-aircraft-hq.webp";

const planeTransition = {
  duration: 2,
  times: [0, 0.15, 0.85, 1],
  ease: [0.4, 0, 0.3, 1] as const,
};

export function SiteArrivalIntro() {
  const pathname = usePathname();
  const reducedMotion = useReducedMotion();
  const [visible, setVisible] = useState(false);

  const finish = useCallback(() => {
    if (typeof window !== "undefined") {
      window.__alqiblaIntroPlaying = false;
      window.dispatchEvent(new Event(INTRO_DONE_EVENT));
      document.documentElement.classList.remove("intro-playing");
    }
    setVisible(false);
  }, []);

  useEffect(() => {
    if (pathname !== "/" || reducedMotion) return;

    window.__alqiblaIntroPlaying = true;
    document.documentElement.classList.add("intro-playing");
    setVisible(true);
    const timer = window.setTimeout(finish, INTRO_DURATION_MS);

    return () => window.clearTimeout(timer);
  }, [finish, pathname, reducedMotion]);

  useEffect(() => {
    if (!visible) return;

    const previousOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.documentElement.style.overflow = previousOverflow;
    };
  }, [visible]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="arrival-intro fixed inset-0 z-[200] overflow-hidden text-white"
          initial={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0.96, y: "-100%" }}
          transition={{ duration: 0.72, ease: [0.76, 0, 0.24, 1] }}
          role="dialog"
          aria-modal="true"
          aria-label="Al Qibla Air Services introduction"
        >
          <div className="arrival-sky absolute inset-0" />
          <div className="arrival-cloud arrival-cloud-far absolute inset-x-[-12%] bottom-[15%] h-[44%]" />
          <div className="arrival-cloud arrival-cloud-near absolute inset-x-[-16%] bottom-[-18%] h-[48%]" />
          <div className="arrival-vignette absolute inset-0" />

          {/* Plane A — enters from the left, climbs to the right */}
          <motion.div
            className="intro-plane intro-plane--a z-20 transform-gpu"
            initial={{ x: "-78vw", y: "6vh", rotate: -7, scale: 0.9, opacity: 0 }}
            animate={{
              x: ["-78vw", "-40vw", "40vw", "78vw"],
              y: ["6vh", "0vh", "-10vh", "-16vh"],
              rotate: [-7, -8, -9, -10],
              scale: [0.9, 0.97, 1.04, 1.08],
              opacity: [0, 1, 1, 0],
            }}
            transition={{ ...planeTransition, delay: 0.15 }}
          >
            <Image
              src={assetPath(AIRCRAFT_SRC)}
              alt=""
              width={3344}
              height={1882}
              sizes="(max-width: 640px) 74vw, 48vw"
              className="h-auto w-full select-none drop-shadow-[0_26px_30px_rgba(0,10,28,0.34)]"
              loading="eager"
              fetchPriority="high"
              draggable={false}
            />
          </motion.div>

          {/* Plane B — enters from the right (mirrored), descends to the left */}
          <motion.div
            className="intro-plane intro-plane--b z-20 transform-gpu"
            initial={{ x: "78vw", y: "-6vh", rotate: 7, scale: 0.9, opacity: 0 }}
            animate={{
              x: ["78vw", "40vw", "-40vw", "-78vw"],
              y: ["-6vh", "0vh", "10vh", "16vh"],
              rotate: [7, 8, 9, 10],
              scale: [0.9, 0.97, 1.04, 1.06],
              opacity: [0, 1, 1, 0],
            }}
            transition={{ ...planeTransition, delay: 0.35 }}
          >
            <Image
              src={assetPath(AIRCRAFT_SRC)}
              alt=""
              width={3344}
              height={1882}
              sizes="(max-width: 640px) 74vw, 48vw"
              className="h-auto w-full select-none drop-shadow-[0_26px_30px_rgba(0,10,28,0.34)]"
              loading="eager"
              draggable={false}
            />
          </motion.div>

          {/* Logo reveal — appears once the planes clear the frame */}
          <div className="intro-logo-wrap z-30">
            <motion.div
              className="intro-glow"
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: [0, 0.9, 0.85], scale: [0.6, 1.05, 1] }}
              transition={{ delay: 1.7, duration: 1.1, ease: "easeOut" }}
            />
            <motion.div
              className="intro-logo-plate"
              initial={{ opacity: 0, scale: 0.55, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: 1.8, duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
            >
              <Image
                src={assetPath(LOGO_PATH)}
                alt={SITE.name}
                width={512}
                height={512}
                sizes="190px"
                className="h-full w-full object-contain"
                loading="eager"
              />
            </motion.div>
            <motion.p
              className="intro-tagline font-brand text-sm font-semibold tracking-[0.28em] text-gold-light sm:text-base"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 2.3, duration: 0.6, ease: "easeOut" }}
            >
              TRAVEL SMART · TRAVEL SAFE
            </motion.p>
          </div>

          <motion.div
            className="absolute inset-x-0 bottom-0 z-40 h-[3px] bg-white/10"
            aria-hidden="true"
          >
            <motion.div
              className="h-full bg-[#e4ad3d] shadow-[0_0_18px_rgba(228,173,61,0.6)]"
              initial={{ width: 0 }}
              animate={{ width: "100%" }}
              transition={{ duration: INTRO_DURATION_MS / 1000, ease: "linear" }}
            />
          </motion.div>

          <button
            type="button"
            onClick={finish}
            className="absolute right-5 top-5 z-40 rounded-full border border-white/20 bg-[#061a33]/45 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/70 backdrop-blur-md transition hover:border-white/35 hover:bg-[#061a33]/70 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white sm:right-8 sm:top-8"
          >
            Skip intro
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
