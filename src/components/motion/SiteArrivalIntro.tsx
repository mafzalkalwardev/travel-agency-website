"use client";

import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { assetPath } from "@/lib/base-path";
import { LOGO_PATH } from "@/lib/constants";

const INTRO_DURATION_MS = 3100;

export function SiteArrivalIntro() {
  const pathname = usePathname();
  const reducedMotion = useReducedMotion();
  const [visible, setVisible] = useState(false);

  const finish = useCallback(() => {
    setVisible(false);
  }, []);

  useEffect(() => {
    if (pathname !== "/" || reducedMotion) return;

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

          <motion.div
            className="absolute left-5 top-5 z-30 flex items-center gap-3 sm:left-8 sm:top-8"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: [0, 1, 1, 0], y: [-10, 0, 0, -8] }}
            transition={{ duration: 2.75, times: [0, 0.16, 0.76, 1] }}
          >
            <div className="relative h-11 w-11 overflow-hidden rounded-xl border border-white/15 bg-white/10 shadow-2xl backdrop-blur sm:h-12 sm:w-12">
              <Image
                src={assetPath(LOGO_PATH)}
                alt=""
                fill
                sizes="48px"
                className="object-contain p-0.5"
                loading="eager"
              />
            </div>
            <div>
              <p className="font-brand text-sm font-bold tracking-[0.12em] sm:text-base">AL QIBLA</p>
              <p className="text-[9px] font-semibold tracking-[0.3em] text-white/60 sm:text-[10px]">AIR SERVICES</p>
            </div>
          </motion.div>

          <motion.div
            className="arrival-aircraft absolute z-20 transform-gpu"
            initial={{ x: "-94%", y: "44%", scale: 0.34, rotate: -2, opacity: 0 }}
            animate={{
              x: ["-94%", "-34%", "5%", "72%"],
              y: ["44%", "10%", "-10%", "-55%"],
              scale: [0.34, 0.62, 0.88, 1.12],
              rotate: [-2, -4, -7, -10],
              opacity: [0, 1, 1, 0.98],
            }}
            transition={{ duration: 2.72, times: [0, 0.34, 0.7, 1], ease: [0.22, 0.72, 0.2, 1] }}
          >
            <Image
              src={assetPath("/assets/aircraft/arrival-aircraft-hq.webp")}
              alt=""
              width={3344}
              height={1882}
              sizes="(max-width: 640px) 135vw, 94vw"
              className="h-auto w-full select-none drop-shadow-[0_28px_32px_rgba(0,10,28,0.32)]"
              loading="eager"
              fetchPriority="high"
              draggable={false}
            />
          </motion.div>

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
