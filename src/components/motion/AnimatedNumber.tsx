"use client";

import { useEffect, useRef } from "react";
import { animate, useInView, useMotionValue, useReducedMotion } from "framer-motion";

interface AnimatedNumberProps {
  value: number;
  className?: string;
  prefix?: string;
}

/** Counts up to `value` when scrolled into view. Falls back to static text. */
export function AnimatedNumber({ value, className, prefix = "" }: AnimatedNumberProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const reduced = useReducedMotion();
  const motionValue = useMotionValue(reduced ? value : 0);

  useEffect(() => {
    if (!inView || reduced) return;
    const controls = animate(motionValue, value, { duration: 0.8, ease: "easeOut" });
    return controls.stop;
  }, [inView, reduced, value, motionValue]);

  useEffect(() => {
    const unsubscribe = motionValue.on("change", (latest) => {
      if (ref.current) {
        ref.current.textContent = `${prefix}${Math.round(latest).toLocaleString("en-PK")}`;
      }
    });
    return unsubscribe;
  }, [motionValue, prefix]);

  return (
    <span ref={ref} className={className}>
      {prefix}
      {(reduced ? value : 0).toLocaleString("en-PK")}
    </span>
  );
}
