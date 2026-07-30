"use client";

import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { usePathname } from "next/navigation";
import { useCallback, useLayoutEffect, useState } from "react";
import { assetPath } from "@/lib/base-path";
import { LOGO_PATH } from "@/lib/constants";

/** Short brand beat — long enough to feel intentional, not a wait. */
const INTRO_DURATION_MS = 1800;
const INTRO_STORAGE_KEY = "al-qibla-arrival-intro-seen";

export function SiteArrivalIntro() {
  const pathname = usePathname();
  const reducedMotion = useReducedMotion();
  // Optimistically match homepage on SSR so the intro is in first paint
  // (avoids a flash of the real homepage before the overlay mounts).
  const [visible, setVisible] = useState(() => pathname === "/");
  const [ready, setReady] = useState(false);

  const finish = useCallback(() => {
    setVisible(false);
  }, []);

  useLayoutEffect(() => {
    if (pathname !== "/" || reducedMotion) {
      setVisible(false);
      return;
    }

    let seen = false;
    try {
      seen = Boolean(window.localStorage.getItem(INTRO_STORAGE_KEY));
    } catch {
      seen = false;
    }

    if (seen) {
      setVisible(false);
      return;
    }

    try {
      window.localStorage.setItem(INTRO_STORAGE_KEY, "true");
    } catch {
      // ignore storage failures
    }

    setVisible(true);
    const timer = window.setTimeout(finish, INTRO_DURATION_MS);

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "Enter") finish();
    };
    window.addEventListener("keydown", onKey);

    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("keydown", onKey);
    };
  }, [finish, pathname, reducedMotion]);

  if (!visible) return null;

  const durationSec = INTRO_DURATION_MS / 1000;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="arrival-intro fixed inset-0 z-[200] overflow-hidden text-white"
          initial={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0.96, y: "-100%" }}
          transition={{ duration: 0.55, ease: [0.76, 0, 0.24, 1] }}
          role="dialog"
          aria-modal="true"
          aria-label="Al Qibla Air Services introduction"
        >
          <div className="arrival-sky absolute inset-0" />
          <div className="arrival-cloud arrival-cloud-far absolute inset-x-[-12%] bottom-[15%] h-[44%]" />
          <div className="arrival-cloud arrival-cloud-near absolute inset-x-[-16%] bottom-[-18%] h-[48%]" />
          <div className="arrival-vignette absolute inset-0" />

          {/* Brand mark early — readable within the first beat */}
          <motion.div
            className="absolute left-5 top-5 z-30 flex items-center gap-3 sm:left-8 sm:top-8"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: [0, 1, 1, 0], y: [-8, 0, 0, -6] }}
            transition={{ duration: durationSec, times: [0, 0.08, 0.88, 1] }}
          >
            <div className="relative h-11 w-11 overflow-hidden sm:h-12 sm:w-12">
              <Image
                src={assetPath(LOGO_PATH)}
                alt=""
                fill
                sizes="48px"
                className="object-contain"
                loading="eager"
              />
            </div>
            <div>
              <p className="font-brand text-sm font-bold tracking-[0.12em] sm:text-base">AL QIBLA</p>
              <p className="text-[9px] font-semibold tracking-[0.3em] text-white/60 sm:text-[10px]">
                AIR SERVICES
              </p>
            </div>
          </motion.div>

          {/* One aircraft path — cinematic, not busy */}
          <motion.div
            className="arrival-aircraft absolute z-20 aspect-[16/8.5] w-[135vw] max-w-[1600px] overflow-hidden transform-gpu sm:w-[94vw]"
            initial={{ x: "-74%", y: "34%", scale: 0.4, rotate: -2, opacity: 0 }}
            animate={{
              x: ["-74%", "-18%", "38%"],
              y: ["34%", "6%", "-32%"],
              scale: [0.4, 0.72, 0.98],
              rotate: [-2, -5, -8],
              opacity: ready ? [0, 1, 1, 0.95] : 0,
            }}
            transition={{
              duration: 2.35,
              times: [0, 0.4, 1],
              ease: [0.22, 0.72, 0.2, 1],
            }}
          >
            <Image
              src={assetPath("/assets/aircraft/arrival-aircraft-hq.webp")}
              alt=""
              width={1200}
              height={675}
              sizes="(max-width: 640px) 135vw, 94vw"
              className="h-full w-full select-none object-cover object-[68%_35%] drop-shadow-[0_28px_32px_rgba(0,10,28,0.32)]"
              loading="eager"
              onLoad={() => setReady(true)}
              onError={finish}
              draggable={false}
            />
          </motion.div>

          {/* Tagline early so Skip doesn’t hide the brand message */}
          <motion.div
            className="absolute inset-x-0 bottom-[18%] z-30 flex flex-col items-center px-6 text-center sm:bottom-[22%]"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: [0, 1, 1, 0], y: [12, 0, 0, -4] }}
            transition={{ duration: durationSec, times: [0.12, 0.28, 0.86, 1] }}
          >
            <p className="font-brand text-2xl font-bold tracking-tight sm:text-4xl">
              Travel Smart. Travel Safe.
            </p>
            <p className="mt-2 text-xs font-semibold uppercase tracking-[0.28em] text-gold-light sm:text-sm">
              Travel with Al Qibla
            </p>
          </motion.div>

          <motion.div
            className="absolute inset-x-0 bottom-0 z-40 h-[3px] bg-white/10"
            aria-hidden="true"
          >
            <motion.div
              className="h-full bg-[#e4ad3d] shadow-[0_0_18px_rgba(228,173,61,0.6)]"
              initial={{ width: 0 }}
              animate={{ width: "100%" }}
              transition={{ duration: durationSec, ease: "linear" }}
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
